const express = require('express');
const router = express.Router();

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

function fmtAnime(a) {
  return {
    mal_id: a.mal_id,
    type: 'anime',
    title: a.title,
    title_english: a.title_english || null,
    title_japanese: a.title_japanese || null,
    image_url: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || null,
    synopsis: a.synopsis || null,
    media_status: a.status || null,
    episodes: a.episodes || null,
    api_score: a.score || null,
    genres: a.genres?.map(g => g.name) || [],
    year: a.year || null,
    season: a.season || null,
    mal_url: a.url || null,
    source: 'jikan'
  };
}

function fmtManga(m) {
  return {
    mal_id: m.mal_id,
    type: 'manga',
    title: m.title,
    title_english: m.title_english || null,
    title_japanese: m.title_japanese || null,
    image_url: m.images?.jpg?.large_image_url || m.images?.jpg?.image_url || null,
    synopsis: m.synopsis || null,
    media_status: m.status || null,
    chapters: m.chapters || null,
    volumes: m.volumes || null,
    api_score: m.score || null,
    genres: m.genres?.map(g => g.name) || [],
    year: m.published?.prop?.from?.year || null,
    mal_url: m.url || null,
    source: 'jikan'
  };
}

router.get('/anime', async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: 'Suchbegriff erforderlich' });
  try {
    const data = await jFetch(`${JIKAN}/anime?q=${encodeURIComponent(q)}&page=${page}&limit=20&sfw=true`);
    res.json({ results: data.data?.map(fmtAnime) || [], pagination: data.pagination });
  } catch { res.status(500).json({ error: 'Suche fehlgeschlagen' }); }
});

router.get('/manga', async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: 'Suchbegriff erforderlich' });
  try {
    const data = await jFetch(`${JIKAN}/manga?q=${encodeURIComponent(q)}&page=${page}&limit=20&sfw=true`);
    res.json({ results: data.data?.map(fmtManga) || [], pagination: data.pagination });
  } catch { res.status(500).json({ error: 'Suche fehlgeschlagen' }); }
});

router.get('/anime/:id', async (req, res) => {
  try {
    const data = await jFetch(`${JIKAN}/anime/${req.params.id}`);
    res.json(fmtAnime(data.data));
  } catch { res.status(500).json({ error: 'Nicht gefunden' }); }
});

router.get('/manga/:id', async (req, res) => {
  try {
    const data = await jFetch(`${JIKAN}/manga/${req.params.id}`);
    res.json(fmtManga(data.data));
  } catch { res.status(500).json({ error: 'Nicht gefunden' }); }
});

router.get('/top/anime', async (req, res) => {
  try {
    const data = await jFetch(`${JIKAN}/top/anime?limit=20&filter=bypopularity`);
    res.json({ results: data.data?.map(fmtAnime) || [] });
  } catch { res.status(500).json({ error: 'Laden fehlgeschlagen' }); }
});

router.get('/top/manga', async (req, res) => {
  try {
    const data = await jFetch(`${JIKAN}/top/manga?limit=20&filter=bypopularity`);
    res.json({ results: data.data?.map(fmtManga) || [] });
  } catch { res.status(500).json({ error: 'Laden fehlgeschlagen' }); }
});

router.get('/seasonal', async (req, res) => {
  try {
    const data = await jFetch(`${JIKAN}/seasons/now?limit=20`);
    res.json({ results: data.data?.map(fmtAnime) || [] });
  } catch { res.status(500).json({ error: 'Laden fehlgeschlagen' }); }
});

module.exports = router;
