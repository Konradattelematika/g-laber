/**
 * Findet den Chromium für die QA-Skripte (shot, scroll-shot, check-site).
 *
 * Vorher stand in jedem Skript derselbe fest verdrahtete Pfad auf die
 * Playwright-Revision 1228. Sobald playwright-core aktualisiert wird und die
 * alte Revision wegfällt, sterben alle Skripte mit einer nichtssagenden
 * ENOENT-Meldung — im Cache liegt hier z. B. längst auch 1234.
 *
 * Reihenfolge: CHROME_PATH (setzt scripts/env.sh) -> neueste
 * headless-shell-Revision -> neueste vollständige Chromium-Revision.
 */
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CACHE = join(homedir(), '.cache/ms-playwright');

/** Verzeichnisse wie "chromium_headless_shell-1234" nach Revision absteigend */
function revisions(prefix) {
  if (!existsSync(CACHE)) return [];
  return readdirSync(CACHE)
    .filter((d) => d.startsWith(`${prefix}-`))
    .map((d) => ({ dir: d, rev: Number(d.slice(prefix.length + 1)) }))
    .filter((d) => Number.isFinite(d.rev))
    .sort((a, b) => b.rev - a.rev)
    .map((d) => d.dir);
}

export function chromiumPath() {
  const candidates = [
    process.env.CHROME_PATH,
    ...revisions('chromium_headless_shell').map((d) =>
      join(CACHE, d, 'chrome-headless-shell-linux64/chrome-headless-shell')
    ),
    ...revisions('chromium').map((d) => join(CACHE, d, 'chrome-linux64/chrome')),
  ].filter(Boolean);

  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      'Kein Chromium gefunden. Erwartet unter ~/.cache/ms-playwright/ oder über ' +
        'CHROME_PATH. Vorher `source scripts/env.sh` ausführen (setzt außerdem ' +
        'LD_LIBRARY_PATH, ohne das startet der Browser nicht).'
    );
  }
  return found;
}

/** Standard-Launch-Optionen für alle QA-Skripte */
export const launchOptions = () => ({
  executablePath: chromiumPath(),
  args: ['--no-sandbox', '--disable-gpu'],
});
