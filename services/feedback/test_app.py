"""Tests for the protocol feedback API (run: python -m pytest services/feedback)."""
import json

import pytest

pytest.importorskip("fastapi")
from fastapi.testclient import TestClient

import app as feedback

REGISTRY = {"schema": "dkp-feedback-registry/1", "documents": [
    {"slug": "dkp-1-justice-001", "id": "DKP-1-JUSTICE-001", "last_updated": "2026-10-04", "sha256": "a" * 64}]}
PAGE = "https://dikenocracy.com/pages/protocols/dkp-1-justice-001.html"


def body(**over):
    b = {"slug": "dkp-1-justice-001", "page_url": PAGE, "section": "1-purpose", "section_title": "1. Purpose",
         "selection": "The Justice Function is computed from inputs.", "message": "This sentence is unclear.",
         "elapsed_ms": 5000, "website": ""}
    b.update(over)
    return b


@pytest.fixture
def make(tmp_path, monkeypatch):
    for name in ("FEEDBACK_TO", "FEEDBACK_FROM", "FEEDBACK_SMTP_HOST"):
        monkeypatch.delenv(name, raising=False)
    reg = tmp_path / "registry.json"
    reg.write_text(json.dumps(REGISTRY), encoding="utf-8")
    sent = []

    def build(configured=False):
        if configured:
            monkeypatch.setenv("FEEDBACK_TO", "owner@example.invalid")
            monkeypatch.setenv("FEEDBACK_FROM", "noreply@example.invalid")
            monkeypatch.setenv("FEEDBACK_SMTP_HOST", "smtp.example.invalid")
        app = feedback.create_app(str(tmp_path / "f.sqlite3"), str(reg), sender=sent.append, deliver_every=0)
        return TestClient(app), app, sent
    return build


def post(client, data, ip="203.0.113.1"):
    return client.post(feedback.PREFIX + "/submit", json=data, headers={"X-Real-IP": ip})


def test_submit_without_recipient_is_stored_pending(make):
    client, app, sent = make()
    r = post(client, body())
    assert r.status_code == 201 and r.json()["delivery"] == "pending_configuration"
    row = app.state.db.execute("SELECT protocol_id, protocol_version, source_hash, section, delivery_status FROM feedback").fetchone()
    assert row == ("DKP-1-JUSTICE-001", "2026-10-04", "a" * 64, "1-purpose", "pending_recipient")
    assert feedback.deliver_pending(app.state.db, sent.append) == 0 and not sent


def test_delivery_when_configured_and_retry_on_failure(make):
    client, app, sent = make(configured=True)
    assert post(client, body()).json()["delivery"] == "queued"
    assert feedback.deliver_pending(app.state.db, sent.append) == 1
    assert "DKP-1-JUSTICE-001" in sent[0]["Subject"] and "This sentence is unclear." in sent[0].get_content()
    assert post(client, body(message="Second")).status_code == 201

    def broken(msg):
        raise OSError("smtp down")
    assert feedback.deliver_pending(app.state.db, broken) == 0
    assert app.state.db.execute("SELECT delivery_status, last_error FROM feedback WHERE message='Second'").fetchone() == ("retry", "OSError")


@pytest.mark.parametrize("over,code", [
    ({"message": ""}, "invalid_input"), ({"message": "x" * 5001}, "too_long"), ({"selection": ""}, "invalid_input"),
    ({"slug": "dkp-9-unknown-001"}, "unknown_protocol"), ({"page_url": "https://evil.example/pages/protocols/dkp-1-justice-001.html"}, "invalid_input"),
    ({"section": "<script>"}, "invalid_input"), ({"website": "http://spam"}, "invalid_input"), ({"elapsed_ms": 200}, "too_fast"),
    ({"message": "http://a http://b http://c http://d http://e http://f"}, "too_many_links"), ({"extra": 1}, "invalid_input")])
def test_validation(make, over, code):
    client, _, _ = make()
    r = post(client, body(**over))
    assert r.status_code == 422 and r.json()["error"]["code"] == code


def test_exactly_5000_characters_are_accepted(make):
    client, _, _ = make()
    assert post(client, body(message="x" * 5000)).status_code == 201


