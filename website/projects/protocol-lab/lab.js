/* Protocol Lab — page logic. All text from data is inserted with textContent (never as HTML). */

const T = {
  en: {
    title: "Protocol Lab",
    subtitle: "Check protocol provisions on declared cases and repeat every result",
    "about.heading": "What this is",
    "about.p1": "Choose a question, set the conditions, run a real computation in your browser and get a report that explains every result. Your inputs stay on your device; nothing is sent to the server.",
    "about.k1": "Compliance", "about.v1": "are the checked provisions met in this experiment?",
    "about.k2": "Model validity", "about.v2": "which data and assumptions link the model to a real system? Shown separately as hypotheses.",
    "about.k3": "Readiness for use", "about.v3": "never granted here: results are research outputs (operational_use: false), not an admission under DKP-8-SIMULATION-001.",
    "modules.heading": "Experiments",
    "modules.counts": (p, m, r) => `${p} protocols in the catalog; ${m} experiment modules installed; ${r} provisions registered.`,
    "modules.try": "Try example", "modules.configure": "Configure",
    "setup.add": "Add variant", "setup.validate": "Check input", "setup.run": "Run", "setup.cancel": "Cancel",
    "setup.import": "Import request", "setup.export": "Export request", "setup.hypotheses": "Declared hypotheses of this module",
    "setup.variant": "Variant", "setup.remove": "Remove", "setup.ok": "Input is valid.",
    "setup.changed": "changed from the text value: this variant is a hypothesis",
    "result.heading": "Result", "result.package": "Download replay package", "result.json": "Download result.json",
    "result.compare": "Variants side by side", "result.checks": "Checks", "result.uncovered": "Provisions not covered by this experiment",
    "result.explain": "Why", "result.ids": "Identity",
    "coverage.heading": "Protocol coverage",
    "coverage.p1": "Provisions of each registered document are listed with an exact quote; documents still being registered are marked. Coverage is computed from the registry: a document card is not a finished simulator.",
    "coverage.doc": "Document", "coverage.layer": "Layer", "coverage.reqs": "Provisions", "coverage.impl": "Implemented",
    "coverage.part": "Partial", "coverage.not": "Not yet", "coverage.nc": "Not computable", "coverage.blk": "Blocked",
    "coverage.unregistered": "not yet registered", "coverage.unresolved": "Referenced but absent from the corpus:",
    "repeat.heading": "Repeat outside the site",
    "repeat.p1": "Each replay package contains the request, the result, the report and the code version. Recompute it with the open-source engine:",
    "status.loading": "Loading the computation engine…", "status.ready": (b) => `Engine ready (Python ${b.python} in your browser; bundle ${b.sha256.slice(0, 12)})`,
    "status.failed": "The engine could not be loaded: ", "status.running": "Running…", "status.cancelled": "Cancelled.",
    "col.req": "Provision", "col.status": "Status", "col.expl": "Explanation", "col.variant": "Variant",
    "src.text": "text", "src.calibration": "calibration", "src.hypothesis": "hypothesis", "src.user": "your input", "src.alternative": "alternative",
  },
  ru: {
    title: "Лаборатория протоколов",
    subtitle: "Проверка положений протоколов на заданных случаях с повторяемым результатом",
    "about.heading": "Что это",
    "about.p1": "Выберите вопрос, задайте условия, запустите настоящий расчёт прямо в браузере и получите отчёт с объяснением каждого результата. Введённые данные остаются на вашем устройстве и на сервер не отправляются.",
    "about.k1": "Соответствие", "about.v1": "выполнены ли проверяемые положения в этом эксперименте?",
    "about.k2": "Обоснованность модели", "about.v2": "какие данные и допущения связывают модель с реальной системой? Показываются отдельно как гипотезы.",
    "about.k3": "Готовность к применению", "about.v3": "здесь не выдаётся: результаты исследовательские (operational_use: false), это не допуск по DKP-8-SIMULATION-001.",
    "modules.heading": "Эксперименты",
    "modules.counts": (p, m, r) => `Протоколов в каталоге: ${p}; установлено модулей экспериментов: ${m}; зарегистрировано положений: ${r}.`,
    "modules.try": "Запустить пример", "modules.configure": "Настроить",
    "setup.add": "Добавить вариант", "setup.validate": "Проверить ввод", "setup.run": "Запустить", "setup.cancel": "Отменить",
    "setup.import": "Загрузить запрос", "setup.export": "Сохранить запрос", "setup.hypotheses": "Объявленные гипотезы модуля",
    "setup.variant": "Вариант", "setup.remove": "Удалить", "setup.ok": "Ввод корректен.",
    "setup.changed": "изменено относительно значения из текста: вариант становится гипотезой",
    "result.heading": "Результат", "result.package": "Скачать пакет повторения", "result.json": "Скачать result.json",
    "result.compare": "Варианты рядом", "result.checks": "Проверки", "result.uncovered": "Положения вне охвата эксперимента",
    "result.explain": "Почему", "result.ids": "Идентичность",
    "coverage.heading": "Покрытие протоколов",
    "coverage.p1": "Положения каждого зарегистрированного документа приведены с точной цитатой; документы, которые ещё регистрируются, отмечены. Покрытие вычисляется из реестра: карточка документа не означает готовый симулятор.",
    "coverage.doc": "Документ", "coverage.layer": "Слой", "coverage.reqs": "Положений", "coverage.impl": "Реализовано",
    "coverage.part": "Частично", "coverage.not": "Пока нет", "coverage.nc": "Не вычислимо", "coverage.blk": "Заблокировано",
    "coverage.unregistered": "ещё не зарегистрирован", "coverage.unresolved": "Упоминаются, но отсутствуют в корпусе:",
    "repeat.heading": "Повторить вне сайта",
    "repeat.p1": "Пакет повторения содержит запрос, результат, отчёт и версию кода. Пересчитайте его открытым движком:",
    "status.loading": "Загрузка вычислительного движка…", "status.ready": (b) => `Движок готов (Python ${b.python} в вашем браузере; пакет ${b.sha256.slice(0, 12)})`,
    "status.failed": "Не удалось загрузить движок: ", "status.running": "Расчёт…", "status.cancelled": "Отменено.",
    "col.req": "Положение", "col.status": "Статус", "col.expl": "Объяснение", "col.variant": "Вариант",
    "src.text": "текст", "src.calibration": "калибровка", "src.hypothesis": "гипотеза", "src.user": "ваш ввод", "src.alternative": "альтернатива",
  },
};

