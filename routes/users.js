const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/* ── GET /api/users/following ─────────────────────────────── */
router.get('/following', (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.username, u.created_at,
      (SELECT COUNT(*) FROM user_list ul JOIN media_entries me ON ul.media_id = me.id
       WHERE ul.user_id = u.id AND me.type = 'anime') AS animeCount,
      (SELECT COUNT(*) FROM user_list ul JOIN media_entries me ON ul.media_id = me.id
       WHERE ul.user_id = u.id AND me.type = 'manga') AS mangaCount
    FROM user_follows f
    JOIN users u ON u.id = f.following_id
    WHERE f.follower_id = ?
    ORDER BY u.username COLLATE NOCASE
  `).all(req.userId);
  res.json(rows);
});

/* ── GET /api/users ───────────────────────────────────────── */
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.username, u.created_at,
      (SELECT COUNT(*) FROM user_list ul JOIN media_entries me ON ul.media_id = me.id
       WHERE ul.user_id = u.id AND me.type = 'anime') AS animeCount,
      (SELECT COUNT(*) FROM user_list ul JOIN media_entries me ON ul.media_id = me.id
       WHERE ul.user_id = u.id AND me.type = 'manga') AS mangaCount,
      EXISTS(SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = u.id) AS isFollowing
    FROM users u
    WHERE u.id != ?
    ORDER BY u.username COLLATE NOCASE
  `).all(req.userId, req.userId);
  res.json(rows.map(r => ({ ...r, isFollowing: !!r.isFollowing })));
});

/* ── GET /api/users/:id/profile ───────────────────────────── */
router.get('/:id/profile', (req, res) => {
  const targetId = +req.params.id;
  const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(targetId);
  if (!user) return res.status(404).json({ error: 'Nutzer nicht gefunden' });

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

/* ── GET /api/users/:id/list ──────────────────────────────── */
router.get('/:id/list', (req, res) => {
  const targetId = +req.params.id;
  const { type, status } = req.query;

  let sql = `
    SELECT ul.*, me.mal_id, me.title, me.title_english, me.image_url,
           me.type, me.episodes, me.chapters, me.volumes, me.api_score,
           me.genres, me.media_status, me.year, me.is_manual
    FROM user_list ul
    JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ?
  `;
  const params = [targetId];
  if (type)   { sql += ' AND me.type = ?';         params.push(type); }
  if (status) { sql += ' AND ul.list_status = ?';  params.push(status); }
  sql += ' ORDER BY ul.updated_at DESC';

  const rows = db.prepare(sql).all(...params).map(r => ({
    ...r,
    genres: r.genres ? JSON.parse(r.genres) : []
  }));
  res.json(rows);
});

/* ── POST /api/users/:id/follow ───────────────────────────── */
router.post('/:id/follow', (req, res) => {
  const targetId = +req.params.id;
  if (targetId === req.userId) return res.status(400).json({ error: 'Sich selbst folgen ist nicht möglich' });
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden' });

  db.prepare(
    'INSERT OR IGNORE INTO user_follows (follower_id, following_id) VALUES (?, ?)'
  ).run(req.userId, targetId);
  res.json({ success: true });
});

/* ── DELETE /api/users/:id/follow ─────────────────────────── */
router.delete('/:id/follow', (req, res) => {
  db.prepare(
    'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?'
  ).run(req.userId, +req.params.id);
  res.json({ success: true });
});

module.exports = router;
