# Keeper widget

The 47 host HTML pages include `/keeper/keeper-loader.js` once, with `defer`.
Both HTML templates in `website/build_release.py` retain it. Protocol document
IDs come from the existing manifest and the template's canonical document ID.
`panel.html` is an internal iframe resource and deliberately has no launcher.

The loader is under 6,000 UTF-8 bytes. Its shadow DOM contains a 48px launcher
and a nonmodal dialog. It observes HTML language/direction, without reading
language preferences from storage. The panel and its assets load only on open.
The iframe never receives `allow-same-origin`; all fetches omit credentials and
referrers. Only the explicit context allowlist is posted to the frame. Selected
text is inspected for prohibited/hidden ranges before reading, and shared only
through the separate selection action. Closing keeps the panel in memory;
Cancel stops generation or requests authenticated job cancellation.

The panel accepts context only from its parent. Ask requests contain only
question, language, page URL/document ID, optional selection, and stream=true.
Proposal edits apply the declared module field to each proposed variant; server
validation runs before job creation. Job credentials live only in memory.
Result cards use the authenticated report endpoint; explanations are separate.
No site CSS, external assets, storage, telemetry, or engine bundle is imported.

## API integration requirement

An opaque sandbox sends API requests with `Origin: null`, even when both URLs
are hosted on the same site. The API or reverse proxy must allow these requests:

- `Access-Control-Allow-Origin: null` (or `*` for these credential-free APIs).
- Successful OPTIONS preflight for GET/POST and Content-Type, Authorization,
  Idempotency-Key headers.
- `Access-Control-Expose-Headers: Retry-After` on error responses too.

Keep Bearer-token authorization on all private lab job endpoints. CORS origin
alone is not authorization. No server or proxy changes were made in this task;
production headers were not checked. The browser test uses real cross-origin
fetches to a loopback fake API, including preflight and opaque-origin headers.

## Route checks and live-only injection

`ROUTES.json` inventories 51 host routes: 47 in the repository and four available
only on the live server. Ayalon is already included in the 47. No server was
contacted and the live-only entries remain marked not included/unverified.

```powershell
python tools/keeper_inject.py --check --repo-only website
python tools/keeper_inject.py --check website
# On a complete staged site tree, when deployment is separately authorized:
python tools/keeper_inject.py SITE shadoo/index.html survival/index.html survival/ru.html AA/Alienclimber/index.html
python tools/keeper_inject.py --check SITE
```

The full check intentionally exits nonzero when any inventory route is missing,
has duplicate/missing loader tags, or lacks defer. The repository-only check
explicitly skips the four live-only routes. Injection is idempotent and refuses
to inject the sandbox panel or a path outside the given tree.

## Local tests

```powershell
$env:PW_DIR='C:/Users/anahr/AppData/Local/Temp/claude/e--/67d08bea-6279-4117-9a3c-8c10eec45e93/scratchpad/pyo'
node tools/keeper_widget_test.mjs
```

The test first uses the requested `createRequire(...)("playwright")` loader. The
supplied installation lacks its CommonJS index.js, so it falls back to that same
package's existing index.mjs, without installation or downloads. If neither can
load, it emits a clear JSON error. Chromium serves and accesses only loopback;
external page requests are aborted. Results are printed as JSON, with a nonzero
exit code on failure. On this machine use the existing Python 3.12 executable
if the default `python` command still points to the removed Python 3.10 install.