let lang = "en";
try { lang = localStorage.getItem("lab.lang") || (navigator.language || "en").slice(0, 2); } catch (_) {}
if (!T[lang]) lang = "en";
const t = (k, ...a) => { const v = T[lang][k] ?? T.en[k] ?? k; return typeof v === "function" ? v(...a) : v; };
const L = (o) => (o && typeof o === "object" ? (o[lang] ?? o.en ?? "") : String(o ?? ""));
const $ = (id) => document.getElementById(id);
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v; else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else if (v !== undefined && v !== null) n.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return n;
}

/* worker bridge ------------------------------------------------------------ */
let worker = null, seq = 0, pending = new Map(), bundle = null;
function startWorker() {
  worker = new Worker("worker.js", { type: "module" });
  worker.onmessage = (ev) => {
    const m = ev.data;
    if (m.progress !== undefined) { onProgress(m.id, m.progress, m.message); return; }
    const p = pending.get(m.id); if (!p) return;
    pending.delete(m.id);
    m.ok ? p.resolve(m.data) : p.reject(new Error(m.error));
  };
}
function call(op, payload = {}) {
  const id = String(++seq);
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); worker.postMessage({ id, op, ...payload }); });
}
function onProgress(id, frac, message) {
  if (id === "init") { $("engine-status").textContent = `${t("status.loading")} ${Math.round(frac * 100)}%`; return; }
  $("progress-bar").value = frac; $("progress-text").textContent = message;
}

/* state -------------------------------------------------------------------- */
let catalog = null, module = null, variants = [], lastResult = null, lastPackage = null, running = null;

function applyI18n() {
  document.documentElement.lang = lang;
  for (const n of document.querySelectorAll("[data-i18n]")) n.textContent = t(n.dataset.i18n);
  for (const b of document.querySelectorAll(".lab-lang__btn")) b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
  if (bundle) $("engine-status").textContent = t("status.ready", bundle);
  if (catalog) { renderModules(); renderCoverage(); }
  if (module) renderSetup();
  if (lastResult) renderResult(lastResult);
}

/* modules ------------------------------------------------------------------ */
function renderModules() {
  const reqs = catalog.documents.reduce((s, d) => s + d.requirements, 0);
  $("modules-counts").textContent = t("modules.counts", catalog.counts.protocols, catalog.modules.length, reqs);
  const box = $("module-cards"); box.replaceChildren();
  for (const m of catalog.modules) {
    box.append(el("div", { class: "card" },
      el("span", { class: "card__label", text: m.protocols.join(", ") }),
      el("h3", { class: "card__title", text: L(m.title) }),
      el("p", { class: "card__text", text: L(m.summary) }),
      el("div", { class: "lab-actions" },
        el("button", { type: "button", class: "btn", text: t("modules.try"), onclick: () => chooseModule(m.id, true) }),
        el("button", { type: "button", class: "btn btn--secondary", text: t("modules.configure"), onclick: () => chooseModule(m.id, false) }))));
  }
}

