const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatMedia, withFallback } = require('../../utils/anilist');

test('formatMedia mappt ein AniList-Anime ins App-Format (inkl. Status & Score)', () =>
{
  // Arrange
  const raw = {
    idMal: 16498,
    title: { romaji: 'Shingeki no Kyojin', english: 'Attack on Titan', native: '進撃の巨人' },
    description: 'Titanen<br>überall.<i>Kursiv</i>',
    status: 'FINISHED',
    episodes: 25,
    averageScore: 86,
    genres: ['Action', 'Drama'],
    season: 'SPRING',
    seasonYear: 2013,
    startDate: { year: 2013 },
    coverImage: { extraLarge: 'https://s4.anilist.co/xl.jpg', large: 'https://s4.anilist.co/l.jpg' },
  };

  // Act
  const media = formatMedia(raw, 'anime');

  // Assert
  assert.equal(media.mal_id, 16498);
  assert.equal(media.title, 'Shingeki no Kyojin');
  assert.equal(media.title_english, 'Attack on Titan');
  // AniList-Status wird auf MAL-Status-Strings gemappt (Frontend-Badges)
  assert.equal(media.media_status, 'Finished Airing');
  // 0-100-Score wird auf die 0-10-Skala umgerechnet
  assert.equal(media.api_score, 8.6);
  // HTML im description-Feld wird entfernt
  assert.ok(!media.synopsis.includes('<'));
  assert.equal(media.season, 'spring');
  assert.equal(media.year, 2013);
  assert.equal(media.image_url, 'https://s4.anilist.co/xl.jpg');
  assert.equal(media.source, 'anilist');
});

test('formatMedia mappt Manga-Status RELEASING auf "Publishing"', () =>
{
  // Arrange
  const raw = {
    idMal: 13,
    title: { romaji: 'One Piece' },
    status: 'RELEASING',
    chapters: null,
    volumes: null,
    startDate: { year: 1997 },
  };

  // Act
  const media = formatMedia(raw, 'manga');

  // Assert
  assert.equal(media.media_status, 'Publishing');
  assert.equal(media.year, 1997);
  assert.equal(media.chapters, null);
  assert.equal(media.volumes, null);
});

test('withFallback nutzt das primäre Ergebnis, wenn es gelingt', async () =>
{
  // Arrange / Act
  const result = await withFallback(
    async () => 'primär',
    async () => 'fallback'
  );

  // Assert
  assert.equal(result, 'primär');
});

test('withFallback springt bei Primär-Fehler auf den Fallback', async () =>
{
  // Arrange / Act
  const result = await withFallback(
    async () => { throw new Error('Jikan down'); },
    async () => 'fallback'
  );

  // Assert
  assert.equal(result, 'fallback');
});

test('withFallback wirft den Primär-Fehler, wenn beide scheitern', async () =>
{
  // Arrange / Act / Assert
  await assert.rejects(
    withFallback(
      async () => { throw new Error('Jikan down'); },
      async () => { throw new Error('AniList down'); }
    ),
    { message: 'Jikan down' }
  );
});
