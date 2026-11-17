#!/usr/bin/env bash
# Dikenocracy persistent-data backup (2026-11-17). Run by dkp-backup.timer daily as root.
#   dkp-backup.sh            create, verify and rotate an encrypted archive in /var/backups/dkp
#   dkp-backup.sh restore-test   decrypt the newest archive into a temporary directory and check it (weekly timer)
# Encryption: AES-256 (openssl, PBKDF2) with the key file /etc/dkp-backup/key (root 600). Keep a copy of that key
# outside the server (owner's password manager); without it the archives cannot be restored.
set -euo pipefail
dir=/var/backups/dkp; key=/etc/dkp-backup/key; keep=14; umask 077; mkdir -p "$dir"
[[ -s $key ]] || { echo "missing $key" >&2; exit 2; }
if [[ ${1:-} == restore-test ]]; then
  last=$(ls -1t "$dir"/*.enc | head -1); tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
  (cd "$dir" && sha256sum -c --quiet "$(basename "$last").sha256")
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass "file:$key" -in "$last" | tar -xz -C "$tmp"
  for f in var/www/html/index.html etc/nginx/sites-enabled/default db/jobs.db db/feedback.db; do [[ -e $tmp/$f ]] || { logger -p user.err -t dkp-backup "restore test: $f missing in $last"; exit 1; }; done
  for db in "$tmp"/db/*.db; do [[ $(python3 -c "import sqlite3,sys;print(sqlite3.connect(sys.argv[1]).execute('pragma integrity_check').fetchone()[0])" "$db") == ok ]] || { logger -p user.err -t dkp-backup "restore test: $db corrupt"; exit 1; }; done
  logger -t dkp-backup "restore test passed: $(basename "$last")"; exit 0
fi
stamp=$(date -u +%Y%m%dT%H%M%SZ); work=$(mktemp -d); trap 'rm -rf "$work"' EXIT; mkdir -p "$work/db"
for db in /var/lib/dkp-lab/lab/jobs.sqlite3 /var/lib/dkp-feedback/feedback.sqlite3; do
  [[ -f $db ]] && python3 -c "import sqlite3,sys;s=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True);d=sqlite3.connect(sys.argv[2]);s.backup(d);d.close()" "$db" "$work/db/$(basename "$db" .sqlite3).db"; done
sudo -u postgres pg_dump -Fc mazkira > "$work/db/mazkira.pgdump"
# sqlite files are copied consistently above; live sqlite files and the game's node_modules are excluded
{ tar -czf - --warning=no-file-changed --ignore-failed-read --exclude='var/www/html/AA/Alienclimber/node_modules'     --exclude='*.sqlite3' --exclude='*.sqlite3-wal' --exclude='*.sqlite3-shm'     -C / var/www/html var/www/dkp-errors etc/nginx etc/systemd/system etc/dkp-feedback var/lib/dkp-lab/lab/store     var/lib/dkp-lab/lab/.secret var/lib/dkp-corpus opt/dkp-lab/PREVIOUS home/admin/projects/market-lens/var     -C "$work" db || [[ $? == 1 ]]; }   | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass "file:$key" -out "$dir/dkp-$stamp.tar.gz.enc"
(cd "$dir" && sha256sum "dkp-$stamp.tar.gz.enc" > "dkp-$stamp.tar.gz.enc.sha256")
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass "file:$key" -in "$dir/dkp-$stamp.tar.gz.enc" | tar -tz > /dev/null
ls -1t "$dir"/dkp-*.enc | tail -n +$((keep + 1)) | while read -r old; do rm -f -- "$old" "$old.sha256"; done
logger -t dkp-backup "backup ok: dkp-$stamp.tar.gz.enc $(stat -c %s "$dir/dkp-$stamp.tar.gz.enc") bytes"
