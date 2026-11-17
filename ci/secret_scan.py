"""Fails when tracked files contain likely secrets (CI and pre-push). Usage: python ci/secret_scan.py"""
import re
import subprocess
import sys

PATTERNS = {
    "private key": re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    "OpenAI/Anthropic key": re.compile(r"\bsk-(?:ant-)?[A-Za-z0-9_-]{24,}"),
    "AWS key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "Google API key": re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b"),
    "GitHub token": re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36,}\b"),
    "Slack token": re.compile(r"\bxox[abprs]-[A-Za-z0-9-]{10,}"),
    "password assignment": re.compile(r"(?i)\b(?:password|passwd|smtp_password)\s*[=:]\s*['\"]?[^\s'\"<>]{8,}"),
}
ALLOW = re.compile(r"FEEDBACK_SMTP_PASSWORD\b|\(password\|пароль\)|password\s*[:=]\s*\[|example\.invalid")
files = subprocess.run(["git", "ls-files"], capture_output=True, text=True, check=True).stdout.splitlines()
hits = []
for f in files:
    if f.endswith((".png", ".jpg", ".webp", ".woff2", ".ico", ".zip", ".docx", ".pdf", ".svg")):
        continue
    try:
        text = open(f, encoding="utf-8", errors="ignore").read()
    except OSError:
        continue
    for line_no, line in enumerate(text.splitlines(), 1):
        for name, rx in PATTERNS.items():
            if rx.search(line) and not ALLOW.search(line):
                hits.append(f"{f}:{line_no}: {name}")
print(f"secret scan: {len(files)} tracked files, {len(hits)} findings")
for h in hits:
    print("FAIL", h)
sys.exit(1 if hits else 0)
