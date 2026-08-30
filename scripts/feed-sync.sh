#!/usr/bin/env bash
# ============================================================
#  feed-sync.sh — hält die G-Laber-Website automatisch mit neuen
#  Podcast-Folgen aktuell.
#
#  Ablauf (nur wenn es WIRKLICH neue/geänderte Folgen gibt):
#    1) npm run fetch-feed  -> holt den Riverside-RSS nach
#       src/data/episodes.json
#    2) Vergleich OHNE das fetchedAt-Feld (der Zeitstempel ändert sich
#       bei jedem Lauf) -> nur echte Episoden-Änderungen zählen
#    3) bei Änderung: committen + pushen (Versionierung)
#    4) Coolify-Redeploy triggern (baut die Seite mit der neuen JSON)
#    5) Live-Check
#
#  Läuft als günstiger Skript-Loop (kein Claude-Agent) via loopctl,
#  Standard: Do 12:00 Europe/Berlin. COOLIFY_API_TOKEN kommt aus
#  ~/claude-cloud/env. Ohne diesen Token bleibt Git aktuell, aber es
#  wird kein Deploy getriggert.
# ============================================================
set -uo pipefail
export TZ=Europe/Berlin
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

REPO="/home/claude/claude-cloud/projects/ROGER/g-laber-website"
DATA="src/data/episodes.json"
APP_UUID="b100apyia03x43qr8j7fxq6e"
COOLIFY_API="https://coolify.jawollja.gmbh/api/v1"
cd "$REPO" || { echo "$(date '+%F %T')  Repo nicht gefunden: $REPO" >&2; exit 1; }

# Überlappende Läufe verhindern
exec 9>/tmp/.g-laber-feed-sync.lock
flock -n 9 || { echo "$(date '+%F %T')  läuft bereits — übersprungen."; exit 0; }

# Env für COOLIFY_API_TOKEN
[ -f "$HOME/claude-cloud/env" ] && { set -a; . "$HOME/claude-cloud/env"; set +a; }

log(){ echo "$(date '+%F %T')  feed-sync: $*"; }

# 1) Feed holen
if ! npm run --silent fetch-feed >/dev/null 2>&1; then
  log "WARN: fetch-feed fehlgeschlagen (Netz/Feed?) — Abbruch, nichts geändert."
  git checkout -- "$DATA" 2>/dev/null || true
  exit 0
fi

# 2) Vergleich ohne fetchedAt (nur Episoden-Inhalt zählt)
NEW="$(jq -S '{c:.channelTitle,e:.episodes}' "$DATA" 2>/dev/null)"
OLD="$(git show "HEAD:$DATA" | jq -S '{c:.channelTitle,e:.episodes}' 2>/dev/null)"
if [ -n "$NEW" ] && [ "$NEW" = "$OLD" ]; then
  # Nur der Zeitstempel hat sich geändert -> zurücksetzen, kein Commit/Deploy
  git checkout -- "$DATA"
  log "keine neuen Folgen (nur Zeitstempel) — nichts zu tun."
  exit 0
fi

# 3) Echte Änderung -> committen + pushen
COUNT="$(jq '.episodes | length' "$DATA")"
NEWEST="$(jq -r '.episodes[0].title' "$DATA")"
git add "$DATA"
git commit -q -m "Feed-Sync: neue Folge(n) — jetzt $COUNT Episoden ($(date '+%d.%m.%Y'))" \
  -m "Neueste: $NEWEST" \
  -m "Automatischer Feed-Sync (scripts/feed-sync.sh)"
if git push -q origin main; then
  log "neue Folge(n) committet & gepusht — jetzt $COUNT Episoden, neueste: $NEWEST"
else
  log "WARN: git push fehlgeschlagen — lokal committet, aber nicht gepusht. Kein Deploy."
  exit 1
fi

# 4) Coolify-Redeploy
if [ -z "${COOLIFY_API_TOKEN:-}" ]; then
  log "Hinweis: COOLIFY_API_TOKEN fehlt — Git ist aktuell, aber kein Auto-Deploy."
  exit 0
fi
dp="$(curl -s -m 30 -H "Authorization: Bearer $COOLIFY_API_TOKEN" \
  "$COOLIFY_API/deploy?uuid=$APP_UUID" -w '%{http_code}' -o /dev/null || echo 000)"
case "$dp" in
  20*) log "Redeploy getriggert (HTTP $dp).";;
  *)   log "FEHLER: Deploy-Trigger HTTP $dp — Push ist raus, Deploy ggf. manuell nachziehen."; exit 1;;
esac

# 5) Live-Check (bis ~3 Min auf den Build warten; Apex-Domain via SNI)
for i in $(seq 1 15); do
  sleep 12
  if curl -sk -m 10 "https://g-laber.com/" | grep -qF "$NEWEST"; then
    log "LIVE bestätigt: neueste Folge \"$NEWEST\" ist online. Fertig."
    exit 0
  fi
done
log "Hinweis: Deploy läuft noch (neueste Folge noch nicht sichtbar). Sollte in Kürze erscheinen."
exit 0
