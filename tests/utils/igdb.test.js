const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatMedia } = require('../../utils/igdb');

/* Zeitstempel in Sekunden — IGDB liefert first_release_date so */
const SEK = 1000;
const VERGANGENHEIT = Math.floor(new Date('2013-09-17T00:00:00Z').getTime() / SEK);
const ZUKUNFT = Math.floor(Date.now() / SEK) + 90 * 86400;

test('formatMedia mappt ein IGDB-Spiel ins App-Format', () =>
{
  // Arrange
  const raw = {
    id: 1020,
    name: 'Grand Theft Auto V',
    summary: 'Rockstars Open-World-Klassiker…',
    cover: { image_id: 'co2lbd' },
    first_release_date: VERGANGENHEIT,
    aggregated_rating: 92.4,
    rating: 88.1,
    genres: [{ slug: 'shooter' }, { slug: 'adventure' }],
  };

  // Act
  const media = formatMedia(raw);

  // Assert
  assert.equal(media.mal_id, 1020, 'IGDB-ID landet im mal_id-Feld (source unterscheidet)');
  assert.equal(media.type, 'game');
  assert.equal(media.title, 'Grand Theft Auto V');
  assert.equal(media.image_url, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg');
  assert.equal(media.synopsis, 'Rockstars Open-World-Klassiker…');
  assert.equal(media.media_status, 'Finished', 'erschienen → Badge „Erschienen"');
  assert.equal(media.year, 2013, 'Unix-Sekunden → Jahr');
  assert.equal(media.api_score, 9.2, 'Kritiker-Wertung 92.4/100 → 9.2 auf der 0–10-Skala');
  assert.deepEqual(media.genres, ['Shooter', 'Abenteuer'], 'Slugs → deutsche Namen');
  assert.equal(media.source, 'igdb');
  assert.equal(media.episodes, null, 'Spiele haben keinen Fortschrittszähler');
  assert.equal(media.chapters, null);
  assert.equal(media.volumes, null);
});

test('Wertungs-Reihenfolge: Kritiker vor kombiniert vor Nutzer', () =>
{
  // Arrange / Act / Assert
  assert.equal(formatMedia({ id: 1, name: 'A', aggregated_rating: 80, total_rating: 70, rating: 60 })
    .api_score, 8, 'aggregated_rating hat Vorrang');
  assert.equal(formatMedia({ id: 2, name: 'B', total_rating: 75, rating: 60 })
    .api_score, 7.5, 'ohne Kritiker-Wertung zählt die kombinierte');
  assert.equal(formatMedia({ id: 3, name: 'C', rating: 64 })
    .api_score, 6.4, 'zuletzt die Nutzer-Wertung');
  assert.equal(formatMedia({ id: 4, name: 'D' }).api_score, null, 'ohne Wertung bleibt es leer');
});

test('Erscheinungsstatus wird aus Enum und Datum abgeleitet', () =>
{
  // Assert — Enum hat Vorrang
  assert.equal(formatMedia({ id: 1, name: 'A', status: 6, first_release_date: VERGANGENHEIT })
    .media_status, 'Discontinued', 'abgesagt → Badge „Eingestellt"');
  assert.equal(formatMedia({ id: 2, name: 'B', status: 4, first_release_date: VERGANGENHEIT })
    .media_status, 'Currently Airing', 'Early Access → Badge „Läuft"');
  assert.equal(formatMedia({ id: 3, name: 'C', status: 7 })
    .media_status, 'Not yet aired', 'Gerücht → Badge „Angekündigt"');

  // Ohne Enum entscheidet das Datum
  assert.equal(formatMedia({ id: 4, name: 'D', first_release_date: VERGANGENHEIT })
    .media_status, 'Finished');
  assert.equal(formatMedia({ id: 5, name: 'E', first_release_date: ZUKUNFT })
    .media_status, 'Not yet aired');
  assert.equal(formatMedia({ id: 6, name: 'F' })
    .media_status, 'Not yet aired', 'ohne Datum gilt der Titel als angekündigt');
});

test('Fehlende Felder führen nicht zu kaputten Werten', () =>
{
  // Arrange — IGDB liefert viele Felder nur optional
  const media = formatMedia({ id: 7, name: 'Minimal' });

  // Assert
  assert.equal(media.image_url, null, 'ohne cover kein Bild-Pfad');
  assert.equal(media.synopsis, null);
  assert.equal(media.year, null);
  assert.deepEqual(media.genres, []);
  assert.equal(media.avg_play_minutes, null,
    'Spielzeit kommt aus einem eigenen Endpunkt und bleibt in Suchergebnissen leer');
});

test('Unbekannte Genre-Slugs bleiben als Slug erhalten', () =>
{
  // Arrange — IGDB könnte neue Genres einführen
  const media = formatMedia({ id: 8, name: 'Neu', genres: [{ slug: 'roguelike' }] });

  // Assert
  assert.deepEqual(media.genres, ['roguelike']);
});
