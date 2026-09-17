# G-Laber Podcast — Website (g-laber.com)

Offizielle Website für den **G-Laber Podcast** von Roger G. (Rostock) und
Jana Jansen (Rheinland). Domain ist **g-laber.com** (passend zur Kontakt-Mail;
das ältere g-laber.de mit dem Sprechblasen-Platzhalter liegt woanders und
gehört NICHT zu diesem Projekt).
Statischer Astro-Build, kein CMS, kein Tracking, keine Cookies.

## Stack & Struktur

- **Astro 5** (statisch), kein Framework-JS — nur `src/scripts/app.js`
  (Player + mobile Navigation + Scroll-Reveals, Vanilla, ~3 KB)
- Fonts self-hosted: **Bebas Neue** (Display, exakt die Cover-Schrift) +
  **Inter Variable** (Body). Bebas liegt unter `public/fonts/` (aus
  `@fontsource/bebas-neue` kopiert), damit `global.css` das `@font-face` selbst
  setzt und `Layout.astro` die Datei preloaden kann.
- Design-Tokens in `src/styles/global.css`; Palette aus dem Cover gesampelt:
  Pink `#f875c4`, Orange `#ff751f`, Schwarz `#0b0b0c`, Off-White `#f4efe8`,
  Grau `#c9c4be`
- Komponenten: `Wordmark` (Offset-Wortbild), `Brush` (Pinsel-Masken), `Marquee`
  (Laufband), `FeaturedEpisode`, `EpisodeRow`, `Player`, `Kinetic`.
  Geteilte Episoden-Aufbereitung in `src/lib/episode.ts` (mit Unit-Tests
  daneben in `episode.test.ts`).
- Seiten: `index` (One-Pager), `impressum`, `datenschutz` (beide noch
  Platzhalter!) — Rechtstexte nutzen `src/layouts/Legal.astro`

## Design-System (Redesign 16.09.2026, Quelle: neues Cover)

Das Podcast-Cover ist die Source of Truth. Fünf Regeln, an die sich jede neue
Sektion halten muss (stehen auch im Kopf von `global.css`):

1. Nur Pink, Orange, Schwarz, Weiß/Off-White — keine weiteren Farben.
2. Pink/Orange sind **Flächen mit schwarzer Schrift** oder **Text auf Schwarz**.
   Pinke/orange Schrift auf Off-White ist verboten (Kontrast < 3:1).
3. Typo plakativ: Bebas Neue, sehr groß, eng, Versalien; Body bleibt Inter.
4. Harte Kanten — keine Pillen, kaum Radien, dafür harte Offset-Schatten
   (`box-shadow: .5rem .5rem 0 …`).
5. Pinselstriche sind Akzent, nicht Tapete: höchstens ein Element je Sektion.

- **Offset-Look des Covers**: Utility-Klassen `.offset` (weiß auf dunkel) und
  `.offset-ink` (schwarz auf hell) in `global.css`. Nur für sehr große Grade.
- **Sektions-Tonalität** über `.on-dark` / `.on-paper` / `.on-pink` /
  `.on-orange` — Buttons und Player ziehen darüber automatisch mit.
- **Pinsel-Assets**: `scripts/make-brushes.mjs` erzeugt deterministisch
  `public/img/brush-{stroke,slab,patch}.svg` als schwarze Formen; die Farbe
  kommt in CSS über `mask-image` + `background: currentColor`
  (Komponente `Brush.astro`). Keine externe Grafik-Library.

**Astro-Falle:** Scoped Styles einer Seite greifen NICHT auf dem Wurzelelement
einer Kindkomponente, solange diese die restlichen Props nicht durchreicht.
`Brush`, `Wordmark` und `Kinetic` machen deshalb `{...rest}` auf ihr
Wurzelelement — beim Bauen neuer Komponenten daran denken.

## Inhalte pflegen

