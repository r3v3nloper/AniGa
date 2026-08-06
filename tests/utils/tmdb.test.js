const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatMedia } = require('../../utils/tmdb');

test('formatMedia mappt einen TMDB-Film ins App-Format', () =>
{
  // Arrange — Detail-Response (mit genres-Array und status)
  const raw = {
    id: 27205,
    title: 'Inception',
    original_title: 'Inception',
    overview: 'Dom Cobb ist ein Dieb…',
    poster_path: '/abc.jpg',
    release_date: '2010-07-15',
    vote_average: 8.369,
    status: 'Released',
    genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }],
  };

  // Act
  const media = formatMedia(raw, 'movie');

  // Assert
  assert.equal(media.mal_id, 27205, 'TMDB-ID landet im mal_id-Feld (source unterscheidet)');
  assert.equal(media.type, 'movie');
  assert.equal(media.title, 'Inception');
  assert.equal(media.title_english, null, 'identischer Originaltitel wird nicht dupliziert');
  assert.equal(media.image_url, 'https://image.tmdb.org/t/p/w500/abc.jpg');
  assert.equal(media.media_status, 'Finished', 'Released → Finished (Badge „Abgeschlossen")');
  assert.equal(media.year, 2010);
  assert.equal(media.api_score, 8.4, 'Score auf eine Nachkommastelle gerundet');
  assert.deepEqual(media.genres, ['Action', 'Science Fiction']);
  assert.equal(media.source, 'tmdb');
  assert.equal(media.episodes, null, 'Filme haben keine Episoden');
});

test('formatMedia mappt eine TMDB-Serie mit Episoden und Staffeln', () =>
{
  // Arrange
  const raw = {
    id: 1396,
    name: 'Breaking Bad',
    original_name: 'Breaking Bad',
    first_air_date: '2008-01-20',
    number_of_episodes: 62,
    number_of_seasons: 5,
    status: 'Ended',
    vote_average: 8.9,
  };

  // Act
  const media = formatMedia(raw, 'tv');

  // Assert
  assert.equal(media.type, 'tv');
  assert.equal(media.title, 'Breaking Bad');
  assert.equal(media.episodes, 62);
  assert.equal(media.volumes, 5, 'Staffeln landen im volumes-Feld');
  assert.equal(media.media_status, 'Finished Airing', 'Ended → Badge „Abgeschlossen"');
  assert.equal(media.year, 2008);
});

test('formatMedia leitet Film-Status aus Suchergebnissen übers Datum ab', () =>
{
  // Arrange — Suchergebnis ohne status-Feld, genre_ids statt genres
  const released = { id: 1, title: 'Alt', release_date: '2000-01-01', genre_ids: [35] };
  const upcoming = { id: 2, title: 'Zukunft', release_date: '2099-01-01', genre_ids: [] };

  // Act / Assert
  assert.equal(formatMedia(released, 'movie').media_status, 'Finished');
  assert.equal(formatMedia(upcoming, 'movie').media_status, 'Not yet aired');
  assert.deepEqual(formatMedia(released, 'movie').genres, ['Komödie'], 'genre_ids → deutsche Namen');
});

test('formatMedia behält abweichende Originaltitel als title_english', () =>
{
  const raw = {
    id: 3, name: 'Haus des Geldes', original_name: 'La casa de papel',
    first_air_date: '2017-05-02',
  };
  const media = formatMedia(raw, 'tv');
  assert.equal(media.title, 'Haus des Geldes');
  assert.equal(media.title_english, 'La casa de papel');
});
