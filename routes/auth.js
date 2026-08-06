const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = authMiddleware.JWT_SECRET;

/* Brute-Force-Schutz: max. 10 fehlgeschlagene Versuche pro IP in 15 Minuten */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Zu viele Versuche — bitte in 15 Minuten erneut versuchen' },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFILE_FIELDS = ['username', 'email', 'password_hash'];

router.post('/register', authLimiter, async (req, res) =>
{
  const { username, email, password } = req.body;
  if (!username || !email || !password)
  {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  }
  if (password.length < 6 || password.length > 1000)
  {
    return res.status(400).json({ error: 'Passwort muss zwischen 6 und 1000 Zeichen lang sein' });
  }
  const trimmedName = username.trim();
  if (trimmedName.length < 3 || trimmedName.length > 50)
  {
    return res.status(400).json({ error: 'Benutzername muss zwischen 3 und 50 Zeichen lang sein' });
  }
  const trimmedEmail = email.toLowerCase().trim();
  if (!EMAIL_RE.test(trimmedEmail))
  {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
  }

  try
  {
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(trimmedName, trimmedEmail, hash);

    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: result.lastInsertRowid, username: trimmedName, email: trimmedEmail }
    });
  }
  catch (err)
  {
    if (err.message.includes('UNIQUE'))
    {
      if (err.message.includes('username'))
      {
        return res.status(400).json({ error: 'Benutzername bereits vergeben' });
      }
      return res.status(400).json({ error: 'E-Mail bereits registriert' });
    }
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.post('/login', authLimiter, async (req, res) =>
{
  const { email, password } = req.body;
  if (!email || !password)
  {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  }

  try
  {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user)
    {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
    {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, is_admin: !!user.is_admin }
    });
  }
  catch
  {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.get('/me', authMiddleware, (req, res) =>
{
  const user = db.prepare('SELECT id, username, email, created_at, is_admin FROM users WHERE id = ?')
    .get(req.userId);
  if (!user)
  {
    return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  }
  res.json({ ...user, is_admin: !!user.is_admin });
});

router.put('/profile', authMiddleware, async (req, res) =>
{
  const { username, email, currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user)
  {
    return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  }

  if (newPassword)
  {
    if (!currentPassword)
    {
      return res.status(400).json({ error: 'Aktuelles Passwort erforderlich' });
    }
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid)
    {
      return res.status(400).json({ error: 'Aktuelles Passwort ist falsch' });
    }
    if (newPassword.length < 6 || newPassword.length > 1000)
    {
      return res.status(400).json({ error: 'Neues Passwort muss zwischen 6 und 1000 Zeichen haben' });
    }
  }

  const updates = {};
  if (username && username.trim() !== user.username)
  {
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 50)
    {
      return res.status(400).json({ error: 'Benutzername muss zwischen 3 und 50 Zeichen lang sein' });
    }
    updates.username = trimmed;
  }
  if (email && email.toLowerCase().trim() !== user.email)
  {
    const trimmed = email.toLowerCase().trim();
    if (!EMAIL_RE.test(trimmed))
    {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }
    updates.email = trimmed;
  }
  if (newPassword)
  {
    updates.password_hash = await bcrypt.hash(newPassword, 10);
  }

  if (!Object.keys(updates).length)
  {
    return res.json({
      user: { id: user.id, username: user.username, email: user.email, is_admin: !!user.is_admin }
    });
  }

  try
  {
    const safeKeys = Object.keys(updates).filter(k => PROFILE_FIELDS.includes(k));
    const sets = safeKeys.map(k => `${k} = ?`).join(', ');
    const vals = safeKeys.map(k => updates[k]);
    db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...vals, req.userId);
    const updated = db.prepare('SELECT id, username, email, is_admin FROM users WHERE id = ?')
      .get(req.userId);
    res.json({ user: { ...updated, is_admin: !!updated.is_admin } });
  }
  catch (err)
  {
    if (err.message.includes('UNIQUE'))
    {
      if (err.message.includes('username'))
      {
        return res.status(400).json({ error: 'Benutzername bereits vergeben' });
      }
      return res.status(400).json({ error: 'E-Mail bereits registriert' });
    }
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
