const CACHE = 'aniga-v16';

/* Nur das Grundgerüst wird beim Install vorgeladen. CSS-Partials und ES-Module holt
   der Stale-While-Revalidate-Zweig unten beim ersten Seitenaufruf automatisch in den
   Cache — dadurch muss beim Anlegen neuer Dateien hier nichts gepflegt werden.
   Wichtig: addAll() schlägt komplett fehl, sobald EIN Eintrag 404 liefert — deshalb
   stehen hier nur Pfade, die es garantiert gibt. */
const STATIC = [
  '/',
  '/index.html',
  '/js/main.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

self.addEventListener('install', e =>
{
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e =>
{
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e =>
{
  const url = new URL(e.request.url);

  // Cross-origin (Cover-Bilder, Font-Dateien): nicht abfangen — der Browser lädt sie
  // direkt unter der Seiten-CSP. SW-fetch() wäre durch die SW-eigene connect-src blockiert.
  // Ausnahme: beim Install vorgecachte URLs (Google-Fonts-CSS) werden aus dem Cache bedient.
  if (url.origin !== self.location.origin)
  {
    if (STATIC.includes(e.request.url))
    {
      e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
    }
    return;
  }

  // Network-first for API calls
  if (url.pathname.startsWith('/api/'))
  {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }
  // Stale-while-revalidate for static assets: serve from cache instantly,
  // refresh the cache in the background so deploys arrive without a version bump
  e.respondWith(
    caches.match(e.request).then(cached =>
    {
      const network = fetch(e.request).then(res =>
      {
        if (res && res.status === 200 && res.type === 'basic')
        {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
      if (cached)
      {
        network.catch(() => {});
        return cached;
      }
      return network.catch(() => caches.match('/index.html'));
    })
  );
});
