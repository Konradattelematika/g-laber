/**
 * Unit-Tests für die Feed-Aufbereitung.
 *
 * Diese Logik lag früher verstreut in EpisodeCard.astro und wird jetzt von
 * FeaturedEpisode, EpisodeRow und dem JSON-LD-Schema gemeinsam genutzt — die
 * Randfälle (Bonus-Folgen ohne Nummer, Dauerformate, Zeitzone) sind deshalb
 * hier festgenagelt.
 *
 * Aufruf: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepare, type Episode } from './episode.ts';

/** Minimale Folge im Format, das scripts/fetch-feed.mjs schreibt. */
const episode = (over: Partial<Episode> = {}): Episode => ({
  title: 'Glübirne im Gruselhaus!',
  slug: 'gluebirne-im-gruselhaus',
  pubDate: 'Wed, 09 Sep 2026 22:02:00 GMT',
  duration: '01:11:02',
  durationSeconds: 4262,
  description: 'Erster Absatz.\n\nZweiter Absatz.',
  audioUrl: 'https://anchor.fm/s/1160ba830/podcast/play/1.mp3',
  episodeNumber: 9,
  ...over,
});

test('normale Folge: Nummer, Kicker und Anker', () => {
  const e = prepare(episode());
  assert.equal(e.isBonus, false);
  assert.equal(e.numeral, '09');
  assert.equal(e.kicker, 'Folge 9');
  assert.equal(e.anchorId, 'folge-9');
  assert.equal(e.playLabel, 'Folge 9 „Glübirne im Gruselhaus!“ abspielen');
});

test('zweistellige Folgennummern werden nicht aufgefüllt', () => {
  assert.equal(prepare(episode({ episodeNumber: 12 })).numeral, '12');
});

test('Bonus-Folge ohne Nummer: Stern, Slug-Anker, Label ohne Nummer', () => {
  const e = prepare(episode({
    episodeNumber: null,
    title: 'Spitze der kapitalistischen Pyramide',
    slug: 'spitze-der-kapitalistischen-pyramide',
    duration: '00:02:17',
  }));
  assert.equal(e.isBonus, true);
  assert.equal(e.numeral, '★');
  assert.equal(e.kicker, 'Bonus');
  assert.equal(e.anchorId, 'folge-spitze-der-kapitalistischen-pyramide');
  assert.equal(e.playLabel, '„Spitze der kapitalistischen Pyramide“ abspielen');
});

test('Dauer: Stunden, Minuten und Bonus-Kurzfolge', () => {
  // Formate exakt so, wie sie im Feed stehen (immer HH:MM:SS)
  assert.equal(prepare(episode({ duration: '01:11:02' })).durationHuman, '1 Std 11 Min');
  assert.equal(prepare(episode({ duration: '00:28:39' })).durationHuman, '28 Min');
  assert.equal(prepare(episode({ duration: '00:02:17' })).durationHuman, '2 Min');
  assert.equal(prepare(episode({ duration: '10:05:00' })).durationHuman, '10 Std 5 Min');
  // Ältere Feed-Einträge kommen als MM:SS
  assert.equal(prepare(episode({ duration: '28:40' })).durationHuman, '28 Min');
});

test('Dauer im Player bleibt eine Uhrzeit ohne führende Nullen', () => {
  assert.equal(prepare(episode({ duration: '01:11:02' })).durationClock, '1:11:02');
  assert.equal(prepare(episode({ duration: '00:28:39' })).durationClock, '28:39');
  assert.equal(prepare(episode({ duration: '00:02:17' })).durationClock, '2:17');
});

test('Datum: datetime-Attribut und sichtbarer Text meinen denselben Tag', () => {
  // 09.09. 22:02 UTC ist in Berlin schon der 10.09. — beide Felder müssen
  // denselben Tag zeigen, sonst widerspricht das <time>-Attribut dem Text.
  const e = prepare(episode());
  assert.equal(e.dateISO, '2026-09-10');
  assert.equal(e.dateHuman, '10. September 2026');
  assert.equal(e.dateShort, '10.09.26');
});

test('Datum: Winterzeit (UTC+1) wird ebenfalls korrekt umgerechnet', () => {
  const e = prepare(episode({ pubDate: 'Wed, 31 Dec 2025 23:30:00 GMT' }));
  assert.equal(e.dateISO, '2026-01-01');
  assert.equal(e.dateHuman, '1. Januar 2026');
});

test('Beschreibung: erster Absatz ist Teaser, Rest ist einklappbar', () => {
  const e = prepare(episode({ description: 'Teaser hier.\n\nZweiter.\n\nDritter.' }));
  assert.equal(e.teaser, 'Teaser hier.');
  assert.equal(e.more, 'Zweiter.\n\nDritter.');
});

test('Beschreibung: der angehängte Kontakt-Aufruf wird abgeschnitten', () => {
  const e = prepare(episode({
    description: 'Teaser.\n\nInhalt.\n\nSchreibt uns immer gerne an hallo@g-laber.com und so weiter.',
  }));
  assert.equal(e.teaser, 'Teaser.');
  assert.equal(e.more, 'Inhalt.');
});

test('Beschreibung ohne zweiten Absatz liefert leeres „more“', () => {
  const e = prepare(episode({ description: 'Nur ein Absatz.' }));
  assert.equal(e.teaser, 'Nur ein Absatz.');
  assert.equal(e.more, '');
});

test('Rohfelder der Folge bleiben unverändert erhalten', () => {
  const raw = episode();
  const e = prepare(raw);
  assert.equal(e.title, raw.title);
  assert.equal(e.audioUrl, raw.audioUrl);
  assert.equal(e.durationSeconds, raw.durationSeconds);
});
