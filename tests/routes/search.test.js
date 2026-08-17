const { startTestServer, stubProvider } = require('../helpers/setup');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const tmdb = require('../../utils/tmdb');
const igdb = require('../../utils/igdb');

/* Getestet werden nur die schlüsselbasierten Anbieter (TMDB/IGDB) — der
   Jikan-/AniList-Pfad destrukturiert seine Helfer beim Laden und ließe sich
   nicht ohne echten Netzzugriff prüfen. */

let srv;
let token;

before(async () =>
{
  srv = startTestServer();
  const reg = await srv.req('POST', '/api/auth/register',
    { username: 'searchtest', email: 'searchtest@test.de', password: 'geheim123' });
  token = reg.data.token;
});
after(async () =>
{
  await srv.close();
});

const GAME_PAGE = {
  results: [{ mal_id: 3498, type: 'game', title: 'GTA V', source: 'igdb' }],
  pagination: { current_page: 1, last_visible_page: 5, has_next_page: true },
};

test('Search-Routen erfordern Authentifizierung', async () =>
{
  const res = await srv.req('GET', '/api/search/game?q=zelda');
  assert.equal(res.status, 401, 'kein offener API-Proxy');
});

test('Ohne konfigurierten Schlüssel antworten die Anbieter-Routen mit 503', async () =>
{
  // Arrange/Act — setup.js leert TMDB_API_TOKEN, IGDB_CLIENT_ID und IGDB_CLIENT_SECRET
  const game = await srv.req('GET', '/api/search/game?q=zelda', undefined, token);
  const movie = await srv.req('GET', '/api/search/movie?q=matrix', undefined, token);
  const topGame = await srv.req('GET', '/api/search/top/game', undefined, token);
  const trending = await srv.req('GET', '/api/search/trending?type=game', undefined, token);

  // Assert
  assert.equal(game.status, 503);
  assert.match(game.data.error, /IGDB/, 'Meldung nennt den fehlenden Anbieter');
  assert.equal(movie.status, 503);
  assert.match(movie.data.error, /TMDB/);
  assert.equal(topGame.status, 503);
  assert.equal(trending.status, 503, 'auch die Trending-Route prüft den Anbieter');
});

test('Suche ohne Suchbegriff wird mit 400 abgelehnt', async () =>
{
  // Arrange
  const restore = stubProvider(igdb, { isConfigured: () => true });
  try
  {
    // Act
    const leer = await srv.req('GET', '/api/search/game?q=', undefined, token);
    const zuLang = await srv.req('GET', `/api/search/game?q=${'x'.repeat(201)}`, undefined, token);

    // Assert
    assert.equal(leer.status, 400);
    assert.equal(zuLang.status, 400, 'Suchbegriffe über 200 Zeichen werden abgewiesen');
  }
  finally
  {
    restore();
  }
});

test('Spiele-Suche reicht Begriff und Seite an IGDB weiter', async () =>
{
  // Arrange
  const calls = [];
  const restore = stubProvider(igdb, {
    isConfigured: () => true,
    searchMedia: async (q, page) =>
    {
      calls.push({ q, page });
      return GAME_PAGE;
    },
  });

  try
  {
    // Act
    const res = await srv.req('GET', '/api/search/game?q=zelda&page=3', undefined, token);

    // Assert
    assert.equal(res.status, 200);
    assert.deepEqual(calls, [{ q: 'zelda', page: 3 }]);
    assert.equal(res.data.results[0].mal_id, 3498);
    assert.equal(res.data.pagination.has_next_page, true);
  }
  finally
  {
    restore();
  }
});

test('Seitenzahlen werden auf 1–100 begrenzt', async () =>
{
  // Arrange
  const pages = [];
  const restore = stubProvider(igdb, {
    isConfigured: () => true,
    searchMedia: async (q, page) =>
    {
      pages.push(page);
      return GAME_PAGE;
    },
  });

  try
  {
    // Act
    await srv.req('GET', '/api/search/game?q=a&page=0', undefined, token);
    await srv.req('GET', '/api/search/game?q=a&page=99999', undefined, token);
    await srv.req('GET', '/api/search/game?q=a&page=abc', undefined, token);

    // Assert
    assert.deepEqual(pages, [1, 100, 1]);
  }
  finally
  {
    restore();
  }
});

test('Detail-Route validiert die ID und liefert das Spiel', async () =>
{
  // Arrange
  const restore = stubProvider(igdb, {
    isConfigured: () => true,
    getById: async (id) => ({ mal_id: id, type: 'game', title: 'Stub', source: 'igdb' }),
  });

  try
  {
    // Act
    const ok = await srv.req('GET', '/api/search/game/3498', undefined, token);
    const bad = await srv.req('GET', '/api/search/game/keine-zahl', undefined, token);

    // Assert
    assert.equal(ok.status, 200);
    assert.equal(ok.data.mal_id, 3498);
    assert.equal(bad.status, 400);
  }
  finally
  {
    restore();
  }
});

test('Trending wählt den Anbieter anhand des Typs, Standard ist movie', async () =>
{
  // Arrange
  const aufgerufen = [];
  const restoreIgdb = stubProvider(igdb, {
    isConfigured: () => true,
    trending: async () =>
    {
      aufgerufen.push('igdb');
      return GAME_PAGE;
    },
  });
  const restoreTmdb = stubProvider(tmdb, {
    isConfigured: () => true,
    trending: async (type) =>
    {
      aufgerufen.push(`tmdb:${type}`);
      return { results: [], pagination: {} };
    },
  });

  try
  {
    // Act
    await srv.req('GET', '/api/search/trending?type=game', undefined, token);
    await srv.req('GET', '/api/search/trending?type=tv', undefined, token);
    await srv.req('GET', '/api/search/trending', undefined, token);
    await srv.req('GET', '/api/search/trending?type=quatsch', undefined, token);

    // Assert
    assert.deepEqual(aufgerufen, ['igdb', 'tmdb:tv', 'tmdb:movie', 'tmdb:movie'],
      'unbekannte Typen fallen auf movie zurück');
  }
  finally
  {
    restoreIgdb();
    restoreTmdb();
  }
});

test('Anbieter-Fehler werden als 500 durchgereicht, nicht als Absturz', async () =>
{
  // Arrange
  const restore = stubProvider(igdb, {
    isConfigured: () => true,
    topMedia: async () =>
    {
      throw new Error('IGDB 522');
    },
  });

  try
  {
    // Act
    const res = await srv.req('GET', '/api/search/top/game', undefined, token);

    // Assert
    assert.equal(res.status, 500);
    assert.ok(res.data.error, 'Fehlerform bleibt JSON');
  }
  finally
  {
    restore();
  }
});
