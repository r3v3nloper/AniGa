const express = require('express');
const router = express.Router();
const { jFetch, JIKAN, formatMedia } = require('../utils/jikan');
const anilist = require('../utils/anilist');
const { withFallback } = anilist;

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
