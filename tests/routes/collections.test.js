const { startTestServer } = require('../helpers/setup');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

let srv;
let token;
let otherToken;
let entryAnimeId;
let entryMangaId;

before(async () =>
{
  srv = startTestServer();
  const reg = await srv.req('POST', '/api/auth/register',
    { username: 'coltest', email: 'coltest@test.de', password: 'geheim123' });
  token = reg.data.token;
  const other = await srv.req('POST', '/api/auth/register',
    { username: 'colfremd', email: 'colfremd@test.de', password: 'geheim123' });
  otherToken = other.data.token;

  // Zwei Einträge unterschiedlichen Typs (Collections sind typ-übergreifend)
  const anime = await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 20, type: 'anime', title: 'Naruto', episodes: 220 },
    listStatus: 'completed',
  }, token);
  entryAnimeId = anime.data.entryId;

  const manga = await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 2, type: 'manga', title: 'Berserk', chapters: 380 },
    listStatus: 'reading',
  }, token);
  entryMangaId = manga.data.entryId;
});
after(async () =>
{
  await srv.close();
});

test('POST /collections legt eine Collection an, doppelte Namen werden abgelehnt', async () =>
{
  // Act
  const created = await srv.req('POST', '/api/collections', { name: 'ReWatch' }, token);

  // Assert
  assert.equal(created.status, 200);
  assert.ok(created.data.id);
  assert.equal(created.data.name, 'ReWatch');

  const dup = await srv.req('POST', '/api/collections', { name: 'ReWatch' }, token);
  assert.equal(dup.status, 400);

  const empty = await srv.req('POST', '/api/collections', { name: '   ' }, token);
  assert.equal(empty.status, 400);
});

test('Ein Eintrag kann in mehreren Collections gleichzeitig sein', async () =>
{
  // Arrange
  const c1 = (await srv.req('POST', '/api/collections', { name: 'Favoriten' }, token)).data;
  const c2 = (await srv.req('POST', '/api/collections', { name: 'Klassiker' }, token)).data;

  // Act — derselbe Anime in beide Collections
  const a1 = await srv.req('POST', `/api/collections/${c1.id}/items`, { listEntryId: entryAnimeId }, token);
  const a2 = await srv.req('POST', `/api/collections/${c2.id}/items`, { listEntryId: entryAnimeId }, token);

  // Assert — in beiden sichtbar
  assert.equal(a1.status, 200);
  assert.equal(a2.status, 200);
  const d1 = await srv.req('GET', `/api/collections/${c1.id}`, undefined, token);
  const d2 = await srv.req('GET', `/api/collections/${c2.id}`, undefined, token);
  assert.ok(d1.data.items.some(i => i.id === entryAnimeId));
  assert.ok(d2.data.items.some(i => i.id === entryAnimeId));
});

test('Collections sind typ-übergreifend (Anime + Manga gemischt)', async () =>
{
  // Arrange
  const c = (await srv.req('POST', '/api/collections', { name: 'Gemischt' }, token)).data;

  // Act
  await srv.req('POST', `/api/collections/${c.id}/items`, { listEntryId: entryAnimeId }, token);
  await srv.req('POST', `/api/collections/${c.id}/items`, { listEntryId: entryMangaId }, token);

  // Assert
  const detail = await srv.req('GET', `/api/collections/${c.id}`, undefined, token);
  const types = detail.data.items.map(i => i.type).sort();
  assert.deepEqual(types, ['anime', 'manga']);
});

test('Doppeltes Hinzufügen desselben Eintrags ist idempotent', async () =>
{
  const c = (await srv.req('POST', '/api/collections', { name: 'Idempotent' }, token)).data;
  await srv.req('POST', `/api/collections/${c.id}/items`, { listEntryId: entryAnimeId }, token);
  await srv.req('POST', `/api/collections/${c.id}/items`, { listEntryId: entryAnimeId }, token);

  const detail = await srv.req('GET', `/api/collections/${c.id}`, undefined, token);
  assert.equal(detail.data.items.length, 1);
});