async function chooseModule(id, runNow) {
  module = catalog.modules.find((m) => m.id === id);
  const ex = await call("example", { module: id });
  variants = ex.variants.slice(0, runNow ? 2 : 1).map((v) => ({ name: v.name, input: v.input }));
  $("setup").classList.remove("lab-hidden");
  renderSetup();
  $("setup").scrollIntoView({ behavior: "smooth" });
  if (runNow) run();
}

/* setup form --------------------------------------------------------------- */
function defaultsOf(spec) { const o = {}; for (const [k, s] of Object.entries(spec)) if ("default" in s) o[k] = s.default; return o; }
function sourceBadge(src) { return el("span", { class: `lab-badge lab-badge--${src}`, text: t(`src.${src}`) }); }

function fieldControl(key, spec, value, onChange) {
  const id = `f-${Math.random().toString(36).slice(2)}`;
  const wrap = el("div", { class: "lab-field" });
  const label = el("label", { for: id }, L(spec.label) || key, spec.unit ? ` (${spec.unit})` : "", sourceBadge(spec.source || "user"));
  wrap.append(label);
  let input;
  const changedNote = el("small");
  const markChanged = (v) => {
    const changed = (spec.source === "text" || spec.source === "calibration") && JSON.stringify(v) !== JSON.stringify(spec.default);
    changedNote.replaceChildren(changed ? el("span", { class: "lab-badge lab-badge--changed", text: t("setup.changed") }) : "");
  };
  if (spec.type === "enum") {
    input = el("select", { id }); for (const v of spec.values) input.append(el("option", { value: v, text: v }));
    input.value = value; input.onchange = () => { onChange(input.value); markChanged(input.value); };
  } else if (spec.type === "bool") {
    input = el("input", { id, type: "checkbox" }); input.checked = !!value;
    input.onchange = () => { onChange(input.checked); markChanged(input.checked); };
  } else if (spec.type === "int" || spec.type === "number") {
    input = el("input", { id, type: "number", step: spec.type === "int" ? "1" : "any", min: spec.min, max: spec.max }); input.value = value;
    input.oninput = () => { const v = input.value === "" ? null : Number(input.value); onChange(v); markChanged(v); };
  } else if (spec.type === "pair") {
    const a = el("input", { type: "number", step: "any", "aria-label": `${key} min` }), b = el("input", { id, type: "number", step: "any", "aria-label": `${key} max` });
    a.value = value[0]; b.value = value[1];
    const upd = () => { const v = [Number(a.value), Number(b.value)]; onChange(v); markChanged(v); };
    a.oninput = upd; b.oninput = upd; input = el("div", { class: "lab-pair" }, a, b);
  } else { // lists and strings: JSON text, validated by the engine
    input = el("textarea", { id, rows: spec.type === "list" ? 2 : 1 }); input.value = spec.type === "str" ? value : JSON.stringify(value);
    input.oninput = () => { try { const v = spec.type === "str" ? input.value : JSON.parse(input.value); onChange(v); markChanged(v); input.setCustomValidity(""); } catch (_) { input.setCustomValidity("JSON"); } };
  }
  wrap.append(input);
  if (spec.help) wrap.append(el("small", { text: L(spec.help) }));
  wrap.append(changedNote); markChanged(value);
  return wrap;
}

function renderSetup() {
  $("setup-heading").textContent = L(module.title);
  $("setup-summary").textContent = L(module.summary);
  $("setup-causal").textContent = module.causal_note ? L(module.causal_note) : "";
  const hyp = $("hypotheses-list"); hyp.replaceChildren();
  for (const h of module.hypotheses || []) hyp.append(el("li", {}, el("strong", { text: h.id }), ` (${h.source}): ${L(h.text)}`));
  const box = $("variants"); box.replaceChildren();
  variants.forEach((v, i) => {
    const full = { ...defaultsOf(module.inputs), ...v.input };
    v.input = full;
    const nameInput = el("input", { type: "text", "aria-label": t("setup.variant") }); nameInput.value = v.name;
    nameInput.oninput = () => { v.name = nameInput.value; };
    const head = el("div", { class: "lab-variant__head" }, el("strong", { text: `${t("setup.variant")} ${i + 1}` }), nameInput,
      variants.length > 1 ? el("button", { type: "button", class: "btn btn--secondary", text: t("setup.remove"), onclick: () => { variants.splice(i, 1); renderSetup(); } }) : null);
    const fields = el("div", { class: "lab-fields" });
    for (const [k, spec] of Object.entries(module.inputs)) fields.append(fieldControl(k, spec, full[k], (val) => { v.input[k] = val; }));
    box.append(el("div", { class: "lab-variant" }, head, fields));
  });
  $("add-variant").disabled = variants.length >= 6;
  saveDraft();
}

