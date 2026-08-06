const { startTestServer } = require('../helpers/setup');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

let srv;
let tokenA;
let tokenB;
let userBId;

before(async () =>
{
  srv = startTestServer();
  const a = await srv.req('POST', '/api/auth/register',
    { username: 'nutzerA', email: 'a@test.de', password: 'geheim123' });
  const b = await srv.req('POST', '/api/auth/register',
    { username: 'nutzerB', email: 'b@test.de', password: 'geheim123' });
  tokenA = a.data.token;
  tokenB = b.data.token;
  userBId = b.data.user.id;

  // Nutzer B trackt einen Manga mit privaten Notizen
  await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 13, type: 'manga', title: 'One Piece', chapters: 1100 },
    listStatus: 'reading', currentChapter: 500,
    notes: 'PRIVATE NOTIZ — geht niemanden etwas an',
    owned: true, ownedVolumes: 20,
  }, tokenB);
});
after(async () =>
{
  await srv.close();
});

test('GET /users listet andere Nutzer mit Follow-Status', async () =>
{
  const res = await srv.req('GET', '/api/users', undefined, tokenA);
  assert.equal(res.status, 200);
  const b = res.data.find(u => u.username === 'nutzerB');
  assert.ok(b);
  assert.equal(b.isFollowing, false);
  assert.equal(b.mangaCount, 1);
});

test('Fremde Liste ist einsehbar — aber OHNE private Notizen', async () =>
{
  // Act
  const res = await srv.req('GET', `/api/users/${userBId}/list?type=manga`, undefined, tokenA);

  // Assert
  assert.equal(res.status, 200);
  assert.equal(res.data.length, 1);
  const entry = res.data[0];
  assert.equal(entry.title, 'One Piece');
  assert.equal(entry.current_chapter, 500);
  // Besitz-Info ist öffentlich (Badge in der UI)
  assert.equal(entry.owned, 1);
  assert.equal(entry.owned_volumes, 20);
  // Privacy-Regression: notes dürfen NIE mitkommen
  assert.equal('notes' in entry, false, 'notes dürfen nicht exponiert werden');
});

test('Folgen und Entfolgen aktualisiert den Follow-Status', async () =>
{
  // Act: folgen
  const follow = await srv.req('POST', `/api/users/${userBId}/follow`, undefined, tokenA);
  assert.equal(follow.status, 200);

  let users = await srv.req('GET', '/api/users', undefined, tokenA);
  assert.equal(users.data.find(u => u.id === userBId).isFollowing, true);

  // Act: entfolgen
  const unfollow = await srv.req('DELETE', `/api/users/${userBId}/follow`, undefined, tokenA);
  assert.equal(unfollow.status, 200);

  users = await srv.req('GET', '/api/users', undefined, tokenA);
  assert.equal(users.data.find(u => u.id === userBId).isFollowing, false);
});

test('Vergleich liefert both/onlyMe/onlyThem korrekt', async () =>
{
  // Arrange: A trackt denselben Manga + einen exklusiven
  await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 13, type: 'manga', title: 'One Piece', chapters: 1100 },
    listStatus: 'reading', currentChapter: 200,
  }, tokenA);
  await srv.req('POST', '/api/list', {
    mediaData: { mal_id: 2, type: 'manga', title: 'Berserk', chapters: 380 },
    listStatus: 'plan_to_read',
  }, tokenA);

  // Act
  const res = await srv.req('GET', `/api/users/${userBId}/compare?type=manga`, undefined, tokenA);

  // Assert
  assert.equal(res.status, 200);
  assert.equal(res.data.both.length, 1);
  assert.equal(res.data.both[0].media.title, 'One Piece');
  assert.equal(res.data.onlyMe.length, 1);
  assert.equal(res.data.onlyMe[0].title, 'Berserk');
  assert.equal(res.data.onlyThem.length, 0);
});
