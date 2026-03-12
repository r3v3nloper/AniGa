const express = require('express');
const router  = express.Router();
const db      = require('../db');
const authMiddleware = require('../middleware/auth');
const { jFetch, JIKAN } = require('../utils/jikan');

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
  const type = req.query.type === 'manga' ? 'manga' : 'anime';
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
      const data = await jFetch(
        `${JIKAN}/${type}?genres=${topGenreIds.join(',')}`
        + `&order_by=score&sort=desc&limit=25&page=${page}&sfw=true`
      );
      results = data.data || [];
    }
    else
    {
      const data = await jFetch(
        `${JIKAN}/top/${type}?limit=25&page=${page}&filter=bypopularity`
      );
      results = data.data || [];
    }

    const filtered = results
      .filter(item => !allMalIds.has(item.mal_id))
      .slice(0, 12)
      .map(item => ({
        mal_id:        item.mal_id,
        type,
        title:         item.title,
        title_english: item.title_english || null,
        image_url:     item.images?.jpg?.large_image_url
                       || item.images?.jpg?.image_url || null,
        synopsis:      item.synopsis || null,
        media_status:  item.status || null,
        episodes:      item.episodes || null,
        chapters:      item.chapters || null,
        volumes:       item.volumes || null,
        api_score:     item.score || null,
        genres:        item.genres?.map(g => g.name) || [],
        year:          item.year || null,
        season:        item.season || null,
        source:        'jikan',
      }));

    res.json({ results: filtered, basedOn: usedGenres });
  }
  catch (err)
  {
    res.status(500).json({ error: 'Empfehlungen konnten nicht geladen werden' });
  }
});

module.exports = router;
