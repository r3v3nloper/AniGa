/* Test-Bootstrap: MUSS als allererstes required werden (vor db/app/routes),
   damit die SQLite-DB in einem frischen Temp-Verzeichnis landet und
   JWT_SECRET gesetzt ist, bevor middleware/auth lädt. */
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aniga-test-'));
process.env.JWT_SECRET = 'test-secret';
delete process.env.ADMIN_PASSWORD;

/* Startet die echte Express-App auf einem ephemeren Port.
   Liefert base-URL, einen kleinen fetch-Wrapper und close(). */
function startTestServer()
{
  const app = require('../../app');
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  async function req(method, urlPath, body, token)
  {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (token)
    {
      opts.headers.Authorization = `Bearer ${token}`;
    }
    if (body !== undefined)
    {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(base + urlPath, opts);
    let data = null;
    try
    {
      data = await res.json();
    }
    catch
    {
      // Kein JSON-Body (z.B. HTML-Fallback)
    }
    return { status: res.status, data };
  }

  return { base, req, close: () => new Promise(r => server.close(r)) };
}

module.exports = { startTestServer };
