const express = require('express');
const router  = express.Router();
const db      = require('../db');
const authMiddleware = require('../middleware/auth');
const { jFetch, JIKAN, formatMedia } = require('../utils/jikan');
const anilist = require('../utils/anilist');
const tmdb = require('../utils/tmdb');
const { withFallback } = anilist;

// MAL genre name → ID lookup
const GENRE_IDS = {
  'Action': 1, 'Adventure': 2, 'Comedy': 4, 'Mystery': 7,
  'Drama': 8, 'Fantasy': 10, 'Historical': 13, 'Horror': 14,
  'Magic': 16, 'Mecha': 18, 'Romance': 22, 'Sci-Fi': 24,
  'Shounen': 27, 'Sports': 30, 'Slice of Life': 36, 'Supernatural': 37,
  'Psychological': 40, 'Thriller': 41, 'Award Winning': 46,
  'Isekai': 62, 'Shoujo': 25, 'Seinen': 42, 'Josei': 43,
  'Military': 38, 'Police': 39, 'Vampire': 32, 'Harem': 35,
  'School': 23, 'Martial Arts': 17, 'Super Power': 31,
};

/* ── GET /api/recommendations?type=anime&page=1 ──────────── */
router.get('/', authMiddleware, async (req, res) =>
{
  const type = ['anime', 'manga', 'movie', 'tv'].includes(req.query.type)
    ? req.query.type
    : 'anime';
  const page = Math.max(1, Math.min(5, parseInt(req.query.page) || 1));

  // Single query: covers both genre weighting and mal_id filtering
  const allEntries = db.prepare(`
    SELECT ul.user_score, me.genres, me.mal_id
    FROM user_list ul
    JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ? AND me.type = ?
  `).all(req.userId, type);

  const allMalIds = new Set(allEntries.map(r => r.mal_id).filter(Boolean));

  // Build weighted genre frequency map (only entries with genres)
  const genreWeights = {};
  for (const entry of allEntries)
  {
    if (!entry.genres)
    {
      continue;
    }
    let genres;
    try
    {
      genres = JSON.parse(entry.genres);
    }
    catch
    {
      continue;
    }
    const weight = entry.user_score || 3;
    for (const g of genres)
    {
      genreWeights[g] = (genreWeights[g] || 0) + weight;
    }
  }

  // Filme/Serien: TMDB-Discover nach den meistgesehenen Genres (deutsche Namen)
  if (type === 'movie' || type === 'tv')
  {
    if (!tmdb.isConfigured())
    {
      return res.status(503).json({ error: 'TMDB ist nicht konfiguriert' });
    }
    const topGenres = Object.entries(genreWeights)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 3);
    try
    {
      const data = topGenres.length
        ? await tmdb.byGenres(type, topGenres, page)
        : await tmdb.topMedia(type, page);
      const filtered = data.results
        .filter(item => !allMalIds.has(item.mal_id))
        .slice(0, 12);
      return res.json({ results: filtered, basedOn: topGenres });
    }
    catch
    {
      return res.status(500).json({ error: 'Empfehlungen konnten nicht geladen werden' });
    }
  }

  // Top 3 genres — derive names and IDs in one pass
  const topGenreEntries = Object.entries(genreWeights)
    .filter(([name]) => GENRE_IDS[name])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const topGenreIds  = topGenreEntries.map(([name]) => GENRE_IDS[name]);
  const usedGenres   = topGenreEntries.map(([name]) => name);

  try
  {
    let results;

    if (topGenreIds.length > 0)
    {
      const data = await withFallback(
        async () =>
        {
          const raw = await jFetch(
            `${JIKAN}/${type}?genres=${topGenreIds.join(',')}`
            + `&order_by=score&sort=desc&limit=25&page=${page}&sfw=true`
          );
          return { results: raw.data?.map(i => formatMedia(i, type)) || [] };
        },
        () => anilist.byGenres(type, usedGenres, page)
      );
      results = data.results;
    }
    else
    {
      const data = await withFallback(
        async () =>
        {
          const raw = await jFetch(
            `${JIKAN}/top/${type}?limit=25&page=${page}&filter=bypopularity`
          );
          return { results: raw.data?.map(i => formatMedia(i, type)) || [] };
        },
        () => anilist.topMedia(type, page)
      );
      results = data.results;
    }

    const filtered = results
      .filter(item => !allMalIds.has(item.mal_id))
      .slice(0, 12);

    res.json({ results: filtered, basedOn: usedGenres });
  }
  catch (err)
  {
    res.status(500).json({ error: 'Empfehlungen konnten nicht geladen werden' });
  }
});

module.exports = router;
