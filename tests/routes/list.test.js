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

  // Serie mit Staffel-Tracking (Episode innerhalb der Staffel) + seasons_data
  const tv = await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 1396, type: 'tv', title: 'Breaking Bad', source: 'tmdb',
      episodes: 62, volumes: 5,
      seasons_data: [{ season: 1, episodes: 7 }, { season: 2, episodes: 13 }] },
    currentEpisode: 5, currentSeason: 2,
  }, token);
  assert.equal(tv.status, 200);

  // Assert — Typ-Filter + Default-Status + source
  const movies = await srv.req('GET', '/api/list?type=movie', undefined, token);
  assert.equal(movies.data.length, 1);
  assert.equal(movies.data[0].source, 'tmdb');
  assert.equal(movies.data[0].owned, 1);

  const tvs = await srv.req('GET', '/api/list?type=tv', undefined, token);
  assert.equal(tvs.data[0].list_status, 'plan_to_watch', 'Default für tv ist plan_to_watch');
  assert.equal(tvs.data[0].current_episode, 5, 'Episode innerhalb der Staffel');
  assert.equal(tvs.data[0].current_season, 2);
  assert.deepEqual(tvs.data[0].seasons_data,
    [{ season: 1, episodes: 7 }, { season: 2, episodes: 13 }],
    'seasons_data wird gespeichert und geparst zurückgeliefert');

  // Ungültiger Typ bleibt abgelehnt
  const bad = await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 1, type: 'buch', title: 'Nope' },
  }, token);
  assert.equal(bad.status, 400);
});

test('POST /list akzeptiert Spiele (IGDB-Typ) ohne Fortschrittszähler', async () =>
{
  // Act — IGDB-ID im mal_id-Feld, source igdb
  const res = await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 3498, type: 'game', title: 'Grand Theft Auto V', source: 'igdb',
      year: 2013, genres: ['Action', 'Abenteuer'] },
    listStatus: 'completed', userScore: 5, owned: true,
  }, token);

  // Assert
  assert.equal(res.status, 200);
  const games = await srv.req('GET', '/api/list?type=game', undefined, token);
  assert.equal(games.data.length, 1);
  assert.equal(games.data[0].source, 'igdb');
  assert.equal(games.data[0].list_status, 'completed');
  assert.equal(games.data[0].owned, 1);
  assert.equal(games.data[0].episodes, null, 'Spiele haben keine Episoden');
  assert.deepEqual(games.data[0].genres, ['Action', 'Abenteuer']);

  // Stats kennen den Typ game
  const stats = await srv.req('GET', '/api/list/stats', undefined, token);
  assert.equal(stats.data.game.total, 1);
  assert.equal(stats.data.game.completed, 1);

  // check findet den Eintrag über (malId, type)
  const check = await srv.req('GET', '/api/list/check?malId=3498&type=game', undefined, token);
  assert.ok(check.data, 'Eintrag muss über /check auffindbar sein');
});

test('Spielzeit: eigene Angabe und Anbieter-Durchschnitt werden gespeichert', async () =>
{
  // Arrange — 42,5 Stunden eigene Spielzeit, 92,3 Std Durchschnitt vom Anbieter
  const GAME = { mal_id: 7346, type: 'game', title: 'Breath of the Wild', source: 'igdb',
    avg_play_minutes: 5536 };

  // Act
  const res = await srv.req('POST', '/api/list', {
    mediaData: GAME, listStatus: 'completed', playMinutes: 2550,
  }, token);

  // Assert
  assert.equal(res.status, 200);
  const entry = (await srv.req('GET', '/api/list?type=game', undefined, token))
    .data.find(e => e.mal_id === 7346);
  assert.equal(entry.play_minutes, 2550, 'eigene Spielzeit in Minuten');
  assert.equal(entry.avg_play_minutes, 5536, 'Durchschnitt kommt aus media_entries');
});

test('Spielzeit lässt sich per POST überschreiben und leeren', async () =>
{
  // Arrange
  const GAME = { mal_id: 7346, type: 'game', title: 'Breath of the Wild', source: 'igdb' };

  // Act — anderer Wert
  await srv.req('POST', '/api/list', { mediaData: GAME, listStatus: 'completed',
    playMinutes: 3000 }, token);
  const geaendert = (await srv.req('GET', '/api/list?type=game', undefined, token))
    .data.find(e => e.mal_id === 7346);

  // Act — ohne Angabe (Full-Replace leert das Feld)
  await srv.req('POST', '/api/list', { mediaData: GAME, listStatus: 'completed' }, token);
  const geleert = (await srv.req('GET', '/api/list?type=game', undefined, token))
    .data.find(e => e.mal_id === 7346);

  // Assert
  assert.equal(geaendert.play_minutes, 3000);
  assert.equal(geleert.play_minutes, null, 'POST hat Full-Replace-Semantik');
  assert.equal(geleert.avg_play_minutes, 5536,
    'der Anbieter-Durchschnitt bleibt erhalten (COALESCE), auch wenn die Suche ihn nicht mitliefert');
});

test('PUT /list/:id aktualisiert die Spielzeit als Teilupdate', async () =>
{
  // Arrange
  const entry = (await srv.req('GET', '/api/list?type=game', undefined, token))
    .data.find(e => e.mal_id === 7346);

  // Act
  const res = await srv.req('PUT', `/api/list/${entry.id}`, { playMinutes: 1800 }, token);

  // Assert
  assert.equal(res.status, 200);
  const after = (await srv.req('GET', '/api/list?type=game', undefined, token))
    .data.find(e => e.mal_id === 7346);
  assert.equal(after.play_minutes, 1800);
  assert.equal(after.list_status, 'completed', 'andere Felder bleiben unangetastet');
});

test('Collections nehmen Spiele typ-übergreifend auf', async () =>
{
  // Arrange — Collection anlegen und den Spiele-Eintrag zuordnen
  const col = await srv.req('POST', '/api/collections', { name: 'Backlog', emoji: '🎮' }, token);
  const games = await srv.req('GET', '/api/list?type=game', undefined, token);
  const gameEntry = games.data[0];

  // Act
  const add = await srv.req('POST', `/api/collections/${col.data.id}/items`,
    { listEntryId: gameEntry.id }, token);

  // Assert
  assert.equal(add.status, 200);
  const detail = await srv.req('GET', `/api/collections/${col.data.id}`, undefined, token);
  assert.equal(detail.data.items.length, 1);
  assert.equal(detail.data.items[0].type, 'game');

  // GET /list hängt die Collection-Zugehörigkeit an (Chips im Track-Modal)
  const after = await srv.req('GET', '/api/list?type=game', undefined, token);
  assert.deepEqual(after.data[0].collections.map(c => c.name), ['Backlog']);
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
