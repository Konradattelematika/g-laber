# G-Laber Podcast — Website (g-laber.com)

Offizielle Website für den **G-Laber Podcast** von Roger G. (Rostock) und
Jana Jansen (Rheinland). Domain ist **g-laber.com** (passend zur Kontakt-Mail;
das ältere g-laber.de mit dem Sprechblasen-Platzhalter liegt woanders und
gehört NICHT zu diesem Projekt).
Statischer Astro-Build, kein CMS, kein Tracking, keine Cookies.

## Stack & Struktur

- **Astro 5** (statisch), kein Framework-JS — nur `src/scripts/app.js`
  (Player + Scroll-Reveals, Vanilla, ~2 KB)
- Fonts self-hosted: **Anton** (Display, wie Cover-Typo) + **Inter Variable** (Body)
- Design-Tokens in `src/styles/global.css`; Palette aus dem Podcast-Cover
  gesampelt: Petrol `#01516a`, Apricot `#fcc5a3`, Burgund `#6e2b2f`, Paper `#f7f1e8`
- Seiten: `index` (One-Pager), `impressum`, `datenschutz` (beide noch Platzhalter!)

## Inhalte pflegen

- **Neue Folgen**: `npm run fetch-feed` → holt den Podcast-RSS-Feed nach
  `src/data/episodes.json` (eingecheckt, Build braucht kein Netz). Danach
  committen. Episoden NIE von Hand in Astro-Dateien schreiben. Aktueller Feed:
  Spotify for Creators (`https://anchor.fm/s/1160ba830/podcast/rss`) — der
  frühere Riverside-Feed wurde nach dem Hosting-Wechsel nicht mehr befüllt und
  blieb bei Folge 5 stehen. Trailer/Bonus-Episoden (itunes:episodeType ≠ full)
  bekommen keine Folgennummer und erscheinen als „Bonus".
- **Links/Texte/Hosts**: zentral in `src/data/site.ts`.
- **Bilder**: `npm run prep-images` erzeugt alles aus `scripts/cover-source.png`
  (Cover-Varianten, Host-Crops, OG-Bild, Touch-Icon).

## Verifizieren (vor jedem "fertig")

- `npm run build && npx astro preview --port 4322`
- Screenshots 390 px + 1440 px über die tryout-tour-Helfer
  (`~/claude-cloud/projects/ROGER/tryout-tour/scripts/{env.sh,shot.mjs,scroll-shot.mjs}`,
  Headless-Chromium via `source env.sh`). Achtung: Full-Page-Shots zeigen
  lazy-geladene Bilder unterhalb des Viewports leer — für Sektionen scroll-shot nutzen.
- Lighthouse lokal: `npx lighthouse http://localhost:4322/ --chrome-flags="--headless --no-sandbox"`.
  Stand 2026-08-24: 100/100/100/100, LCP 1,7 s, CLS 0.

## Deployment (eingerichtet 2026-08-24)

- Git-Remote: `git@github.com:Konradattelematika/g-laber.git`, Branch `main`
- Coolify-App `g-laber-website` im Projekt "Roger G", UUID `b100apyia03x43qr8j7fxq6e`,
  Build Pack Dockerfile, Domain https://g-laber.com (Achtung: g-laber.de war ein Irrtum, .com ist richtig)
- **Kein GitHub-Webhook** (kein gh-CLI auf dem Server) — nach jedem Push Deploy
  manuell triggern:

  ```bash
  source ~/claude-cloud/env  # enthält COOLIFY_API_TOKEN
  curl -s -H "Authorization: Bearer $COOLIFY_API_TOKEN" \
    "https://coolify.jawollja.gmbh/api/v1/deploy?uuid=b100apyia03x43qr8j7fxq6e"
  ```

- Status/Logs: `GET /api/v1/applications/b100apyia03x43qr8j7fxq6e` bzw.
  `/deployments/applications/<uuid>`. Lokaler Smoke-Test ohne DNS:
  `curl -sk --resolve g-laber.com:443:127.0.0.1 https://g-laber.com/`

## Kinetische Typo (Aufruf + Hover)

`src/components/Kinetic.astro` zerlegt Überschriften in Buchstaben-Spans.
Reveal per @keyframes, Hover per transition (getrennte CSS-Kanäle, siehe
global.css). `reveal` = Load-Animation (Hero), `scroll` = beim Scrollen in den
Viewport (app.js setzt `.is-in` via IntersectionObserver). Easing `--ease-expo`
/ `--ease-spring`. Barrierefrei über `.sr-only`-Text (kein aria-label auf span).

## Offene Punkte

- [x] DNS + SSL: seit 2026-08-26 live — A-Record 167.233.49.190 (nur Apex,
      kein www-Record), Let's-Encrypt-Zertifikat gültig bis 2026-11-24.
- [x] Host-Fotos: echte Studio-/Streetfotos (Jana + Roger), Jana-Ticketlink
      (janajansen.de/items), kinetische Typo — alles live (Stand 2026-08-28).
- [ ] **Cover-Entscheidung**: KI-Cover-Vorschläge liegen in `proposals/`
      (Hero-Mockup `hero-mockup-with-wordmark.webp`). Wenn Konrad zustimmt →
      breites Motiv als Hero-Hintergrund einbauen (Anleitung in proposals/README).
      Erzeugt mit gpt-image-1, weil Higgsfield-Key fehlt; Higgsfield-Runner
      liegt bereit (`scripts/higgsfield-cover.mjs` + `cover-prompts.json`).
- [ ] Impressum + Datenschutz mit echten Inhalten füllen (§ 5 DDG / DSGVO)
- [x] Direkter Spotify-Show-Link eingetragen (2026-08-30):
      `open.spotify.com/show/033Pnbk0HOhbeO0fyBfsCs` in `src/data/site.ts`
- [x] Wöchentlicher Feed-Sync (eingerichtet 2026-08-30): loopctl-Skript-Loop
      `g-laber-feed`, Do 12:00 Europe/Berlin. `scripts/feed-sync.sh` holt den
      RSS, committet nur bei echten Episoden-Änderungen (fetchedAt ignoriert),
      pusht nach `origin/main` und triggert den Coolify-Redeploy inkl. Live-Check.
      Manuell testen: `./scripts/feed-sync.sh`. Deaktivieren:
      `loopctl disable g-laber-feed`. Zeitplan: `loops/g-laber-feed/schedule` +
      `loopctl sync`.
