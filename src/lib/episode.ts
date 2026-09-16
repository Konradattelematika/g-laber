/**
 * Aufbereitung einer Feed-Episode für die Anzeige.
 * Die Rohdaten kommen unverändert aus src/data/episodes.json
 * (erzeugt von scripts/fetch-feed.mjs) — hier wird nur formatiert.
 */
export interface Episode {
  title: string;
  slug: string;
  pubDate: string;
  duration: string;
  durationSeconds: number;
  description: string;
  audioUrl: string;
  episodeNumber: number | null;
  episodeType?: string;
}

/**
 * "01:11:02" -> "1 Std 11 Min", "00:28:39" -> "28 Min", "10:05:00" -> "10 Std 5 Min".
 * Bewusst über Zahlen statt über eine Kette von Ersetzungen: sonst bleibt die
 * führende Null in der Minutenangabe stehen ("1 Std 05 Min").
 * Der Feed liefert HH:MM:SS, ältere Einträge auch MM:SS.
 */
function humanDuration(duration: string) {
  const parts = duration.split(':').map(Number);
  const [hours, minutes] = parts.length >= 3 ? parts : [0, parts[0]];
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return duration;
  return hours ? `${hours} Std ${minutes} Min` : `${minutes} Min`;
}

/** "2026-09-10" in Europe/Berlin — en-CA liefert genau das ISO-Format. */
const isoInBerlin = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Berlin',
  }).format(date);

export function prepare(episode: Episode) {
  const date = new Date(episode.pubDate);

  // Trailer/Bonus-Folgen haben keine Folgennummer -> „Bonus“, Anker über den Slug.
  const isBonus = episode.episodeNumber == null;

  // Beschreibung: erster Absatz als Teaser, Rest einklappbar.
  // Der Feed hängt an jede Folge denselben Kontakt-Aufruf an — den zeigt
  // stattdessen die Kontakt-Sektion.
  const [teaser, ...rest] = episode.description.split('\n\n');
  const more = rest.join('\n\n').replace(/Schreibt (uns )?immer gerne an.*$/s, '').trim();

  return {
    ...episode,
    isBonus,
    anchorId: isBonus ? `folge-${episode.slug}` : `folge-${episode.episodeNumber}`,
    /** Zweistellige Nummer als Gestaltungselement, Bonus bekommt einen Stern */
    numeral: isBonus ? '★' : String(episode.episodeNumber).padStart(2, '0'),
    kicker: isBonus ? 'Bonus' : `Folge ${episode.episodeNumber}`,
    // Bewusst Europe/Berlin statt toISOString(): Folgen erscheinen abends UTC,
    // in Berlin ist dann schon der nächste Tag. Sonst stünde im
    // datetime-Attribut ein anderer Tag als im sichtbaren Datum daneben.
    dateISO: isoInBerlin(date),
    dateHuman: date.toLocaleDateString('de-DE', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin',
    }),
    dateShort: date.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'Europe/Berlin',
    }),
    durationHuman: humanDuration(episode.duration),
    /** kurze Anzeige im Player, z. B. "28:40" */
    durationClock: episode.duration.replace(/^00:/, '').replace(/^0(\d)/, '$1'),
    teaser,
    more,
    playLabel: isBonus
      ? `„${episode.title}“ abspielen`
      : `Folge ${episode.episodeNumber} „${episode.title}“ abspielen`,
  };
}

export type PreparedEpisode = ReturnType<typeof prepare>;
