"""Check publishable files and reachable Git blobs without printing secret contents.

This is a focused heuristic check, not proof that a repository contains no secrets.
Ignored local files are deliberately not read or published.
"""
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


PATTERNS = {
    "private-key": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "github-token": re.compile(rb"\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b"),
    "api-secret": re.compile(rb"\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b"),
    "aws-access-id": re.compile(rb"\bAKIA[0-9A-Z]{16}\b"),
}
PRIVATE_PATH = re.compile(r"(?:^|/)(?:\.env(?!\.example$)(?:\..*)?|(?:learning|submissions)/private/.*)$")
findings = []


def scan(label, content):
    for name, pattern in PATTERNS.items():
        for match in pattern.finditer(content):
            fingerprint = hashlib.sha256(match.group()).hexdigest()[:12]
            findings.append({"kind": name, "location": label, "fingerprint": fingerprint})
    if label.endswith("learning/progress.json"):
        progress = json.loads(content)
        for stage in progress.get("stages", {}).values():
            exam = stage.get("exam", {})
            if stage.get("assignmentCommit") or exam.get("score") is not None or exam.get("teacherReview"):
                findings.append({"kind": "personal-assessment", "location": label})


paths = git("ls-files", "--cached", "--others", "--exclude-standard", "-z").decode().split("\0")
for name in filter(None, paths):
    if PRIVATE_PATH.search(name):
        findings.append({"kind": "private-path", "location": name})
    file = ROOT / name
    if file.is_file():
        scan(name, file.read_bytes())

objects = git("rev-list", "--objects", "--all").decode().splitlines()
blob_count = 0
batch = subprocess.Popen(["git", "cat-file", "--batch"], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
try:
    for item in objects:
        oid, _, name = item.partition(" ")
        batch.stdin.write((oid + "\n").encode())
        batch.stdin.flush()
        header = batch.stdout.readline().decode().split()
        size = int(header[2])
        content = batch.stdout.read(size)
        batch.stdout.read(1)
        if header[1] != "blob":
            continue
        blob_count += 1
        if PRIVATE_PATH.search(name):
            findings.append({"kind": "historical-private-path", "location": oid[:12] + ":" + name})
        scan(oid[:12] + ":" + name, content)
finally:
    batch.stdin.close()
    batch.wait()

print(json.dumps({"workingFiles": len(list(filter(None, paths))), "reachableBlobs": blob_count,
                  "findings": findings, "scope": "known credential patterns, private paths, historical assessment fields"}, ensure_ascii=False, indent=2))
raise SystemExit(1 if findings else 0)