def test_duplicates_return_the_first_submission(make):
    client, app, _ = make()
    first = post(client, body()).json()
    again = post(client, body()).json()
    assert again["duplicate"] and again["id"] == first["id"]
    assert app.state.db.execute("SELECT count(*) FROM feedback").fetchone()[0] == 1


def test_rate_limit_per_client(make):
    client, _, _ = make()
    codes = [post(client, body(message=f"m{i}")).status_code for i in range(6)]
    assert codes[:5] == [201] * 5 and codes[5] == 429
    assert post(client, body(message="other visitor"), ip="203.0.113.2").status_code == 201


def test_bad_json_size_and_media_type(make):
    client, _, _ = make()
    assert client.post(feedback.PREFIX + "/submit", content=b"{", headers={"Content-Type": "application/json"}).status_code == 400
    assert client.post(feedback.PREFIX + "/submit", content=b"x", headers={"Content-Type": "text/plain"}).status_code == 415
    big = json.dumps(body(message="x" * 40000)).encode()
    assert client.post(feedback.PREFIX + "/submit", content=big, headers={"Content-Type": "application/json"}).status_code == 413


def test_control_characters_are_removed_and_markup_kept_as_text(make):
    client, app, _ = make()
    post(client, body(message="<b>bold</b>\x00\x07 ok"))
    assert app.state.db.execute("SELECT message FROM feedback").fetchone()[0] == "<b>bold</b> ok"


def test_health_reports_configuration(make):
    client, _, _ = make()
    assert client.get(feedback.PREFIX + "/health").json() == {"ok": True, "delivery_configured": False}


class FakeSMTP:
    """Records the SMTP dialogue; hosts listed in `down` refuse the connection."""
    down, log = set(), []

    def __init__(self, host, port, timeout):
        if host in self.down:
            raise ConnectionRefusedError(host)
        self.host = host
        FakeSMTP.log.append(("connect", host, port))

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def ehlo(self, name):
        FakeSMTP.log.append(("ehlo", name))

    def starttls(self):
        FakeSMTP.log.append(("starttls",))

    def login(self, user, password):
        FakeSMTP.log.append(("login", user))

    def send_message(self, msg):
        FakeSMTP.log.append(("send", msg["To"], msg["Message-ID"], msg["Date"]))


def test_send_tries_mx_hosts_in_order_without_login(monkeypatch):
    monkeypatch.setenv("FEEDBACK_TO", "support@dikenocracy.com")
    monkeypatch.setenv("FEEDBACK_FROM", "Dikenocracy feedback <feedback@dikenocracy.com>")
    monkeypatch.setenv("FEEDBACK_SMTP_HOST", "route3.mx.example, route1.mx.example ,route2.mx.example")
    monkeypatch.setenv("FEEDBACK_SMTP_PORT", "25")
    monkeypatch.delenv("FEEDBACK_SMTP_USER", raising=False)
    FakeSMTP.down, FakeSMTP.log = {"route3.mx.example"}, []
    row = {"protocol_id": "DKP-1-JUSTICE-001", "protocol_version": "2026-10-04", "source_hash": "a" * 64,
           "section": "1-purpose", "section_title": "Purpose", "page_url": "https://dikenocracy.com/p", "id": "x",
           "created_utc": "2026-11-17T00:00:00Z", "selection": "s", "message": "m"}
    msg = feedback.compose(row)
    assert msg["Message-ID"].endswith("@dikenocracy.com>") and msg["Date"]
    assert feedback.send(msg, smtp_class=FakeSMTP) == "route1.mx.example"
    assert FakeSMTP.log[0] == ("connect", "route1.mx.example", 25)
    assert ("starttls",) in FakeSMTP.log and not any(e[0] == "login" for e in FakeSMTP.log)
    assert FakeSMTP.log[-1][:2] == ("send", "support@dikenocracy.com")


def test_send_raises_when_no_host_is_reachable(monkeypatch):
    monkeypatch.setenv("FEEDBACK_SMTP_HOST", "a.example,b.example")
    FakeSMTP.down, FakeSMTP.log = {"a.example", "b.example"}, []
    with pytest.raises(ConnectionRefusedError):
        feedback.send(feedback.EmailMessage(), smtp_class=FakeSMTP)
