/* Shared Jikan API helper – single rate-limiter for all routes */
const JIKAN = 'https://api.jikan.moe/v4';
let lastReq = 0;

async function jFetch(url) {
  const wait = 450 - (Date.now() - lastReq);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastReq = Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  return res.json();
}

module.exports = { jFetch, JIKAN };
