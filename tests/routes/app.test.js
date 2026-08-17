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

test('unbekannte API-Pfade liefern JSON-404 statt der SPA-HTML-Seite', async () =>
{
  // Act
  const res = await srv.req('GET', '/api/gibtsnicht');

  // Assert — ohne die /api-404-Route käme hier index.html mit Status 200 zurück
  assert.equal(res.status, 404);
  assert.equal(res.data.error, 'Endpunkt nicht gefunden');
});

test('kaputter JSON-Body wird als 400 mit JSON-Fehler beantwortet', async () =>
{
  // Arrange — bewusst am req-Wrapper vorbei, um ungültiges JSON zu senden
  const res = await fetch(`${srv.base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ das ist kein json',
  });
  const data = await res.json();

  // Assert
  assert.equal(res.status, 400);
  assert.equal(data.error, 'Ungültiger JSON-Body');
});

test('unbekannte Nicht-API-Pfade liefern weiterhin die SPA', async () =>
{
  // Act
  const res = await fetch(`${srv.base}/irgendeine/view`);

  // Assert
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /text\/html/);
});
