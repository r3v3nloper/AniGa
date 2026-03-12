/* Shared Jikan API helper – sequential queue-based rate limiter */
const JIKAN = 'https://api.jikan.moe/v4';
const MIN_INTERVAL = 450;
const TIMEOUT_MS = 8000;

let pending = Promise.resolve();

async function jFetch(url)
{
  const execute = async () =>
  {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try
    {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok)
      {
        throw new Error(`Jikan ${res.status}`);
      }
      return res.json();
    }
    finally
    {
      clearTimeout(timer);
    }
  };

  // Chain onto pending to serialize all Jikan requests with rate-limit spacing
  pending = pending
    .catch(() => {})
    .then(() => new Promise(r => setTimeout(r, MIN_INTERVAL)))
    .then(execute);

  return pending;
}

module.exports = { jFetch, JIKAN };
