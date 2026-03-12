const express = require('express');
const router = express.Router();
const { jFetch, JIKAN } = require('../utils/jikan');

function formatMedia(item, type)
{
  const isAnime = type === 'anime';
  return {
    mal_id: item.mal_id,
    type,
    title: item.title,
    title_english: item.title_english || null,
    title_japanese: item.title_japanese || null,
    image_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || null,
    synopsis: item.synopsis || null,
    media_status: item.status || null,
    ...(isAnime
      ? { episodes: item.episodes || null, year: item.year || null, season: item.season || null }
      : { chapters: item.chapters || null, volumes: item.volumes || null,
          year: item.published?.prop?.from?.year || null }),
    api_score: item.score || null,
    genres: item.genres?.map(g => g.name) || [],
    mal_url: item.url || null,
    source: 'jikan'
  };
}

function clampPage(raw)
{
  return Math.max(1, Math.min(100, parseInt(raw) || 1));
}

router.get('/anime', async (req, res) =>
{
  const { q } = req.query;
  const page = clampPage(req.query.page);
  if (!q || q.length > 200)
  {
    return res.status(400).json({ error: 'Suchbegriff erforderlich' });
  }
  try
  {
    const data = await jFetch(
      `${JIKAN}/anime?q=${encodeURIComponent(q)}&page=${page}&limit=20&sfw=true`
    );
    res.json({ results: data.data?.map(a => formatMedia(a, 'anime')) || [], pagination: data.pagination });
  }
  catch
  {
    res.status(500).json({ error: 'Suche fehlgeschlagen' });
  }
});

router.get('/manga', async (req, res) =>
{
  const { q } = req.query;
  const page = clampPage(req.query.page);
  if (!q || q.length > 200)
  {
    return res.status(400).json({ error: 'Suchbegriff erforderlich' });
  }
  try
  {
    const data = await jFetch(
      `${JIKAN}/manga?q=${encodeURIComponent(q)}&page=${page}&limit=20&sfw=true`
    );
    res.json({
      results: data.data?.map(m => formatMedia(m, 'manga')) || [],
      pagination: data.pagination
    });
  }
  catch
  {
    res.status(500).json({ error: 'Suche fehlgeschlagen' });
  }
});

router.get('/anime/:id', async (req, res) =>
{
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id))
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }
  try
  {
    const data = await jFetch(`${JIKAN}/anime/${id}`);
    res.json(formatMedia(data.data, 'anime'));
  }
  catch
  {
    res.status(500).json({ error: 'Nicht gefunden' });
  }
});

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

router.get('/manga/:id', async (req, res) =>
{
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id))
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }
  try
  {
    const data = await jFetch(`${JIKAN}/manga/${id}`);
    res.json(formatMedia(data.data, 'manga'));
  }
  catch
  {
    res.status(500).json({ error: 'Nicht gefunden' });
  }
});

router.get('/top/anime', async (req, res) =>
{
  try
  {
    const data = await jFetch(`${JIKAN}/top/anime?limit=20&filter=bypopularity`);
    res.json({ results: data.data?.map(a => formatMedia(a, 'anime')) || [] });
  }
  catch
  {
    res.status(500).json({ error: 'Laden fehlgeschlagen' });
  }
});

router.get('/top/manga', async (req, res) =>
{
  try
  {
    const data = await jFetch(`${JIKAN}/top/manga?limit=20&filter=bypopularity`);
    res.json({ results: data.data?.map(m => formatMedia(m, 'manga')) || [] });
  }
  catch
  {
    res.status(500).json({ error: 'Laden fehlgeschlagen' });
  }
});

router.get('/seasonal', async (req, res) =>
{
  try
  {
    const data = await jFetch(`${JIKAN}/seasons/now?limit=20`);
    res.json({ results: data.data?.map(a => formatMedia(a, 'anime')) || [] });
  }
  catch
  {
    res.status(500).json({ error: 'Laden fehlgeschlagen' });
  }
});

module.exports = router;
