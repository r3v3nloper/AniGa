const express = require('express');
const router  = express.Router();
const db      = require('../db');
const authMiddleware = require('../middleware/auth');

const JIKAN = 'https://api.jikan.moe/v4';
let lastReq  = 0;

async function jFetch(url) {
  const wait = 450 - (Date.now() - lastReq);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastReq = Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  return res.json();
}

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

/* ── GET /api/recommendations?type=anime ─────────────────── */
router.get('/', authMiddleware, async (req, res) => {
  const type = req.query.type === 'manga' ? 'manga' : 'anime';

  // 1. Fetch user's list with genres + scores
  const entries = db.prepare(`
    SELECT ul.user_score, me.genres, me.mal_id
    FROM user_list ul
    JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ? AND me.type = ? AND me.genres IS NOT NULL
  `).all(req.userId, type);

  // 2. Collect all mal_ids already in list (for filtering later)
  const allMalIds = new Set(
    db.prepare(`
      SELECT me.mal_id FROM user_list ul
      JOIN media_entries me ON ul.media_id = me.id
      WHERE ul.user_id = ? AND me.type = ?
    `).all(req.userId, type).map(r => r.mal_id).filter(Boolean)
  );

  // 3. Build weighted genre frequency map
  const genreWeights = {};
  for (const entry of entries) {
    const genres = entry.genres ? JSON.parse(entry.genres) : [];
    const weight = entry.user_score || 3; // neutral weight if no score
    for (const g of genres) {
      genreWeights[g] = (genreWeights[g] || 0) + weight;
    }
  }

  // 4. Get top 3 genres with known MAL IDs
  const topGenres = Object.entries(genreWeights)
    .filter(([name]) => GENRE_IDS[name])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => GENRE_IDS[name]);

  try {
    let results;

    if (topGenres.length > 0) {
      // 5a. Fetch by genre from Jikan
      const genreParam = topGenres.join(',');
      const data = await jFetch(
        `${JIKAN}/${type}?genres=${genreParam}&order_by=score&sort=desc&limit=25&sfw=true`
      );
      results = data.data || [];
    } else {
      // 5b. Fallback: top-rated anime/manga
      const data = await jFetch(
        `${JIKAN}/top/${type}?limit=25&filter=bypopularity`
      );
      results = data.data || [];
    }

    // 6. Filter out what user already has
    const filtered = results
      .filter(item => !allMalIds.has(item.mal_id))
      .slice(0, 12)
      .map(item => ({
        mal_id:      item.mal_id,
        type,
        title:       item.title,
        title_english: item.title_english || null,
        image_url:   item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || null,
        synopsis:    item.synopsis || null,
        media_status: item.status || null,
        episodes:    item.episodes || null,
        chapters:    item.chapters || null,
        volumes:     item.volumes || null,
        api_score:   item.score || null,
        genres:      item.genres?.map(g => g.name) || [],
        year:        item.year || null,
        season:      item.season || null,
        source:      'jikan',
      }));

    // 7. Return with metadata
    const usedGenres = topGenres.length > 0
      ? Object.entries(genreWeights)
          .filter(([name]) => topGenres.includes(GENRE_IDS[name]))
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name)
      : [];

    res.json({ results: filtered, basedOn: usedGenres });
  } catch (err) {
    res.status(500).json({ error: 'Empfehlungen konnten nicht geladen werden' });
  }
});

module.exports = router;
