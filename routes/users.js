const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { ANIME_COUNT_COL, MANGA_COUNT_COL, parseIntParam } = require('../utils/sql');

router.use(authMiddleware);

/* ── GET /api/users/following ──────── */
router.get('/following', (req, res) =>
{
  const rows = db.prepare(`
    SELECT u.id, u.username, u.created_at,
      ${ANIME_COUNT_COL},
      ${MANGA_COUNT_COL}
    FROM user_follows f
    JOIN users u ON u.id = f.following_id
    WHERE f.follower_id = ?
    ORDER BY u.username COLLATE NOCASE
  `).all(req.userId);
  res.json(rows);
});

/* ── GET /api/users ──────────────────── */
router.get('/', (req, res) =>
{
  const rows = db.prepare(`
    SELECT u.id, u.username, u.created_at,
      ${ANIME_COUNT_COL},
      ${MANGA_COUNT_COL},
      EXISTS(SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = u.id) AS isFollowing
    FROM users u
    WHERE u.id != ? AND u.is_admin = 0
    ORDER BY u.username COLLATE NOCASE
  `).all(req.userId, req.userId);
  res.json(rows.map(r => ({ ...r, isFollowing: !!r.isFollowing })));
});

/* ── GET /api/users/:id/profile ──── */
router.get('/:id/profile', (req, res) =>
{
  const targetId = parseIntParam(req.params.id);
  if (targetId === null)
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }

  const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(targetId);
  if (!user)
  {
    return res.status(404).json({ error: 'Nutzer nicht gefunden' });
  }

  const stats = db.prepare(`
    SELECT
      SUM(CASE WHEN me.type='anime' THEN 1 ELSE 0 END) AS animeTotal,
      SUM(CASE WHEN me.type='anime' AND ul.list_status='completed' THEN 1 ELSE 0 END) AS animeCompleted,
      SUM(CASE WHEN me.type='anime' THEN COALESCE(ul.current_episode,0) ELSE 0 END) AS episodesWatched,
      SUM(CASE WHEN me.type='manga' THEN 1 ELSE 0 END) AS mangaTotal,
      SUM(CASE WHEN me.type='manga' AND ul.list_status='completed' THEN 1 ELSE 0 END) AS mangaCompleted,
      SUM(CASE WHEN me.type='manga' THEN COALESCE(ul.current_chapter,0) ELSE 0 END) AS chaptersRead
    FROM user_list ul
    JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ?
  `).get(targetId);

  const isFollowing = !!db.prepare(
    'SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ?'
  ).get(req.userId, targetId);

  res.json({ ...user, stats, isFollowing });
});

/* ── GET /api/users/:id/list ─────── */
router.get('/:id/list', (req, res) =>
{
  const targetId = parseIntParam(req.params.id);
  if (targetId === null)
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }

  const { type, status } = req.query;
  /* Explizite Spaltenliste — private Felder (notes, Daten) bleiben beim Besitzer */
  let sql = `
    SELECT ul.id, ul.media_id, ul.list_status, ul.current_episode, ul.current_chapter,
           ul.current_page, ul.user_score, ul.owned, ul.owned_volumes, ul.updated_at,
           me.mal_id, me.title, me.title_english, me.image_url,
           me.type, me.episodes, me.chapters, me.volumes, me.api_score,
           me.genres, me.media_status, me.year, me.is_manual
    FROM user_list ul
    JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ?
  `;
  const params = [targetId];
  if (type)
  {
    sql += ' AND me.type = ?';
    params.push(type);
  }
  if (status)
  {
    sql += ' AND ul.list_status = ?';
    params.push(status);
  }
  sql += ' ORDER BY ul.updated_at DESC';

  const rows = db.prepare(sql).all(...params).map(r =>
  {
    let genres = [];
    if (r.genres)
    {
      try
      {
        genres = JSON.parse(r.genres);
      }
      catch
      {
        // ignore parse errors
      }
    }
    return { ...r, genres };
  });
  res.json(rows);
});

/* ── GET /api/users/:id/compare ──── */
router.get('/:id/compare', (req, res) =>
{
  const theirId = parseIntParam(req.params.id);
  if (theirId === null)
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }

  const myId = req.userId;
  const type = req.query.type === 'manga' ? 'manga' : 'anime';

  const fetchList = (userId) => db.prepare(`
    SELECT ul.id, ul.media_id, ul.list_status, ul.current_episode,
           ul.current_chapter, ul.user_score, ul.owned, ul.owned_volumes,
           me.mal_id, me.title, me.image_url, me.episodes, me.chapters, me.volumes, me.type
    FROM user_list ul
    JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ? AND me.type = ?
  `).all(userId, type);

  const myList    = fetchList(myId);
  const theirList = fetchList(theirId);

  const myMap    = new Map(myList.map(e => [e.media_id, e]));
  const theirMap = new Map(theirList.map(e => [e.media_id, e]));

  const both     = [];
  const onlyMe   = [];
  const onlyThem = [];

  for (const [mediaId, mine] of myMap)
  {
    const theirs = theirMap.get(mediaId);
    if (theirs)
    {
      both.push({
        media: { id: mine.media_id, mal_id: mine.mal_id, title: mine.title,
                 image_url: mine.image_url, episodes: mine.episodes, chapters: mine.chapters },
        me:   { status: mine.list_status,   episode: mine.current_episode,
                chapter: mine.current_chapter,   score: mine.user_score },
        them: { status: theirs.list_status, episode: theirs.current_episode,
                chapter: theirs.current_chapter, score: theirs.user_score }
      });
    }
    else
    {
      onlyMe.push(mine);
    }
  }
  for (const [mediaId, theirs] of theirMap)
  {
    if (!myMap.has(mediaId))
    {
      onlyThem.push(theirs);
    }
  }

  both.sort((a, b) => a.media.title.localeCompare(b.media.title));
  onlyMe.sort((a, b) => a.title.localeCompare(b.title));
  onlyThem.sort((a, b) => a.title.localeCompare(b.title));

  res.json({ both, onlyMe, onlyThem });
});

/* ── POST /api/users/:id/follow ──── */
router.post('/:id/follow', (req, res) =>
{
  const targetId = parseIntParam(req.params.id);
  if (targetId === null)
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }
  if (targetId === req.userId)
  {
    return res.status(400).json({ error: 'Sich selbst folgen ist nicht möglich' });
  }

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!target)
  {
    return res.status(404).json({ error: 'Nutzer nicht gefunden' });
  }

  db.prepare(
    'INSERT OR IGNORE INTO user_follows (follower_id, following_id) VALUES (?, ?)'
  ).run(req.userId, targetId);
  res.json({ success: true });
});

/* ── DELETE /api/users/:id/follow ── */
router.delete('/:id/follow', (req, res) =>
{
  const targetId = parseIntParam(req.params.id);
  if (targetId === null)
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }

  db.prepare(
    'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?'
  ).run(req.userId, targetId);
  res.json({ success: true });
});

module.exports = router;
