#!/usr/bin/env bash
# Dikenocracy health monitor (2026-11-17). Run by dkp-monitor.timer every 5 min as root. Free, local only.
# Writes /var/lib/dkp-monitor/status.json; every failing check is logged with priority err (journalctl -p err -t dkp-monitor).
set -u
out=/var/lib/dkp-monitor; mkdir -p "$out"; checks=(); fail=0
add() { checks+=("{\"check\":\"$1\",\"ok\":$2,\"detail\":\"${3//\"/\'}\"}"); if [[ $2 != true ]]; then fail=$((fail+1)); logger -p user.err -t dkp-monitor "FAIL $1: $3"; fi; }
http() { local code; code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 20 --resolve dikenocracy.com:443:127.0.0.1 "https://dikenocracy.com$2"); [[ $code == "$3" ]] && add "$1" true "$code" || add "$1" false "HTTP $code"; }
http site_home / 200
http site_protocols /pages/protocols.html 200
http lab_health /api/lab/v1/health 200
http feedback_health /api/feedback/v1/health 200
http feedback_script /feedback/feedback-20261117.js 200
http removed_mazkira /mazkira/ 410
# Retired 2026-11-17 (owner): Keeper of Knowledge and Market Lens must stay gone (410).
http retired_keeper_api /api/keeper/v1/health 410
http retired_keeper_widget /keeper/keeper-loader.js 410
http retired_market_lens /api/health 410
for u in nginx dkp-lab-api dkp-lab-worker dkp-feedback postgresql pm2-admin; do
  s=$(systemctl is-active "$u" 2>/dev/null); [[ $s == active ]] && add "unit_$u" true active || add "unit_$u" false "$s"; done
failed=$(systemctl --failed --no-legend --plain | awk '{print $1}' | tr '\n' ' '); [[ -z $failed ]] && add units_failed true none || add units_failed false "$failed"
pg_isready -q -h 127.0.0.1 && add postgresql_ready true ok || add postgresql_ready false "not ready"
for db in /var/lib/dkp-lab/lab/jobs.sqlite3 /var/lib/dkp-feedback/feedback.sqlite3; do
  [[ -f $db ]] || continue; r=$(python3 -c "import sqlite3,sys;print(sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True).execute('pragma quick_check').fetchone()[0])" "$db" 2>&1)
  [[ $r == ok ]] && add "sqlite_$(basename "$db")" true ok || add "sqlite_$(basename "$db")" false "$r"; done
use=$(df --output=pcent / | tail -1 | tr -dc 0-9); (( use < 85 )) && add disk_root true "${use}%" || add disk_root false "${use}% used"
avail=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo); (( avail > 150 )) && add memory_available true "${avail} MiB" || add memory_available false "${avail} MiB"
for c in dikenocracy.com mazkira.dikenocracy.com; do f=/etc/letsencrypt/live/$c/fullchain.pem; [[ -f $f ]] || continue
  end=$(date -d "$(openssl x509 -enddate -noout -in "$f" | cut -d= -f2)" +%s); days=$(( (end - $(date +%s)) / 86400 ))
  (( days > 21 )) && add "tls_$c" true "${days} days" || add "tls_$c" false "expires in ${days} days"; done
last=$(ls -1t /var/backups/dkp/*.enc 2>/dev/null | head -1); if [[ -n $last ]]; then age=$(( ($(date +%s) - $(stat -c %Y "$last")) / 3600 )); (( age < 27 )) && add backup_fresh true "${age} h" || add backup_fresh false "last backup ${age} h old"; else add backup_fresh false "no backup"; fi
printf '{"time":"%s","failures":%d,"checks":[%s]}\n' "$(date -u +%FT%TZ)" "$fail" "$(IFS=,; echo "${checks[*]}")" > "$out/status.json.tmp" && mv "$out/status.json.tmp" "$out/status.json"
(( fail == 0 )) && logger -p user.info -t dkp-monitor "all ${#checks[@]} checks passed"
exit 0
