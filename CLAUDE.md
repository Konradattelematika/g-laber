# G-Laber Podcast — Website (g-laber.de)

Offizielle Website für den **G-Laber Podcast** von Roger G. (Rostock) und
Jana Jansen (Rheinland). Ersetzt den bisherigen Platzhalter auf g-laber.de.
Statischer Astro-Build, kein CMS, kein Tracking, keine Cookies.

## Stack & Struktur

- **Astro 5** (statisch), kein Framework-JS — nur `src/scripts/app.js`
  (Player + Scroll-Reveals, Vanilla, ~2 KB)
- Fonts self-hosted: **Anton** (Display, wie Cover-Typo) + **Inter Variable** (Body)
- Design-Tokens in `src/styles/global.css`; Palette aus dem Podcast-Cover
  gesampelt: Petrol `#01516a`, Apricot `#fcc5a3`, Burgund `#6e2b2f`, Paper `#f7f1e8`
- Seiten: `index` (One-Pager), `impressum`, `datenschutz` (beide noch Platzhalter!)

## Inhalte pflegen

- **Neue Folgen**: `npm run fetch-feed` → holt den Riverside-RSS-Feed nach
  `src/data/episodes.json` (eingecheckt, Build braucht kein Netz). Danach
  committen. Episoden NIE von Hand in Astro-Dateien schreiben.
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

## Deployment

Coolify (Build Pack: Dockerfile, wie tryout-tour). Noch NICHT deployt —
es fehlt ein Git-Remote/Coolify-App. Domain-Ziel: g-laber.de.

## Offene Punkte

- [ ] Impressum + Datenschutz mit echten Inhalten füllen (§ 5 DDG / DSGVO)
- [ ] Direkten `open.spotify.com/show/…`-Link eintragen (aktuell Creators-Profil-Link
      in `src/data/site.ts`), sobald bekannt
- [ ] Git-Remote + Coolify-App anlegen, DNS für g-laber.de umstellen
- [ ] Optional: Automatischer wöchentlicher `fetch-feed`-Lauf (cc-queue/loopctl),
      damit neue Folgen ohne Handarbeit erscheinen
