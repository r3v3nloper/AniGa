const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { jFetch, JIKAN, formatMedia } = require('../utils/jikan');
const anilist = require('../utils/anilist');
const tmdb = require('../utils/tmdb');
const igdb = require('../utils/igdb');
const { withFallback } = anilist;

// Kein offener Proxy: externe API-Zugriffe nur für eingeloggte Nutzer
router.use(authMiddleware);

/* Anbieter mit eigenen Zugangsdaten (TMDB für Filme/Serien, IGDB für Spiele).
   Ein Eintrag pro Typ kapselt Provider-Aufruf und Fehlermeldung — die Handler
   darunter bleiben dadurch typ-agnostisch. */
const KEYED_PROVIDERS = {
  movie: {
    api: tmdb,
    missing: 'TMDB ist nicht konfiguriert (TMDB_API_TOKEN in .env setzen)',
    search: (q, page) => tmdb.searchMedia('movie', q, page),
    byId: (id) => tmdb.getById('movie', id),
    top: () => tmdb.topMedia('movie'),
    trending: () => tmdb.trending('movie'),
  },
  tv: {
    api: tmdb,
    missing: 'TMDB ist nicht konfiguriert (TMDB_API_TOKEN in .env setzen)',
    search: (q, page) => tmdb.searchMedia('tv', q, page),
    byId: (id) => tmdb.getById('tv', id),
    top: () => tmdb.topMedia('tv'),
    trending: () => tmdb.trending('tv'),
  },
  game: {
    api: igdb,
    missing: 'IGDB ist nicht konfiguriert (IGDB_CLIENT_ID und IGDB_CLIENT_SECRET in .env setzen)',
    search: (q, page) => igdb.searchMedia(q, page),
    byId: (id) => igdb.getById(id),
    top: () => igdb.topMedia(),
    trending: () => igdb.trending(),
  },
};

function requireProvider(type)
{
  return (req, res, next) =>
  {
    if (!KEYED_PROVIDERS[type].api.isConfigured())
    {
      return res.status(503).json({ error: KEYED_PROVIDERS[type].missing });
    }
    next();
  };
}

function clampPage(raw)
{
  return Math.max(1, Math.min(100, parseInt(raw) || 1));
}

async function searchViaJikan(type, q, page)
{
  const data = await jFetch(
    `${JIKAN}/${type}?q=${encodeURIComponent(q)}&page=${page}&limit=20&sfw=true`
  );
  return { results: data.data?.map(m => formatMedia(m, type)) || [], pagination: data.pagination };
}

function handleSearch(type)
{
  return async (req, res) =>
  {
    const { q } = req.query;
    const page = clampPage(req.query.page);
    if (!q || q.length > 200)
    {
      return res.status(400).json({ error: 'Suchbegriff erforderlich' });
    }
    try
    {
      const data = await withFallback(
        () => searchViaJikan(type, q, page),
        () => anilist.searchMedia(type, q, page)
      );
      res.json(data);
    }
    catch
    {
      res.status(500).json({ error: 'Suche fehlgeschlagen' });
    }
  };
}

function handleById(type)
{
  return async (req, res) =>
  {
    const id = parseInt(req.params.id);
    if (!Number.isInteger(id))
    {
      return res.status(400).json({ error: 'Ungültige ID' });
    }
    try
    {
      const media = await withFallback(
        async () => formatMedia((await jFetch(`${JIKAN}/${type}/${id}`)).data, type),
        () => anilist.getByMalId(type, id)
      );
      res.json(media);
    }
    catch
    {
      res.status(500).json({ error: 'Nicht gefunden' });
    }
  };
}

function handleTop(type)
{
  return async (req, res) =>
  {
    try
    {
      const data = await withFallback(
        async () =>
        {
          const raw = await jFetch(`${JIKAN}/top/${type}?limit=20&filter=bypopularity`);
          return { results: raw.data?.map(m => formatMedia(m, type)) || [] };
        },
        () => anilist.topMedia(type)
      );
      res.json(data);
    }
    catch
    {
      res.status(500).json({ error: 'Laden fehlgeschlagen' });
    }
  };
}

/* ── TMDB (Filme & Serien) und IGDB (Spiele) ─────────── */
function handleKeyedSearch(type)
{
  return async (req, res) =>
  {
    const { q } = req.query;
    const page = clampPage(req.query.page);
    if (!q || q.length > 200)
    {
      return res.status(400).json({ error: 'Suchbegriff erforderlich' });
    }
    try
    {
      res.json(await KEYED_PROVIDERS[type].search(q, page));
    }
    catch
    {
      res.status(500).json({ error: 'Suche fehlgeschlagen' });
    }
  };
}

function handleKeyedById(type)
{
  return async (req, res) =>
  {
    const id = parseInt(req.params.id);
    if (!Number.isInteger(id))
    {
      return res.status(400).json({ error: 'Ungültige ID' });
    }
    try
    {
      res.json(await KEYED_PROVIDERS[type].byId(id));
    }
    catch
    {
      res.status(500).json({ error: 'Nicht gefunden' });
    }
  };
}

function handleKeyedTop(type)
{
  return async (req, res) =>
  {
    try
    {
      res.json(await KEYED_PROVIDERS[type].top());
    }
    catch
    {
      res.status(500).json({ error: 'Laden fehlgeschlagen' });
    }
  };
}

Object.keys(KEYED_PROVIDERS).forEach(type =>
{
  router.get(`/${type}`, requireProvider(type), handleKeyedSearch(type));
  router.get(`/${type}/:id`, requireProvider(type), handleKeyedById(type));
  router.get(`/top/${type}`, requireProvider(type), handleKeyedTop(type));
});

router.get('/trending', async (req, res) =>
{
  const type = KEYED_PROVIDERS[req.query.type] ? req.query.type : 'movie';
  const provider = KEYED_PROVIDERS[type];
  if (!provider.api.isConfigured())
  {
    return res.status(503).json({ error: provider.missing });
  }
  try
  {
    res.json(await provider.trending());
  }
  catch
  {
    res.status(500).json({ error: 'Laden fehlgeschlagen' });
  }
});

/* ── Jikan/AniList: Anime & Manga ─────────────────────── */
router.get('/anime', handleSearch('anime'));
router.get('/manga', handleSearch('manga'));

router.get('/anime/:id/streaming', async (req, res) =>
{
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id))
  {
    return res.json([]);
  }
  try
  {
    const data = await jFetch(`${JIKAN}/anime/${id}/streaming`);
    res.json(data.data || []);
  }
  catch
  {
    res.json([]);
  }
});

router.get('/anime/:id', handleById('anime'));
router.get('/manga/:id', handleById('manga'));

router.get('/top/anime', handleTop('anime'));
router.get('/top/manga', handleTop('manga'));

router.get('/seasonal', async (req, res) =>
{
  try
  {
    const data = await withFallback(
      async () =>
      {
        const raw = await jFetch(`${JIKAN}/seasons/now?limit=20`);
        return { results: raw.data?.map(a => formatMedia(a, 'anime')) || [] };
      },
      () => anilist.seasonal()
    );
    res.json(data);
  }
  catch
  {
    res.status(500).json({ error: 'Laden fehlgeschlagen' });
  }
});

module.exports = router;
