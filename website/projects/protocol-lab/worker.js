/* Protocol Lab worker (module worker): runs the lab's Python code in Pyodide (CPython compiled to WebAssembly).
   Messages in:  {id, op: "init"|"catalog"|"requirements"|"example"|"validate"|"run", ...}
   Messages out: {id, ok, data} | {id, ok:false, error} | {id, progress, message}
   Nothing here evaluates text from the page: the page sends JSON that the Python side validates. */

import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";

const PYODIDE_VERSION = "314.0.7";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
let py = null;
let api = null;
let bundleInfo = null;

async function sha256Hex(bytes) {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function init() {
  if (api) return { bundle: bundleInfo };
  postMessage({ id: "init", progress: 0.05, message: "runtime" });
  py = await loadPyodide({ indexURL: PYODIDE_URL });
  postMessage({ id: "init", progress: 0.45, message: "pyyaml" });
  await py.loadPackage("pyyaml");
  postMessage({ id: "init", progress: 0.6, message: "bundle" });
  const meta = await (await fetch("dist/lab-bundle.json", { cache: "no-cache" })).json();
  const zip = new Uint8Array(await (await fetch("dist/lab-bundle.zip", { cache: "no-cache" })).arrayBuffer());
  const digest = await sha256Hex(zip);
  if (digest !== meta.bundle_sha256) throw new Error("bundle digest mismatch: " + digest);
  py.unpackArchive(zip, "zip", { extractDir: "/home/pyodide/engine" });
  postMessage({ id: "init", progress: 0.85, message: "import" });
  py.runPython(`
import os, sys
os.chdir("/home/pyodide/engine")
sys.path.insert(0, "/home/pyodide/engine")
from lab import api as _lab_api
`);
  api = py.globals.get("_lab_api");
  bundleInfo = { sha256: meta.bundle_sha256, files: meta.files, python: py.runPython("import sys; sys.version.split()[0]"),
                 pyodide: PYODIDE_VERSION };
  return { bundle: bundleInfo };
}

self.onmessage = async (ev) => {
  const msg = ev.data;
  try {
    let data;
    if (msg.op === "init") data = await init();
    else {
      await init();
      if (msg.op === "catalog") data = JSON.parse(api.catalog_json());
      else if (msg.op === "requirements") data = JSON.parse(api.requirements_json(String(msg.doc)));
      else if (msg.op === "example") data = JSON.parse(api.example_json(String(msg.module)));
      else if (msg.op === "validate") data = JSON.parse(api.validate_json(JSON.stringify(msg.request)));
      else if (msg.op === "run") {
        const progress = (frac, text) => postMessage({ id: msg.id, progress: frac, message: String(text) });
        const prov = JSON.stringify({ runtime: "browser (Pyodide)", pyodide: PYODIDE_VERSION,
                                      python: bundleInfo.python, bundle_sha256: bundleInfo.sha256,
                                      user_agent: (self.navigator && self.navigator.userAgent) || null,
                                      packaged_at_utc: new Date().toISOString() });
        data = JSON.parse(api.run_json(JSON.stringify(msg.request), progress, prov));
        if (data.ok) {
          const pkg = api.last_package();
          data.package = pkg.toJs();
          pkg.destroy();
        }
      } else throw new Error("unknown op " + msg.op);
    }
    postMessage({ id: msg.id, ok: true, data }, data && data.package ? [data.package.buffer] : []);
  } catch (err) {
    postMessage({ id: msg.id, ok: false, error: String((err && err.message) || err) });
  }
};