- **Neue Folgen**: `npm run fetch-feed` → holt den Podcast-RSS-Feed nach
  `src/data/episodes.json` (eingecheckt, Build braucht kein Netz). Danach
  committen. Episoden NIE von Hand in Astro-Dateien schreiben. Aktueller Feed:
  Spotify for Creators (`https://anchor.fm/s/1160ba830/podcast/rss`) — der
  frühere Riverside-Feed wurde nach dem Hosting-Wechsel nicht mehr befüllt und
  blieb bei Folge 5 stehen. Trailer/Bonus-Episoden (itunes:episodeType ≠ full)
  bekommen keine Folgennummer und erscheinen als „Bonus".
- **Links/Texte/Hosts**: zentral in `src/data/site.ts`.
- **Bilder/Assets**: `npm run prep-images` erzeugt alles aus
  `scripts/cover-source.png` (2000×2000, das aktuelle Cover): Cover-Varianten,
  breiter Fotostreifen `hosts-wide-*` (Typo weggeschnitten), Host-Portraits,
  Pinsel-SVGs, OG-Bild, Favicon, Touch-Icon — und kopiert die Bebas-woff2 nach
  `public/fonts/`. Neues Cover einspielen = `scripts/cover-source.png`
  ersetzen und das Skript laufen lassen.
- **Favicon/OG mit echter Bebas-Typo**: `scripts/lib/bebas.mjs` wandelt die
  woff2 über fontkit in SVG-Pfade — sharp/librsvg kennt keine Webfonts.

## Verifizieren (vor jedem "fertig")

- `npm test` — Unit-Tests der Feed-Aufbereitung (`src/lib/episode.test.ts`,
  node:test mit Type-Stripping, keine zusätzliche Abhängigkeit). Deckt
  Bonus-Folgen ohne Nummer, Dauerformate, Zeitzone und Teaser-Split ab.
- `npm run build && npx astro preview --port 4322`
- Screenshots: `source scripts/env.sh && node scripts/shot.mjs <url> <breite> <out.png>`
  bzw. `scripts/scroll-shot.mjs <url> <breite> <selektor> <out.png>`
  (playwright-core ist devDependency, Chromium über `env.sh`). Achtung:
  Full-Page-Shots zeigen lazy-geladene Bilder unterhalb des Viewports leer —
  für Sektionen scroll-shot nutzen.
- Abnahme-Check: `source scripts/env.sh && node scripts/check-site.mjs`
  (Preview muss laufen) prüft Overflow bei 1440/1024/768/390, Konsolenfehler,
  fehlgeschlagene Requests, Überschriften, interne Links + Anker, mobile
  Navigation und schießt Player-Detailbilder.
- Lighthouse lokal: `npx lighthouse http://localhost:4322/ --chrome-flags="--headless --no-sandbox"`.
  Stand 2026-09-16 (nach Redesign): 100/100/100/100 (Performance schwankt auf
  dem VPS zwischen 99 und 100), LCP ~1,9 s, CLS ~0.
- Live-Smoke-Test nach jedem Deploy: Statuscodes von `/`, `/impressum`,
  `/datenschutz`, `/og.jpg`, `/fonts/…woff2`, `/sitemap.xml` prüfen — alle 200
  OHNE Redirect (sonst greift die nginx.conf nicht).

## Deployment (eingerichtet 2026-08-24)

- Git-Remote: `git@github.com:Konradattelematika/g-laber.git`, Branch `main`
- Coolify-App `g-laber-website` im Projekt "Roger G", UUID `b100apyia03x43qr8j7fxq6e`,
  Build Pack Dockerfile, Domain https://g-laber.com (Achtung: g-laber.de war ein Irrtum, .com ist richtig)
