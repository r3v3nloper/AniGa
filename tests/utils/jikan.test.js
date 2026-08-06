const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatMedia } = require('../../utils/jikan');

test('formatMedia mappt ein Jikan-Anime vollständig', () =>
{
  // Arrange
  const raw = {
    mal_id: 20,
    title: 'Naruto',
    title_english: 'Naruto',
    title_japanese: 'ナルト',
    images: { jpg: { large_image_url: 'https://cdn.example/large.jpg', image_url: 'https://cdn.example/small.jpg' } },
    synopsis: 'Ein Ninja.',
    status: 'Finished Airing',
    episodes: 220,
    year: 2002,
    season: 'fall',
    score: 8.0,
    genres: [{ name: 'Action' }, { name: 'Adventure' }],
    url: 'https://myanimelist.net/anime/20/Naruto',
  };

  // Act
  const media = formatMedia(raw, 'anime');

  // Assert
  assert.equal(media.mal_id, 20);
  assert.equal(media.type, 'anime');
  assert.equal(media.title, 'Naruto');
  assert.equal(media.image_url, 'https://cdn.example/large.jpg');
  assert.equal(media.media_status, 'Finished Airing');
  assert.equal(media.episodes, 220);
  assert.equal(media.year, 2002);
  assert.equal(media.season, 'fall');
  assert.equal(media.api_score, 8.0);
  assert.deepEqual(media.genres, ['Action', 'Adventure']);
  assert.equal(media.source, 'jikan');
  assert.equal(media.chapters, undefined);
});

test('formatMedia mappt ein Jikan-Manga mit Bänden und Publikationsjahr', () =>
{
  // Arrange
  const raw = {
    mal_id: 2,
    title: 'Berserk',
    chapters: 380,
    volumes: 42,
    published: { prop: { from: { year: 1989 } } },
    genres: [],
  };

  // Act
  const media = formatMedia(raw, 'manga');

  // Assert
  assert.equal(media.type, 'manga');
  assert.equal(media.chapters, 380);
  assert.equal(media.volumes, 42);
  assert.equal(media.year, 1989);
  assert.equal(media.episodes, undefined);
});

test('formatMedia liefert null-Fallbacks bei fehlenden Feldern', () =>
{
  // Arrange
  const raw = { mal_id: 1, title: 'Minimal' };

  // Act
  const media = formatMedia(raw, 'anime');

  // Assert
  assert.equal(media.title_english, null);
  assert.equal(media.image_url, null);
  assert.equal(media.synopsis, null);
  assert.equal(media.media_status, null);
  assert.equal(media.episodes, null);
  assert.equal(media.api_score, null);
  assert.deepEqual(media.genres, []);
});
