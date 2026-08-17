/* Gemeinsamer Rate-Limiter für alle externen API-Clients (Jikan, AniList, TMDB, IGDB).
   Jeder Client bekommt eine eigene Queue: Requests laufen streng seriell mit festem
   Mindestabstand und brechen nach timeoutMs ab. Vorher lag dieses Muster viermal
   kopiert in den Client-Modulen. */
const DEFAULT_TIMEOUT_MS = 8000;

/* Liefert eine fetch-artige Funktion `(url, init?, parse?) => Promise<any>`.
   Ohne `parse` wird auf `res.ok` geprüft und JSON zurückgegeben; ein eigenes
   `parse(res)` übernimmt die Auswertung selbst (z.B. GraphQL-Fehler in der Antwort). */
function createRateLimitedFetch({ name, minInterval, timeoutMs = DEFAULT_TIMEOUT_MS })
{
  let pending = Promise.resolve();

  return function limitedFetch(url, init = {}, parse = null)
  {
    const execute = async () =>
    {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try
      {
        const res = await fetch(url, { ...init, signal: controller.signal });
        if (parse)
        {
          return await parse(res);
        }
        if (!res.ok)
        {
          throw new Error(`${name} ${res.status}`);
        }
        return res.json();
      }
      finally
      {
        clearTimeout(timer);
      }
    };

    // An die Queue anhängen: Fehler des Vorgängers dürfen den nächsten Request nicht kippen
    pending = pending
      .catch(() => {})
      .then(() => new Promise(r => setTimeout(r, minInterval)))
      .then(execute);

    return pending;
  };
}

module.exports = { createRateLimitedFetch, DEFAULT_TIMEOUT_MS };
