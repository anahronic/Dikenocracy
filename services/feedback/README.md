# Protocol feedback service

Visitors select a passage on a protocol page (`/pages/protocols/<slug>.html`), press **Leave feedback** (added by
`website/feedback/feedback-20261117.js`, loaded by every protocol page) and send a message of at most 5,000 characters.
`app.py` validates it, attaches the protocol ID, edition date and canonical SHA-256 from `registry.json`
(built from World by `build_registry.py`), stores it in SQLite and e-mails it when a recipient is configured.

- No transport configured → stored as `pending_recipient`; the visitor is told it is kept for the author.
- Recipient (owner decision 2026-11-17): `FEEDBACK_TO=support@dikenocracy.com` (Cloudflare Email Routing forwards it
  to the owner). Settings live in `/etc/dkp-feedback/feedback.env` (root:dkpfeedback 640): `FEEDBACK_TO`,
  `FEEDBACK_FROM`, `FEEDBACK_SMTP_HOST` (one host, or several comma-separated hosts tried in order — e.g. the
  domain's MX hosts), optional `FEEDBACK_SMTP_PORT` (587), `FEEDBACK_SMTP_USER`, `FEEDBACK_SMTP_PASSWORD`,
  `FEEDBACK_SMTP_STARTTLS` (1); then `sudo systemctl restart dkp-feedback`. Delivery is active only when TO, FROM and
  HOST are all set; stored submissions are then delivered by the background loop (every 60 s, up to 6 attempts;
  status `sent`, `retry`, `failed`). Messages carry `Date` and `Message-ID`.
- Transport status and the two free ways to enable it: `FEEDBACK_EMAIL_ACTIVATION_2026-11-17.md` (project folder).
- Test the transport without storing anything: `sudo /opt/dkp-feedback/current/venv/bin/python
  /opt/dkp-feedback/current/feedback_cli.py send-test` (prints the accepting host or the error, never credentials).
- Read submissions on the server: `sudo -u dkpfeedback /opt/dkp-feedback/current/venv/bin/python /opt/dkp-feedback/current/feedback_cli.py list|stats|show <id>`.
- Protection: honeypot field, minimum 1.5 s between opening the dialog and sending, ≤ 5 links, length limits,
  control characters removed, per-visitor limits (app: 5 per 10 min, 20 per day; nginx: 6/min burst 3), 32 KiB body,
  24-hour duplicate detection, no public read/admin routes, loopback-only service with its own user.
- Tests: `python -m pytest services/feedback` (20 tests); browser test of the button: `tools/feedback_widget_test.mjs`.
- Install/update on the server: copy this folder with a built `registry.json`, then `bash install.sh <release-id>`.
