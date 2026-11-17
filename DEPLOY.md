# Deploying dikenocracy.com

Canonical source: this repository, branch `main` (= the tested release branch). Production: `ssh dikenocracy`
(admin@37.27.244.96), web root `/var/www/html`. Nothing deploys automatically; CI (`.github/workflows/site.yml`)
only checks and produces `release-manifest.json`.

## 1. Lab, Keeper, widget, Lab page (one release)

From the engine repository (`anahronic/dkp-l8-simulation-engine`, `main`), with this repository clean:

```bash
PYTHONUTF8=1 PYTHON=<venv python> KEEPER_SITE_PAGES=<this repo>/website KEEPER_RU_SOURCES=<private ru-sources> \
  bash deploy/local/make_release.sh <engine repo> <this repo> <empty out dir>
# copy the out dir + `git archive HEAD deploy` to /home/admin/releases/<VERSION>/ ; sha256sum -c SHA256SUMS
bash deploy/server/30_app.sh $PWD/engine-<V>.tar.gz $PWD/corpus-<C>.jsonl <V>     # switches /opt/dkp-lab/current
bash deploy/server/50_site.sh $PWD/widget-<V>.tar.gz                              # widget + Lab page, loader on all routes
PUBLIC_IP=37.27.244.96 bash deploy/server/90_postdeploy_check.sh
# rollback: bash deploy/server/99_rollback.sh app <previous VERSION> | site | nginx
```

## 2. Static pages (HTML/CSS/assets)

Build (`python website/tools/build_site_css.py`, `python website/tools/apply_chrome.py`; protocol releases:
`python website/build_release.py --world ../World --release-date YYYY-MM-DD`), back up the changed files on the server,
copy them, then `python3 keeper/keeper_inject.py . <changed html…>` and `python3 keeper/keeper_inject.py --check
--routes keeper/ROUTES.json .` in `/var/www/html`. A changed stylesheet gets a new dated name (Cloudflare caches 4 h).
Compare with `python ci/release_manifest.py` (HTML without the loader line).

## 3. Error pages, nginx, feedback service, ops

- `python website/tools/make_error_pages.py` → `/var/www/dkp-errors/errors/` (root, 644).
- nginx files in `server/nginx/` (installed names in each header; live copies in `server/nginx/live/`); always
  `sudo nginx -t` before `sudo systemctl reload nginx`. Do not change SSH settings.
- Feedback: `services/feedback/README.md` (`build_registry.py` from World, `install.sh <release>`); recipient in
  `/etc/dkp-feedback/feedback.env` (owner).
- Monitoring/backups: `server/ops/` → `/usr/local/sbin/dkp-{monitor,backup}.sh` + timers; status
  `/var/lib/dkp-monitor/status.json`, archives `/var/backups/dkp` (key `/etc/dkp-backup/key`, keep a copy offline).
