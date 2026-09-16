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
    dateISO: date.toISOString().slice(0, 10),
    dateHuman: date.toLocaleDateString('de-DE', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin',
    }),
    dateShort: date.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'Europe/Berlin',
    }),
    /** "1:25:50" -> "1 Std 25 Min", "28:40" -> "28 Min" */
    durationHuman: episode.duration
      .replace(/^00:/, '')
      .replace(/^0/, '')
      .replace(/^(\d+):(\d+):\d+$/, '$1 Std $2 Min')
      .replace(/^(\d+):\d+$/, '$1 Min'),
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