- Das Image ist `nginx:alpine` + eigene `nginx.conf` (seit 17.09.2026). Sie ist
  nötig, weil Astro mit `trailingSlash: 'never'` baut, die Seiten aber als
  `impressum/index.html` ablegt: ohne `absolute_redirect off` +
  `try_files $uri $uri.html $uri/index.html` schickt nginx `/impressum` per 301
  auf `http://…/impressum/`. Dort stecken auch die Cache-Header für
  `/_astro/` und `/fonts/` sowie gzip.
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

- [x] **Redesign live (17.09.2026)**: main = `be4b435`, über Coolify deployt und
      geprüft (alle Routen 200 ohne Redirect, 11 Folgen, Rechtstexte gefüllt).

- [x] DNS + SSL: seit 2026-08-26 live — A-Record 167.233.49.190 (nur Apex,
      kein www-Record), Let's-Encrypt-Zertifikat gültig bis 2026-11-24.
- [x] Host-Fotos: echte Studio-/Streetfotos (Jana + Roger), Jana-Ticketlink
      (janajansen.de/items), kinetische Typo — alles live (Stand 2026-08-28).
- [x] **Cover-Entscheidung erledigt (16.09.2026)**: Konrad hat ein echtes,
      professionell gestaltetes Cover geliefert (Canva, Bebas Neue, Foto von
      Jana + Roger). Die komplette Website wurde darauf umgebaut. Die alten
      KI-Cover-Vorschläge (`proposals/`, `public/proposals/`, Seite
      `/cover-vorschlaege`, `scripts/higgsfield-cover.mjs`, `cover-prompts.json`)
      sind damit hinfällig und wurden entfernt — Stand steckt in der
      Git-Historie.
- [x] **Impressum + Datenschutz gefüllt (17.09.2026)**: Anbieter ist dieselbe
      Person/Firma wie beim Shop g-maltes.de — Roger G, Inhaber Gregor Kurtz,
      Friedrichshöhe 3, 18059 Rostock. Die Daten stehen jetzt zentral in
      `site.legal` (`src/data/site.ts`). Beide Seiten sind indexierbar (kein
      noindex mehr) und in `public/sitemap.xml` eingetragen.
      Der Datenschutztext wurde NICHT vom Shop übernommen: der ist
      shop-spezifisch (Shopify, Klarna, DHL, Google Analytics, Facebook Pixel,
      Cookie-Banner) und beschreibt Verarbeitungen, die es hier gar nicht gibt.
      Stattdessen ein eigener Text für diese statische Seite.
      **Offen für Konrad:** g-maltes.de nennt im Impressum „Friedrichshöhe 3“,
      in der Datenschutzerklärung aber „Platz d. Freundschaft 11-13“. Hier steht
      die Impressums-Adresse (§ 5 DDG ist dafür maßgeblich) — welche stimmt,
      muss er klären und ggf. auch im Shop korrigieren. Eine USt-IdNr. ist
      nirgends angegeben; falls vorhanden, gehört sie ins Impressum.
- [x] Direkter Spotify-Show-Link eingetragen (2026-08-30):
      `open.spotify.com/show/033Pnbk0HOhbeO0fyBfsCs` in `src/data/site.ts`
- [x] Wöchentlicher Feed-Sync (eingerichtet 2026-08-30): loopctl-Skript-Loop
      `g-laber-feed`, Do 12:00 Europe/Berlin. `scripts/feed-sync.sh` holt den
      RSS, committet nur bei echten Episoden-Änderungen (fetchedAt ignoriert),
      pusht nach `origin/main` und triggert den Coolify-Redeploy inkl. Live-Check.
      Das Skript arbeitet NUR, wenn das Repo auf `main` steht — sonst bricht es
      ab (am 17.09.2026 hat es in einen Feature-Branch committet, während
      `git push origin main` das unveränderte main pushte und der Deploy die
      alte Seite baute). Repo also nicht auf einem Branch stehen lassen.
      Manuell testen: `./scripts/feed-sync.sh`. Deaktivieren:
      `loopctl disable g-laber-feed`. Zeitplan: `loops/g-laber-feed/schedule` +
      `loopctl sync`.
