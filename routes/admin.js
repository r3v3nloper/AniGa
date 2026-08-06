const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const adminMiddleware = require('../middleware/admin');
const { ANIME_COUNT_COL, MANGA_COUNT_COL, parseIntParam } = require('../utils/sql');

const router = express.Router();
router.use(adminMiddleware);

/* ── GET /api/admin/users ────────── */
router.get('/users', (req, res) =>
{
  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.created_at,
      ${ANIME_COUNT_COL},
      ${MANGA_COUNT_COL}
    FROM users u
    WHERE u.is_admin = 0
    ORDER BY u.created_at DESC
  `).all();
  res.json(users);
});

/* ── DELETE /api/admin/users/:id ──── */
router.delete('/users/:id', (req, res) =>
{
  const targetId = parseIntParam(req.params.id);
  if (targetId === null)
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }
  if (targetId === req.userId)
  {
    return res.status(400).json({ error: 'Eigenes Konto kann nicht gelöscht werden' });
  }

  const target = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(targetId);
  if (!target)
  {
    return res.status(404).json({ error: 'Nutzer nicht gefunden' });
  }
  if (target.is_admin)
  {
    return res.status(403).json({ error: 'Admin kann nicht gelöscht werden' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  res.json({ success: true });
});

/* ── PUT /api/admin/users/:id/pw ──── */
router.put('/users/:id/password', async (req, res) =>
{
  const targetId = parseIntParam(req.params.id);
  if (targetId === null)
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }

  const { password } = req.body;
  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 1000)
  {
    return res.status(400).json({ error: 'Passwort muss zwischen 6 und 1000 Zeichen haben' });
  }

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!target)
  {
    return res.status(404).json({ error: 'Nutzer nicht gefunden' });
  }

  const hash = await bcrypt.hash(password, 10);
  // token_version + 1 → alle bestehenden Sitzungen des Nutzers werden ungültig
  db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?')
    .run(hash, targetId);
  res.json({ success: true });
});

module.exports = router;
