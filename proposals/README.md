# Cover-Vorschläge (KI-generiert)

Entwürfe für ein neues, grafisches Cover / einen Hero-Hintergrund im G-Laber-
Branding (Petrol #01516a + Apricot #fcc5a3, Riso-Print-Look). Motiv: zwei
„labernde" Möwen am Vintage-Mikro vor einem Ostsee-Hafen mit Leuchtturm —
maritim + comedy, subtile Anspielung auf die zwei Hosts.

**Noch nicht live** — das braucht eine Branding-Freigabe von Konrad. Aktuell
zeigt der Hero weiter das echte Podcast-Cover (beide Hosts + G-LABER-Typo).

| Datei | Zweck |
|---|---|
| `hero-mockup-with-wordmark.webp` | So sähe der Hero mit dem breiten Motiv + Schriftzug aus (Vorschau) |
| `hero-harbor-wide.webp` | Breites Motiv (1536×1024) ohne Text — für Hero-Hintergrund / OG-Bild |
| `cover-harbor-square.webp` | Quadratisches Cover-Motiv (1024²) — reichhaltige Variante |
| `cover-waves-square.webp` | Minimalistische Ikone (Mikro + Wellen) — für Favicon/App-Icon/OG |

## Herkunft & wie neu bauen

Erzeugt mit OpenAI `gpt-image-1` (Server-`OPENAI_API_KEY`), weil Higgsfield
einen API-Key braucht, der nicht auf dem Server liegt. Prompts + ein
Higgsfield-Runner liegen in `scripts/cover-prompts.json` bzw.
`scripts/higgsfield-cover.mjs` — sobald `HIGGSFIELD_API_KEY`/`_SECRET` gesetzt
sind, lässt sich dieselbe Idee dort generieren:

```bash
HIGGSFIELD_API_KEY=… HIGGSFIELD_API_SECRET=… node scripts/higgsfield-cover.mjs
```

## Wenn Konrad „ja" sagt

Einbau als Hero-Hintergrund ist klein: breites Motiv nach `public/img/`,
im Hero hinter die `.hero-copy` legen (Petrol-Verlauf links für Lesbarkeit,
wie im Mockup), das rechte Cover-Bild entfernen oder verkleinern.
