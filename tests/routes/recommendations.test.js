const { startTestServer, stubProvider } = require('../helpers/setup');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const igdb = require('../../utils/igdb');

/* Geprüft wird der schlüsselbasierte Pfad (hier IGDB) inklusive Genre-Gewichtung.
   Der Jikan-Pfad bleibt außen vor — er würde echten Netzverkehr auslösen. */

let srv;
let token;

before(async () =>
{
  srv = startTestServer();
  const reg = await srv.req('POST', '/api/auth/register',
    { username: 'rectest', email: 'rectest@test.de', password: 'geheim123' });
  token = reg.data.token;
});
after(async () =>
{
  await srv.close();
});

async function addGame(mal_id, title, genres, userScore)
{
  await srv.req('POST', '/api/list', {
    mediaData: { mal_id, type: 'game', title, source: 'igdb', genres },
    listStatus: 'completed', userScore,
  }, token);
}

test('Empfehlungen erfordern Authentifizierung', async () =>
{
  const res = await srv.req('GET', '/api/recommendations?type=game');
  assert.equal(res.status, 401);
});

test('Ohne konfigurierten Anbieter kommt 503 statt eines Absturzes', async () =>
{
  const res = await srv.req('GET', '/api/recommendations?type=game', undefined, token);
  assert.equal(res.status, 503);
  assert.match(res.data.error, /IGDB/);
});

test('Ohne Listeneinträge werden die populärsten Titel empfohlen', async () =>
{
  // Arrange
  const aufgerufen = [];
  const restore = stubProvider(igdb, {
    isConfigured: () => true,
    topMedia: async (page) =>
    {
      aufgerufen.push({ fn: 'top', page });
      return { results: [{ mal_id: 1, type: 'game', title: 'Populär' }] };
    },
    byGenres: async () =>
    {
      aufgerufen.push({ fn: 'byGenres' });
      return { results: [] };
    },
  });

  try
  {
    // Act
    const res = await srv.req('GET', '/api/recommendations?type=game', undefined, token);

    // Assert
    assert.equal(res.status, 200);
    assert.deepEqual(aufgerufen, [{ fn: 'top', page: 1 }], 'ohne Genres kein Discover-Aufruf');
    assert.deepEqual(res.data.basedOn, []);
    assert.equal(res.data.results.length, 1);
  }
  finally
  {
    restore();
  }
});

test('Genres werden nach Bewertung gewichtet und als Top 3 abgefragt', async () =>
{
  // Arrange — „Rollenspiel" bekommt das höchste Gewicht (5 + 4), „Indie" das kleinste
  await addGame(101, 'RPG A', ['Rollenspiel', 'Action'], 5);
  await addGame(102, 'RPG B', ['Rollenspiel', 'Abenteuer'], 4);
  await addGame(103, 'Action B', ['Action'], 3);
  await addGame(104, 'Indie X', ['Indie'], 1);

  let empfangeneGenres = null;
  const restore = stubProvider(igdb, {
    isConfigured: () => true,
    byGenres: async (genres, page) =>
    {
      empfangeneGenres = { genres, page };
      // Enthält bewusst einen bereits getrackten Titel (101)
      return { results: [
        { mal_id: 101, type: 'game', title: 'RPG A' },
        { mal_id: 999, type: 'game', title: 'Neuer Titel' },
      ] };
    },
  });

  try
  {
    // Act
    const res = await srv.req('GET', '/api/recommendations?type=game&page=2', undefined, token);

    // Assert
    assert.equal(res.status, 200);
    assert.equal(empfangeneGenres.page, 2, 'Seite wird durchgereicht');
    assert.equal(empfangeneGenres.genres.length, 3, 'maximal drei Genres');
    assert.equal(empfangeneGenres.genres[0], 'Rollenspiel', 'höchstes Gewicht zuerst');
    assert.ok(!empfangeneGenres.genres.includes('Indie'), 'schwächstes Genre fällt raus');
    assert.deepEqual(res.data.basedOn, empfangeneGenres.genres);

    // Bereits getrackte Titel dürfen nicht empfohlen werden
    assert.deepEqual(res.data.results.map(r => r.mal_id), [999]);
  }
  finally
  {
    restore();
  }
});

test('Es werden höchstens 12 Empfehlungen zurückgegeben', async () =>
{
  // Arrange
  const restore = stubProvider(igdb, {
    isConfigured: () => true,
    byGenres: async () => ({
      results: Array.from({ length: 25 }, (_, i) => ({ mal_id: 5000 + i, type: 'game', title: `T${i}` })),
    }),
  });

  try
  {
    // Act
    const res = await srv.req('GET', '/api/recommendations?type=game', undefined, token);

    // Assert
    assert.equal(res.data.results.length, 12);
  }
  finally
  {
    restore();
  }
});

test('Seitenzahl wird auf 1–5 begrenzt', async () =>
{
  // Arrange
  const seiten = [];
  const restore = stubProvider(igdb, {
    isConfigured: () => true,
    byGenres: async (genres, page) =>
    {
      seiten.push(page);
      return { results: [] };
    },
  });

  try
  {
    // Act
    await srv.req('GET', '/api/recommendations?type=game&page=0', undefined, token);
    await srv.req('GET', '/api/recommendations?type=game&page=99', undefined, token);

    // Assert
    assert.deepEqual(seiten, [1, 5]);
  }
  finally
  {
    restore();
  }
});

test('Anbieter-Fehler werden als 500 beantwortet', async () =>
{
  // Arrange
  const restore = stubProvider(igdb, {
    isConfigured: () => true,
    byGenres: async () =>
    {
      throw new Error('IGDB 522');
    },
  });

  try
  {
    // Act
    const res = await srv.req('GET', '/api/recommendations?type=game', undefined, token);

    // Assert
    assert.equal(res.status, 500);
    assert.ok(res.data.error);
  }
  finally
  {
    restore();
  }
});
