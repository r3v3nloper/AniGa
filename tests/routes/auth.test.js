const { startTestServer } = require('../helpers/setup');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

let srv;
before(() =>
{
  srv = startTestServer();
});
after(async () =>
{
  await srv.close();
});

const USER = { username: 'authtest', email: 'authtest@test.de', password: 'geheim123' };

test('Registrierung liefert Token und User', async () =>
{
  // Act
  const res = await srv.req('POST', '/api/auth/register', USER);

  // Assert
  assert.equal(res.status, 200);
  assert.ok(res.data.token);
  assert.equal(res.data.user.username, 'authtest');
});

test('Registrierung lehnt zu kurze Passwörter ab', async () =>
{
  const res = await srv.req('POST', '/api/auth/register',
    { username: 'kurz', email: 'kurz@test.de', password: '123' });
  assert.equal(res.status, 400);
});

test('Login mit korrekten Daten liefert Token, /me funktioniert', async () =>
{
  // Act
  const login = await srv.req('POST', '/api/auth/login',
    { email: USER.email, password: USER.password });

  // Assert
  assert.equal(login.status, 200);
  assert.ok(login.data.token);

  const me = await srv.req('GET', '/api/auth/me', undefined, login.data.token);
  assert.equal(me.status, 200);
  assert.equal(me.data.username, 'authtest');
});

test('Login mit falschem Passwort und unbekannter E-Mail liefert identisches 401', async () =>
{
  const wrongPw = await srv.req('POST', '/api/auth/login',
    { email: USER.email, password: 'falsch123' });
  const unknown = await srv.req('POST', '/api/auth/login',
    { email: 'gibtsnicht@test.de', password: 'falsch123' });

  assert.equal(wrongPw.status, 401);
  assert.equal(unknown.status, 401);
  // Keine E-Mail-Enumeration über unterschiedliche Fehlermeldungen
  assert.equal(wrongPw.data.error, unknown.data.error);
});

test('Passwortänderung invalidiert alte Tokens und liefert einen frischen', async () =>
{
  // Arrange
  const login = await srv.req('POST', '/api/auth/login',
    { email: USER.email, password: USER.password });
  const oldToken = login.data.token;

  // Act — Passwort ändern
  const change = await srv.req('PUT', '/api/auth/profile',
    { currentPassword: USER.password, newPassword: 'nochgeheimer1' }, oldToken);

  // Assert — frischer Token kommt mit
  assert.equal(change.status, 200);
  assert.ok(change.data.token, 'Antwort muss frischen Token enthalten');

  // Alter Token ist tot, neuer funktioniert
  const withOld = await srv.req('GET', '/api/auth/me', undefined, oldToken);
  assert.equal(withOld.status, 401);
  const withNew = await srv.req('GET', '/api/auth/me', undefined, change.data.token);
  assert.equal(withNew.status, 200);

  // Cleanup: Passwort zurücksetzen für nachfolgende Tests
  const back = await srv.req('PUT', '/api/auth/profile',
    { currentPassword: 'nochgeheimer1', newPassword: USER.password }, change.data.token);
  assert.equal(back.status, 200);
});

test('Geschützte Routen lehnen fehlende/kaputte Tokens ab', async () =>
{
  const noToken = await srv.req('GET', '/api/list');
  assert.equal(noToken.status, 401);

  const badToken = await srv.req('GET', '/api/list', undefined, 'kaputt.kaputt.kaputt');
  assert.equal(badToken.status, 401);

  // Search-Routen sind ebenfalls geschützt (kein offener Proxy)
  const search = await srv.req('GET', '/api/search/top/anime');
  assert.equal(search.status, 401);
});
