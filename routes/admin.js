const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();
router.use(adminMiddleware);

/* ── GET /api/admin/users ─────────────────────────────────── */
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.created_at,
      (SELECT COUNT(*) FROM user_list ul JOIN media_entries me ON ul.media_id = me.id
       WHERE ul.user_id = u.id AND me.type = 'anime') AS animeCount,
      (SELECT COUNT(*) FROM user_list ul JOIN media_entries me ON ul.media_id = me.id
       WHERE ul.user_id = u.id AND me.type = 'manga') AS mangaCount
    FROM users u
    WHERE u.is_admin = 0
    ORDER BY u.created_at DESC
  `).all();
  res.json(users);
});

/* ── DELETE /api/admin/users/:id ──────────────────────────── */
router.delete('/users/:id', (req, res) => {
  const targetId = +req.params.id;
  const target = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(targetId);
  if (!target) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  if (target.is_admin) return res.status(403).json({ error: 'Admin kann nicht gelöscht werden' });

  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  res.json({ success: true });
});

/* ── PUT /api/admin/users/:id/password ────────────────────── */
router.put('/users/:id/password', async (req, res) => {
  const targetId = +req.params.id;
  const { password } = req.body;
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen haben' });

  const target = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(targetId);
  if (!target) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

  const hash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, targetId);
  res.json({ success: true });
});

module.exports = router;
