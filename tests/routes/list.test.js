const { startTestServer } = require('../helpers/setup');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

let srv;
let token;

before(async () =>
{
  srv = startTestServer();
  const reg = await srv.req('POST', '/api/auth/register',
    { username: 'listtest', email: 'listtest@test.de', password: 'geheim123' });
  token = reg.data.token;
});
after(async () =>
{
  await srv.close();
});

const MANGA = {
  mal_id: 2, type: 'manga', title: 'Berserk',
  chapters: 380, volumes: 42, genres: ['Action'],
};

test('POST /list legt einen Eintrag mit Besitz-Daten an', async () =>
{
  // Act
  const res = await srv.req('POST', '/api/list', {
    mediaData: MANGA,
    listStatus: 'reading', currentChapter: 50, userScore: 5,
    notes: 'Meisterwerk', owned: true, ownedVolumes: 12,
  }, token);

  // Assert
  assert.equal(res.status, 200);
  assert.ok(res.data.success);
});

test('GET /list liefert den Eintrag inkl. owned und owned_volumes', async () =>
{
  // Act
  const res = await srv.req('GET', '/api/list?type=manga', undefined, token);

  // Assert
  assert.equal(res.status, 200);
  const entry = res.data.find(e => e.mal_id === 2);
  assert.ok(entry, 'Eintrag muss in der Liste sein');
  assert.equal(entry.list_status, 'reading');
  assert.equal(entry.current_chapter, 50);
  assert.equal(entry.owned, 1);
  assert.equal(entry.owned_volumes, 12);
  assert.equal(entry.notes, 'Meisterwerk');
  assert.equal(entry.volumes, 42);
});

test('POST /list mit gleicher mal_id aktualisiert statt zu duplizieren (Upsert)', async () =>
{
  // Act — POST hat Full-Replace-Semantik (Track-Modal sendet immer alle Felder)
  await srv.req('POST', '/api/list', {
    mediaData: MANGA, listStatus: 'completed', currentChapter: 380,
    notes: 'Meisterwerk', owned: true, ownedVolumes: 42,
  }, token);
  const res = await srv.req('GET', '/api/list?type=manga', undefined, token);

  // Assert
  const entries = res.data.filter(e => e.mal_id === 2);
  assert.equal(entries.length, 1, 'kein Duplikat');
  assert.equal(entries[0].list_status, 'completed');
  assert.equal(entries[0].owned_volumes, 42);
});

test('PUT /list/:id ändert Teilfelder, ohne andere zu überschreiben', async () =>
{
  // Arrange
  const list = await srv.req('GET', '/api/list?type=manga', undefined, token);
  const entry = list.data.find(e => e.mal_id === 2);

  // Act
  const res = await srv.req('PUT', `/api/list/${entry.id}`,
    { currentChapter: 100, userScore: 4 }, token);

  // Assert
  assert.equal(res.status, 200);
  const after = (await srv.req('GET', '/api/list?type=manga', undefined, token))
    .data.find(e => e.mal_id === 2);
  assert.equal(after.current_chapter, 100);
  assert.equal(after.user_score, 4);
  assert.equal(after.owned, 1, 'owned bleibt unangetastet (COALESCE)');
  assert.equal(after.notes, 'Meisterwerk', 'notes bleiben unangetastet');
});

test('GET /list/check erkennt vorhandene Einträge', async () =>
{
  const yes = await srv.req('GET', '/api/list/check?malId=2&type=manga', undefined, token);
  assert.equal(yes.status, 200);

  const stats = await srv.req('GET', '/api/list/stats', undefined, token);
  assert.equal(stats.status, 200);
  assert.equal(stats.data.manga.total, 1);
});

test('POST /list akzeptiert Filme und Serien (TMDB-Typen)', async () =>
{
  // Act — Film (TMDB-ID im mal_id-Feld, source tmdb)
  const movie = await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 27205, type: 'movie', title: 'Inception', source: 'tmdb', year: 2010 },
    listStatus: 'completed', userScore: 5, owned: true,
  }, token);
  assert.equal(movie.status, 200);

  // Serie mit Episoden
  const tv = await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 1396, type: 'tv', title: 'Breaking Bad', source: 'tmdb',
      episodes: 62, volumes: 5 },
    currentEpisode: 30,
  }, token);
  assert.equal(tv.status, 200);

  // Assert — Typ-Filter + Default-Status + source
  const movies = await srv.req('GET', '/api/list?type=movie', undefined, token);
  assert.equal(movies.data.length, 1);
  assert.equal(movies.data[0].source, 'tmdb');
  assert.equal(movies.data[0].owned, 1);

  const tvs = await srv.req('GET', '/api/list?type=tv', undefined, token);
  assert.equal(tvs.data[0].list_status, 'plan_to_watch', 'Default für tv ist plan_to_watch');
  assert.equal(tvs.data[0].current_episode, 30);

  // Ungültiger Typ bleibt abgelehnt
  const bad = await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 1, type: 'buch', title: 'Nope' },
  }, token);
  assert.equal(bad.status, 400);
});

test('DELETE /list/:id entfernt den Eintrag — aber nur den eigenen', async () =>
{
  // Arrange: zweiter Nutzer darf fremde Einträge nicht löschen
  const other = await srv.req('POST', '/api/auth/register',
    { username: 'anderer', email: 'anderer@test.de', password: 'geheim123' });
  const list = await srv.req('GET', '/api/list?type=manga', undefined, token);
  const entry = list.data.find(e => e.mal_id === 2);

  // Act / Assert: fremder Nutzer → 404
  const foreign = await srv.req('DELETE', `/api/list/${entry.id}`, undefined, other.data.token);
  assert.equal(foreign.status, 404);

  // Eigener Nutzer → Erfolg
  const own = await srv.req('DELETE', `/api/list/${entry.id}`, undefined, token);
  assert.equal(own.status, 200);
  const after = await srv.req('GET', '/api/list?type=manga', undefined, token);
  assert.equal(after.data.length, 0);
});