test('GET /list liefert die Collection-Zugehörigkeiten pro Eintrag mit', async () =>
{
  const list = await srv.req('GET', '/api/list?type=anime', undefined, token);
  const entry = list.data.find(e => e.id === entryAnimeId);
  assert.ok(Array.isArray(entry.collections));
  const names = entry.collections.map(c => c.name);
  assert.ok(names.includes('Favoriten'));
  assert.ok(names.includes('Klassiker'));
});

test('Fremde Nutzer haben keinen Zugriff auf Collections und Einträge', async () =>
{
  // Arrange
  const c = (await srv.req('POST', '/api/collections', { name: 'Privat' }, token)).data;

  // Fremder sieht die Collection nicht
  const foreign = await srv.req('GET', `/api/collections/${c.id}`, undefined, otherToken);
  assert.equal(foreign.status, 404);

  // Fremder kann nichts hinzufügen/löschen
  const add = await srv.req('POST', `/api/collections/${c.id}/items`, { listEntryId: entryAnimeId }, otherToken);
  assert.equal(add.status, 404);
  const del = await srv.req('DELETE', `/api/collections/${c.id}`, undefined, otherToken);
  assert.equal(del.status, 404);

  // Eigene Collection, aber fremder Listen-Eintrag → 404
  const cFremd = (await srv.req('POST', '/api/collections', { name: 'FremdEintrag' }, otherToken)).data;
  const addForeign = await srv.req('POST', `/api/collections/${cFremd.id}/items`,
    { listEntryId: entryAnimeId }, otherToken);
  assert.equal(addForeign.status, 404);
});

test('Item entfernen und Collection löschen funktionieren', async () =>
{
  // Arrange
  const c = (await srv.req('POST', '/api/collections', { name: 'Temporär' }, token)).data;
  await srv.req('POST', `/api/collections/${c.id}/items`, { listEntryId: entryMangaId }, token);

  // Act — Item entfernen
  const rm = await srv.req('DELETE', `/api/collections/${c.id}/items/${entryMangaId}`, undefined, token);
  assert.equal(rm.status, 200);
  let detail = await srv.req('GET', `/api/collections/${c.id}`, undefined, token);
  assert.equal(detail.data.items.length, 0);

  // Act — Collection löschen
  const del = await srv.req('DELETE', `/api/collections/${c.id}`, undefined, token);
  assert.equal(del.status, 200);
  detail = await srv.req('GET', `/api/collections/${c.id}`, undefined, token);
  assert.equal(detail.status, 404);
});

test('Löschen eines Listen-Eintrags entfernt ihn aus allen Collections (CASCADE)', async () =>
{
  // Arrange — neuer Eintrag in zwei Collections
  const saved = await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 999, type: 'anime', title: 'Cascade Test', episodes: 12 },
    listStatus: 'watching',
  }, token);
  const c1 = (await srv.req('POST', '/api/collections', { name: 'CascadeA' }, token)).data;
  const c2 = (await srv.req('POST', '/api/collections', { name: 'CascadeB' }, token)).data;
  await srv.req('POST', `/api/collections/${c1.id}/items`, { listEntryId: saved.data.entryId }, token);
  await srv.req('POST', `/api/collections/${c2.id}/items`, { listEntryId: saved.data.entryId }, token);

  // Act — Listen-Eintrag löschen
  await srv.req('DELETE', `/api/list/${saved.data.entryId}`, undefined, token);

  // Assert — aus beiden Collections verschwunden
  const d1 = await srv.req('GET', `/api/collections/${c1.id}`, undefined, token);
  const d2 = await srv.req('GET', `/api/collections/${c2.id}`, undefined, token);
  assert.equal(d1.data.items.length, 0);
  assert.equal(d2.data.items.length, 0);
});