function request() { return { schema: "dkp-lab-input/1", module: module.id, variants: variants.map((v) => ({ name: v.name, input: v.input })) }; }
function showProblems(list) { const ul = $("problems"); ul.replaceChildren(...(list || []).map((p) => el("li", { text: p }))); }
function saveDraft() { try { localStorage.setItem("lab.draft", JSON.stringify(request())); } catch (_) {} }

async function validate() {
  const r = await call("validate", { request: request() });
  showProblems(r.ok ? [t("setup.ok")] : r.problems);
  return r.ok;
}

async function run() {
  if (running) return;
  saveDraft();
  showProblems([]);
  $("progress").classList.remove("lab-hidden"); $("progress-bar").value = 0; $("progress-text").textContent = t("status.running");
  $("run").disabled = true; $("cancel").disabled = false;
  running = call("run", { request: request() });
  try {
    const r = await running;
    if (!r.ok) { showProblems(r.problems); return; }
    lastResult = r.result; lastPackage = r.package;
    renderResult(lastResult);
    $("result").classList.remove("lab-hidden"); $("result").scrollIntoView({ behavior: "smooth" });
  } catch (e) {
    showProblems([String(e.message || e)]);
  } finally {
    running = null; $("run").disabled = false; $("cancel").disabled = true; $("progress").classList.add("lab-hidden");
  }
}

function cancel() {
  if (!running) return;
  worker.terminate();
  for (const p of pending.values()) p.reject(new Error(t("status.cancelled")));
  pending.clear(); bundle = null;
  startWorker();
  call("init").then((d) => { bundle = d.bundle; $("engine-status").textContent = t("status.ready", bundle); });
}

/* result ------------------------------------------------------------------- */
function fmt(v) { return typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toPrecision(6)) : String(v); }
function table(headers, rows) {
  return el("div", { class: "lab-table-wrap" }, el("table", { class: "lab-table" },
    el("thead", {}, el("tr", {}, headers.map((h) => el("th", { scope: "col", text: h })))),
    el("tbody", {}, rows.map((r) => el("tr", {}, r.map((c) => (c instanceof Node ? el("td", {}, c) : el("td", { class: typeof c === "number" ? "num" : "", text: fmt(c) }))))))));
}

function renderResult(doc) {
  const body = $("result-body"); body.replaceChildren();
  if (doc.causal_note) body.append(el("p", { class: "lab-note", text: L(doc.causal_note) }));
  const comp = doc.comparison;
  if (comp.metrics.length) {
    body.append(el("h3", { text: t("result.compare") }));
    body.append(table([t("col.variant"), ...comp.metrics, "PASS", "FAIL", "UNKNOWN"],
      comp.rows.map((r) => [r.variant, ...comp.metrics.map((k) => r.metrics[k]), r.checks.PASS, r.checks.FAIL, r.checks.UNKNOWN])));
    body.append(el("p", { class: "lab-note", text: L(comp.note) }));
  }
  for (const [name, v] of Object.entries(doc.variants)) {
    body.append(el("h3", { text: name }));
    body.append(el("p", { class: "lab-sentence", text: L(v.summary.sentence) }));
    if (v.explain.length) body.append(el("h4", { text: t("result.explain") }), el("ul", {}, v.explain.map((e) => el("li", { text: L(e) }))));
    body.append(el("h4", { text: t("result.checks") }));
    body.append(table([t("col.req"), t("col.status"), t("col.expl")], v.checks.map((c) => [
      el("button", { type: "button", class: "linklike", text: c.requirement_id, onclick: () => showRequirement(c.requirement_id) }),
      el("span", { class: `st st--${c.status}`, text: c.status }),
      c.explanation + (c.applicability ? ` — ${c.applicability}` : "")])));
    if (v.summary.uncovered.length) body.append(el("details", { class: "lab-hyp" }, el("summary", { text: `${t("result.uncovered")} (${v.summary.uncovered.length})` }),
      el("p", { class: "lab-ids", text: v.summary.uncovered.join(", ") })));
  }
  body.append(el("h3", { text: t("result.ids") }),
    el("p", { class: "lab-ids", text: `input_id ${doc.input_id}` }), el("p", { class: "lab-ids", text: `result_id ${doc.result_id}` }),
    el("p", { class: "lab-ids", text: `lab ${doc.identity.lab_version} · engine ${doc.identity.engine_version} · corpus World ${doc.identity.corpus.commit.slice(0, 12)} · operational_use: false` }));
}

