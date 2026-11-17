"""Owner's read-only view of stored feedback (run on the server as root or dkpfeedback).

    python feedback_cli.py list [--status pending_recipient] [--limit 20]
    python feedback_cli.py show <id>
    python feedback_cli.py stats
    python feedback_cli.py send-test [--env-file /etc/dkp-feedback/feedback.env]
        sends one clearly labelled test message through the configured transport and prints only the outcome
        (the host that accepted it, or the error class/text without credentials); stores nothing.
"""
import argparse
import os
import sqlite3
import sys

DB = os.environ.get("FEEDBACK_DB", "/var/lib/dkp-feedback/feedback.sqlite3")
ap = argparse.ArgumentParser()
sub = ap.add_subparsers(dest="cmd", required=True)
ls = sub.add_parser("list")
ls.add_argument("--status")
ls.add_argument("--limit", type=int, default=20)
sh = sub.add_parser("show")
sh.add_argument("id")
sub.add_parser("stats")
st = sub.add_parser("send-test")
st.add_argument("--env-file", default="/etc/dkp-feedback/feedback.env")
a = ap.parse_args()
if a.cmd == "send-test":
    for line in open(a.env_file, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import app as feedback
    from email.message import EmailMessage
    from email.utils import formatdate, make_msgid
    if not feedback.delivery_configured():
        sys.exit("Delivery is not configured: FEEDBACK_TO, FEEDBACK_FROM and FEEDBACK_SMTP_HOST are required")
    msg = EmailMessage()
    msg["From"], msg["To"] = feedback.env("FEEDBACK_FROM"), feedback.env("FEEDBACK_TO")
    msg["Subject"] = "[Dikenocracy feedback] delivery test"
    msg["Date"] = formatdate(usegmt=True)
    msg["Message-ID"] = make_msgid("feedback-test", domain=feedback.sender_domain())
    msg.set_content("This is a delivery test of the dikenocracy.com protocol feedback service. No visitor wrote it.
")
    try:
        host = feedback.send(msg)
    except Exception as exc:                                   # noqa: BLE001 - report the outcome, never secrets
        sys.exit(f"NOT SENT: {type(exc).__name__}: {str(exc)[:300]}")
    print(f"SENT via {host} to {msg['To']} (Message-ID {msg['Message-ID']})")
    sys.exit(0)
db = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
if a.cmd == "stats":
    for status, n in db.execute("SELECT delivery_status, count(*) FROM feedback GROUP BY 1"):
        print(f"{status:20} {n}")
elif a.cmd == "list":
    q, args = "SELECT id, created_utc, protocol_id, section, delivery_status, substr(message,1,80) FROM feedback", []
    if a.status:
        q, args = q + " WHERE delivery_status=?", [a.status]
    for row in db.execute(q + " ORDER BY created_utc DESC LIMIT ?", args + [a.limit]):
        print(" | ".join(str(x).replace("\n", " ") for x in row))
else:
    cur = db.execute("SELECT * FROM feedback WHERE id=?", (a.id,))
    row = cur.fetchone()
    for name, value in zip([d[0] for d in cur.description], row or []):
        print(f"{name}: {value}")
