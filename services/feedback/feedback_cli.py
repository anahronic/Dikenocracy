"""Owner's read-only view of stored feedback (run on the server as root or dkpfeedback).

    python feedback_cli.py list [--status pending_recipient] [--limit 20]
    python feedback_cli.py show <id>
    python feedback_cli.py stats
"""
import argparse
import os
import sqlite3

DB = os.environ.get("FEEDBACK_DB", "/var/lib/dkp-feedback/feedback.sqlite3")
ap = argparse.ArgumentParser()
sub = ap.add_subparsers(dest="cmd", required=True)
ls = sub.add_parser("list")
ls.add_argument("--status")
ls.add_argument("--limit", type=int, default=20)
sh = sub.add_parser("show")
sh.add_argument("id")
sub.add_parser("stats")
a = ap.parse_args()
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
