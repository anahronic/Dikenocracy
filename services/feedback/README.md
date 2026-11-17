# Protocol feedback service

Visitors select a passage on a protocol page (`/pages/protocols/<slug>.html`), press **Leave feedback** (added by
`website/feedback/feedback-20261117.js`, loaded by every protocol page) and send a message of at most 5,000 characters.
`app.py` validates it, attaches the protocol ID, edition date and canonical SHA-256 from `registry.json`
(built from World by `build_registry.py`), stores it in SQLite and e-mails it when a recipient is configured.

- No recipient configured → stored as `pending_recipient`; the visitor is told e-mail delivery is not configured.
- Configure delivery: edit `/etc/dkp-feedback/feedback.env` (root:dkpfeedback 640): `FEEDBACK_TO`, `FEEDBACK_FROM`,
  `FEEDBACK_SMTP_HOST`, optional `FEEDBACK_SMTP_PORT` (587), `FEEDBACK_SMTP_USER`, `FEEDBACK_SMTP_PASSWORD`,
  `FEEDBACK_SMTP_STARTTLS` (1); then `sudo systemctl restart dkp-feedback`. Stored submissions are delivered by the
  background loop (every 60 s, up to 6 attempts; status `sent`, `retry`, `failed`).
- Read submissions on the server: `sudo -u dkpfeedback /opt/dkp-feedback/current/venv/bin/python /opt/dkp-feedback/current/feedback_cli.py list|stats|show <id>`.
- Protection: honeypot field, minimum 1.5 s between opening the dialog and sending, ≤ 5 links, length limits,
  control characters removed, per-visitor limits (app: 5 per 10 min, 20 per day; nginx: 6/min burst 3), 32 KiB body,
  24-hour duplicate detection, no public read/admin routes, loopback-only service with its own user.
- Tests: `python -m pytest services/feedback` (18 tests).
- Install/update on the server: copy this folder with a built `registry.json`, then `bash install.sh <release-id>`.