function download(name, bytes, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = el("a", { href: url, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* coverage ----------------------------------------------------------------- */
function renderCoverage() {
  const box = $("coverage"); box.replaceChildren();
  const rows = catalog.documents.map((d) => [
    el("button", { type: "button", class: "linklike", text: d.id, onclick: () => showRequirements(d.id) }),
    d.layer || d.kind, d.registered ? d.requirements : t("coverage.unregistered"),
    d.coverage.IMPLEMENTED || 0, d.coverage.PARTIAL || 0, d.coverage.NOT_IMPLEMENTED || 0, d.coverage.NOT_COMPUTABLE || 0, d.coverage.BLOCKED || 0]);
  box.append(table([t("coverage.doc"), t("coverage.layer"), t("coverage.reqs"), t("coverage.impl"), t("coverage.part"), t("coverage.not"), t("coverage.nc"), t("coverage.blk")], rows));
  if (catalog.unresolved_dependencies.length)
    box.append(el("p", { class: "lab-note", text: `${t("coverage.unresolved")} ${catalog.unresolved_dependencies.map((u) => `${u.raw} (${u.referenced_by.join(", ")})`).join("; ")}` }));
}

let reqCache = {};
async function showRequirements(doc) {
  reqCache[doc] = reqCache[doc] || (await call("requirements", { doc })).requirements;
  const box = $("requirements"); box.replaceChildren(el("h3", { text: doc }));
  const meta = catalog.documents.find((d) => d.id === doc);
  if (meta && meta.site_url) box.append(el("p", {}, el("a", { href: meta.site_url, text: meta.site_url })));
  box.append(table(["id", "§", t("col.req"), t("col.status"), "quote"], reqCache[doc].map((r) => [r.id, r.section, r.title, r.coverage, r.quote])));
  box.scrollIntoView({ behavior: "smooth" });
}
async function showRequirement(id) {
  const doc = catalog.prefixes[id.split("-")[0]];
  if (doc) await showRequirements(doc);
}

/* wiring ------------------------------------------------------------------- */
for (const b of document.querySelectorAll(".lab-lang__btn")) b.onclick = () => { lang = b.dataset.lang; try { localStorage.setItem("lab.lang", lang); } catch (_) {} applyI18n(); };
$("add-variant").onclick = () => { const last = variants[variants.length - 1]; variants.push({ name: `v${variants.length + 1}`, input: JSON.parse(JSON.stringify(last.input)) }); renderSetup(); };
$("validate").onclick = validate;
$("run").onclick = run;
$("cancel").onclick = cancel;
$("export-request").onclick = () => download(`lab-request-${module.id}.json`, JSON.stringify(request(), null, 1), "application/json");
$("import-request").onchange = async (ev) => {
  const f = ev.target.files[0]; if (!f) return;
  try {
    const req = JSON.parse(await f.text());
    const m = catalog.modules.find((x) => x.id === req.module); if (!m) throw new Error(`unknown module ${req.module}`);
    module = m; variants = req.variants.map((v) => ({ name: v.name, input: v.input }));
    $("setup").classList.remove("lab-hidden"); renderSetup(); await validate();
  } catch (e) { showProblems([String(e.message || e)]); }
  ev.target.value = "";
};
$("download-package").onclick = () => lastPackage && download(`protocol-lab-${lastResult.module.id}-${lastResult.result_id.slice(0, 12)}.zip`, lastPackage, "application/zip");
$("download-result").onclick = () => lastResult && download("result.json", JSON.stringify(lastResult, null, 1), "application/json");

(async function main() {
  applyI18n();
  $("engine-status").textContent = t("status.loading");
  startWorker();
  try {
    bundle = (await call("init")).bundle;
    $("engine-status").textContent = t("status.ready", bundle);
    catalog = await call("catalog");
    renderModules(); renderCoverage();
    try {
      const draft = JSON.parse(localStorage.getItem("lab.draft") || "null");
      const m = draft && catalog.modules.find((x) => x.id === draft.module);
      if (m) { module = m; variants = draft.variants; $("setup").classList.remove("lab-hidden"); renderSetup(); }
    } catch (_) {}
  } catch (e) {
    $("engine-status").textContent = t("status.failed") + (e.message || e);
  }
})();
