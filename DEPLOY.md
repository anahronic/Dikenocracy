# Deploying dikenocracy.com

Canonical source: this repository, branch `main` (= the tested release branch). Production: `ssh dikenocracy`
(admin@37.27.244.96), web root `/var/www/html`. Nothing deploys automatically; CI (`.github/workflows/site.yml`)
only checks and produces `release-manifest.json`.

Retired on 2026-11-17 (owner decision): the **Keeper of Knowledge** (AI assistant, widget, corpus, local model) and
**Market Lens** (`/api/` on this server). Their former public paths answer 410 Gone; their code is in Git history
(engine tag `release-c9909c6-1d40ec7b8562`, this repository before the retirement commit, `anahronic/market-lens`).
Do not reinstall them.

## 1. Protocol Lab (API + Lab page, one release)

From the engine repository (`anahronic/dkp-l8-simulation-engine`, `main`), with both trees clean:

```bash
PYTHONUTF8=1 PYTHON=<venv python> bash deploy/local/make_release.sh <engine repo> <this repo> <empty out dir>
# copy the out dir + `git archive HEAD deploy` to /home/admin/releases/<VERSION>/ ; sha256sum -c SHA256SUMS
bash deploy/server/30_app.sh $PWD/engine-<V>.tar.gz <V>       # switches /opt/dkp-lab/current
bash deploy/server/40_nginx.sh                                 # only when deploy/server/nginx/* changed
bash deploy/server/50_site.sh $PWD/labpage-<V>.tar.gz          # /projects/protocol-lab/ only
PUBLIC_IP=37.27.244.96 bash deploy/server/90_postdeploy_check.sh
# rollback: bash deploy/server/99_rollback.sh app <previous VERSION> | site | nginx
```

## 2. Static pages (HTML/CSS/JS/assets)

Build (`python website/tools/build_site_css.py`, `python website/tools/apply_chrome.py`; protocol releases:
`python website/build_release.py --world ../World --release-date YYYY-MM-DD`), back up the changed files on the server,
copy them unchanged into `/var/www/html` (files 644, directories 755). A changed stylesheet or script gets a new dated
name (Cloudflare caches 4 h). Protocol pages load `/feedback/feedback-<date>.js` (the "Leave feedback" button);
`build_release.py` adds it. Compare with `python ci/release_manifest.py` (served files are identical to the repo).

Local checks: `python ci/check_site.py`, `python ci/secret_scan.py`, `node website/tools/test_converter_dti.mjs`,
`node website/tools/test_converter_hebrew.mjs`, and the browser test of the feedback button
`PW_DIR=<dir with node_modules/playwright[-core]> CHROME=<chrome> node tools/feedback_widget_test.mjs`.

## 3. Error pages, nginx, feedback service, ops

- `python website/tools/make_error_pages.py` → `/var/www/dkp-errors/errors/` (root, 644).
- nginx files in `server/nginx/` (installed names in each header; live copies in `server/nginx/live/`); always
  `sudo nginx -t` before `sudo systemctl reload nginx`. `retired.conf` (→ `snippets/dkp-retired.conf`) answers every
  unowned `/api/` path with 410 JSON. Do not change SSH settings.
- Feedback: `services/feedback/README.md` (`build_registry.py` from World, `install.sh <release>`); delivery settings
  in `/etc/dkp-feedback/feedback.env` (`FEEDBACK_TO=support@dikenocracy.com`; transport: see
  `FEEDBACK_EMAIL_ACTIVATION_2026-11-17.md` in the project folder).
- Monitoring/backups: `server/ops/` → `/usr/local/sbin/dkp-{monitor,backup}.sh` + timers; status
  `/var/lib/dkp-monitor/status.json`, archives `/var/backups/dkp` (key `/etc/dkp-backup/key`, keep a copy offline).
  The monitor also asserts that the retired paths stay 410.
