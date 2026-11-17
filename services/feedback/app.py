"""Protocol feedback API for dikenocracy.com (2026-11-17).

A visitor selects a passage of a protocol page and sends a message about it. The service validates the submission,
stores it durably (SQLite), and delivers it by e-mail when the owner has configured a recipient and SMTP server.
Without that configuration a submission is kept as `pending_recipient` and the visitor is told exactly that: the
service never claims a message was e-mailed when it was not.

Public routes (behind nginx, loopback only):
    POST /api/feedback/v1/submit   JSON body, see `validate()`
    GET  /api/feedback/v1/health   {"ok": true, "delivery_configured": bool}
There is no public read or admin route; the owner reads submissions on the server (`python -m feedback_cli list`).

Configuration (environment, e.g. EnvironmentFile=/etc/dkp-feedback/feedback.env, mode 600):
    FEEDBACK_DB, FEEDBACK_REGISTRY, FEEDBACK_TO, FEEDBACK_FROM, FEEDBACK_SMTP_HOST, FEEDBACK_SMTP_PORT (587),
    FEEDBACK_SMTP_USER, FEEDBACK_SMTP_PASSWORD, FEEDBACK_SMTP_STARTTLS (1)
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import os
import re
import smtplib
import sqlite3
import time
import unicodedata
import uuid
from contextlib import asynccontextmanager
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

PREFIX = "/api/feedback/v1"
MAX_BODY, MAX_MESSAGE, MAX_SELECTION, MAX_TITLE = 32768, 5000, 2000, 300
MAX_LINKS, MIN_ELAPSED_MS, MAX_ATTEMPTS = 5, 1500, 6
SLUG = re.compile(r"[a-z0-9][a-z0-9-]{1,80}")
SECTION = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.:-]{0,120}")
PAGE = re.compile(r"https://(?:www\.)?dikenocracy\.com/pages/protocols/([a-z0-9-]+)\.html")
LINK = re.compile(r"https?://|www\.", re.I)
ALLOWED = {"slug", "page_url", "section", "section_title", "selection", "message", "elapsed_ms", "website"}


def env(name, default=""):
    return os.environ.get(name, default).strip()


def clean(text: str) -> str:
    """NFC, no control characters except newline and tab, trimmed."""
    text = unicodedata.normalize("NFC", text).replace("\r\n", "\n").replace("\r", "\n")
    return "".join(ch for ch in text if ch in "\n\t" or unicodedata.category(ch)[0] != "C").strip()


class Error(Exception):
    def __init__(self, status, code, message, headers=None):
        self.status, self.code, self.message, self.headers = status, code, message, headers


class Limiter:
    """Sliding windows per client: a short burst window and a daily cap (in memory; one uvicorn worker)."""

    def __init__(self, windows):
        self.windows, self.hits = windows, {}

    def take(self, client: str) -> bool:
        now = time.monotonic()
        longest = max(w for _, w in self.windows)
        hits = [t for t in self.hits.get(client, []) if now - t < longest]
        if any(sum(1 for t in hits if now - t < w) >= n for n, w in self.windows):
            self.hits[client] = hits
            return False
        hits.append(now)
        self.hits[client] = hits
        if len(self.hits) > 50000:          # bound memory under a flood of distinct addresses
            self.hits = {k: v for k, v in self.hits.items() if v and now - v[-1] < longest}
        return True


def load_registry(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return {d["slug"]: d for d in data["documents"]}


def open_db(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, isolation_level=None, check_same_thread=False)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("""CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY, created_utc TEXT NOT NULL, protocol_id TEXT NOT NULL, protocol_slug TEXT NOT NULL,
        protocol_version TEXT, source_hash TEXT, section TEXT, section_title TEXT, selection TEXT NOT NULL,
        message TEXT NOT NULL, page_url TEXT NOT NULL, dedup_key TEXT NOT NULL, delivery_status TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, delivered_utc TEXT)""")
    db.execute("CREATE INDEX IF NOT EXISTS feedback_dedup ON feedback(dedup_key, created_utc)")
    db.execute("CREATE INDEX IF NOT EXISTS feedback_status ON feedback(delivery_status)")
    return db


def delivery_configured() -> bool:
    return bool(env("FEEDBACK_TO") and env("FEEDBACK_FROM") and env("FEEDBACK_SMTP_HOST"))


def utc(ts=None):
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(ts))


def validate(body, registry):
    if not isinstance(body, dict) or set(body) - ALLOWED:
        raise Error(422, "invalid_input", "Unexpected fields")
    if body.get("website"):                                   # honeypot: real visitors never fill it
        raise Error(422, "invalid_input", "Submission rejected")
    elapsed = body.get("elapsed_ms")
    if not isinstance(elapsed, int) or elapsed < MIN_ELAPSED_MS:
        raise Error(422, "too_fast", "Please take a moment to write your feedback")
    fields = {}
    for name, limit, required in (("selection", MAX_SELECTION, True), ("message", MAX_MESSAGE, True),
                                  ("section_title", MAX_TITLE, False)):
        value = body.get(name, "")
        if not isinstance(value, str):
            raise Error(422, "invalid_input", f"{name} must be text")
        value = clean(value)
        if required and not value:
            raise Error(422, "invalid_input", f"{name} is empty")
        if len(value) > limit:
            raise Error(422, "too_long", f"{name} exceeds {limit} characters")
        fields[name] = value
    if len(LINK.findall(fields["message"])) > MAX_LINKS:
        raise Error(422, "too_many_links", "Too many links in the message")
    slug, page = body.get("slug"), body.get("page_url")
    if not isinstance(slug, str) or not SLUG.fullmatch(slug) or slug not in registry:
        raise Error(422, "unknown_protocol", "Unknown protocol page")
    match = PAGE.fullmatch(page) if isinstance(page, str) else None
    if not match or match.group(1) != slug:
        raise Error(422, "invalid_input", "The page does not match the protocol")
    section = body.get("section") or ""
    if not isinstance(section, str) or (section and not SECTION.fullmatch(section)):
        raise Error(422, "invalid_input", "Invalid section reference")
    doc = registry[slug]
    fields.update(protocol_id=doc["id"], protocol_slug=slug, protocol_version=doc.get("last_updated"),
                  source_hash=doc.get("sha256"), section=section, page_url=page)
    return fields


def compose(row):
    msg = EmailMessage()
    msg["From"], msg["To"] = env("FEEDBACK_FROM"), env("FEEDBACK_TO")
    msg["Subject"] = f"[Dikenocracy feedback] {row['protocol_id']} {row['section'] or ''}".strip()
    msg["Date"] = formatdate(usegmt=True)
    msg["Message-ID"] = make_msgid("feedback", domain=sender_domain())
    msg.set_content(
        f"Protocol: {row['protocol_id']} (edition {row['protocol_version']}, source sha256 {row['source_hash']})\n"
        f"Section: {row['section'] or '-'} {row['section_title'] or ''}\nPage: {row['page_url']}#{row['section'] or ''}\n"
        f"Submission: {row['id']} at {row['created_utc']}\n\nSelected passage:\n{row['selection']}\n\nMessage:\n{row['message']}\n")
    return msg


def sender_domain():
    address = env("FEEDBACK_FROM", "")
    return address.rsplit("@", 1)[-1].strip(" >") if "@" in address else "localhost"


def smtp_hosts():
    """FEEDBACK_SMTP_HOST may list several hosts (e.g. the recipient domain's MX hosts in preference order)."""
    return [h.strip() for h in env("FEEDBACK_SMTP_HOST", "").split(",") if h.strip()]


def send(msg, smtp_class=smtplib.SMTP):
    """Submit through the first reachable host; the next host is tried only when one cannot be reached or drops
    the connection (a refusal by a reachable server is final for this attempt and is retried later)."""
    port = int(env("FEEDBACK_SMTP_PORT", "587"))
    last = None
    for host in smtp_hosts():
        try:
            with smtp_class(host, port, timeout=30) as smtp:
                smtp.ehlo(sender_domain())
                if env("FEEDBACK_SMTP_STARTTLS", "1") == "1":
                    smtp.starttls()
                    smtp.ehlo(sender_domain())
                if env("FEEDBACK_SMTP_USER"):
                    smtp.login(env("FEEDBACK_SMTP_USER"), env("FEEDBACK_SMTP_PASSWORD"))
                smtp.send_message(msg)
                return host
        except (OSError, smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected) as exc:
            last = exc
    raise last or smtplib.SMTPException("No SMTP host configured")


def deliver_pending(db, sender=send):
    """Deliver stored submissions when a recipient is configured; bounded retries; errors stored without secrets."""
    if not delivery_configured():
        return 0
    rows = db.execute("SELECT * FROM feedback WHERE delivery_status IN ('pending_recipient','queued','retry') "
                      "AND attempts < ? ORDER BY created_utc LIMIT 20", (MAX_ATTEMPTS,)).fetchall()
    names = [d[0] for d in db.execute("SELECT * FROM feedback LIMIT 0").description]
    sent = 0
    for values in rows:
        row = dict(zip(names, values))
        try:
            sender(compose(row))
            db.execute("UPDATE feedback SET delivery_status='sent', attempts=attempts+1, delivered_utc=?, last_error=NULL "
                       "WHERE id=?", (utc(), row["id"]))
            sent += 1
        except Exception as exc:                               # noqa: BLE001 - any delivery failure is retried
            status = "failed" if row["attempts"] + 1 >= MAX_ATTEMPTS else "retry"
            db.execute("UPDATE feedback SET delivery_status=?, attempts=attempts+1, last_error=? WHERE id=?",
                       (status, type(exc).__name__, row["id"]))
    return sent


def create_app(db_path=None, registry_path=None, sender=send, deliver_every=60.0):
    db = open_db(db_path or env("FEEDBACK_DB", "/var/lib/dkp-feedback/feedback.sqlite3"))
    registry = load_registry(registry_path or env("FEEDBACK_REGISTRY", str(Path(__file__).with_name("registry.json"))))
    limiter = Limiter(((5, 600), (20, 86400)))

    @asynccontextmanager
    async def lifespan(app):
        async def loop():
            while True:
                await asyncio.sleep(deliver_every)
                await asyncio.to_thread(deliver_pending, db, sender)
        task = asyncio.create_task(loop()) if deliver_every else None
        yield
        if task:
            task.cancel()

    app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
    app.state.db, app.state.registry = db, registry

    @app.exception_handler(Error)
    async def error(request, exc):
        return JSONResponse({"error": {"code": exc.code, "message": exc.message}}, status_code=exc.status, headers=exc.headers)

    @app.exception_handler(Exception)
    async def internal(request, exc):
        return JSONResponse({"error": {"code": "internal_error", "message": "Feedback could not be recorded"}}, status_code=500)

    @app.get(PREFIX + "/health")
    async def health():
        return {"ok": True, "delivery_configured": delivery_configured()}

    @app.post(PREFIX + "/submit")
    async def submit(request: Request):
        if (request.headers.get("content-type") or "").split(";")[0].strip() != "application/json":
            raise Error(415, "unsupported_media_type", "Send JSON")
        raw = await request.body()
        if len(raw) > MAX_BODY:
            raise Error(413, "too_large", "Request body exceeds the byte limit")
        client = request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")
        if not limiter.take(client):
            raise Error(429, "rate_limited", "Too many submissions; please try later", {"Retry-After": "600"})
        try:
            body = json.loads(raw)
        except (ValueError, UnicodeDecodeError):
            raise Error(400, "bad_json", "Invalid JSON") from None
        f = validate(body, registry)
        key = hashlib.sha256("\x1f".join((f["protocol_id"], f["section"], f["selection"], f["message"])).encode()).hexdigest()
        dup = db.execute("SELECT id, delivery_status FROM feedback WHERE dedup_key=? AND created_utc>=?",
                         (key, utc(time.time() - 86400))).fetchone()
        if dup:
            return JSONResponse({"id": dup[0], "status": "received", "duplicate": True,
                                 "delivery": "pending_configuration" if dup[1] == "pending_recipient" else "queued"})
        fid = uuid.uuid4().hex
        status = "queued" if delivery_configured() else "pending_recipient"
        db.execute("INSERT INTO feedback (id, created_utc, protocol_id, protocol_slug, protocol_version, source_hash, section, "
                   "section_title, selection, message, page_url, dedup_key, delivery_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                   (fid, utc(), f["protocol_id"], f["protocol_slug"], f["protocol_version"], f["source_hash"], f["section"],
                    f["section_title"], f["selection"], f["message"], f["page_url"], key, status))
        return JSONResponse({"id": fid, "status": "received", "duplicate": False,
                             "delivery": "queued" if status == "queued" else "pending_configuration"}, status_code=201)

    return app
# Served as: uvicorn app:create_app --factory (see dkp-feedback.service)
