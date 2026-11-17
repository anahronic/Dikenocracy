#!/usr/bin/env bash
# Installs or updates the feedback service on the dikenocracy.com server. Run as admin (uses sudo), from a directory
# that holds app.py, feedback_cli.py, registry.json, requirements.txt, dkp-feedback.service and the nginx files.
#   bash install.sh <release-id>
set -euo pipefail
rel=${1:?release id}; src=$(cd "$(dirname "$0")" && pwd); dst=/opt/dkp-feedback/releases/$rel
id dkpfeedback >/dev/null 2>&1 || sudo useradd --system --home /var/lib/dkp-feedback --shell /usr/sbin/nologin dkpfeedback
sudo install -d -o root -g root -m 755 /opt/dkp-feedback /opt/dkp-feedback/releases
sudo install -d -o dkpfeedback -g dkpfeedback -m 700 /var/lib/dkp-feedback
sudo install -d -o root -g dkpfeedback -m 750 /etc/dkp-feedback
[[ -e /etc/dkp-feedback/feedback.env ]] || { printf '# Set FEEDBACK_TO, FEEDBACK_FROM, FEEDBACK_SMTP_HOST [, FEEDBACK_SMTP_PORT, FEEDBACK_SMTP_USER, FEEDBACK_SMTP_PASSWORD]\n' | sudo tee /etc/dkp-feedback/feedback.env >/dev/null; sudo chown root:dkpfeedback /etc/dkp-feedback/feedback.env; sudo chmod 640 /etc/dkp-feedback/feedback.env; }
if [[ ! -d $dst ]]; then
  sudo install -d -o root -g root -m 755 "$dst"
  sudo install -m 644 "$src/app.py" "$src/feedback_cli.py" "$src/registry.json" "$src/requirements.txt" "$dst/"
  sudo python3 -m venv "$dst/venv"
  sudo "$dst/venv/bin/pip" install --quiet --require-hashes -r "$dst/requirements.txt" 2>/dev/null || sudo "$dst/venv/bin/pip" install --quiet -r "$dst/requirements.txt"
fi
sudo ln -sfn "$dst" /opt/dkp-feedback/current.new && sudo mv -T /opt/dkp-feedback/current.new /opt/dkp-feedback/current
sudo install -m 644 "$src/dkp-feedback.service" /etc/systemd/system/dkp-feedback.service
sudo install -m 644 "$src/dkp-feedback.nginx.conf" /etc/nginx/snippets/dkp-feedback.conf
sudo install -m 644 "$src/dkp-feedback-limits.conf" /etc/nginx/conf.d/dkp-feedback-limits.conf
sudo systemctl daemon-reload && sudo systemctl enable --now dkp-feedback && sudo systemctl restart dkp-feedback
for i in $(seq 1 20); do curl -fsS http://127.0.0.1:8722/api/feedback/v1/health && break; sleep 1; done
echo; echo "Include /etc/nginx/snippets/dkp-feedback.conf in the dikenocracy.com server block, then: sudo nginx -t && sudo systemctl reload nginx"
