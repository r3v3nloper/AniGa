const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aniga-secret-key';

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
  if (username.length < 3)
    return res.status(400).json({ error: 'Benutzername muss mindestens 3 Zeichen lang sein' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username.trim(), email.toLowerCase().trim(), hash);

    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: result.lastInsertRowid, username: username.trim(), email: email.toLowerCase().trim() } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      if (err.message.includes('username'))
        return res.status(400).json({ error: 'Benutzername bereits vergeben' });
      return res.status(400).json({ error: 'E-Mail bereits registriert' });
    }
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Ungültige Anmeldedaten' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Ungültige Anmeldedaten' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, is_admin: !!user.is_admin } });
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, email, created_at, is_admin FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  res.json({ ...user, is_admin: !!user.is_admin });
});

router.put('/profile', authMiddleware, async (req, res) => {
  const { username, email, currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

  if (newPassword) {
    if (!currentPassword)
      return res.status(400).json({ error: 'Aktuelles Passwort erforderlich' });
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Aktuelles Passwort ist falsch' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'Neues Passwort muss mindestens 6 Zeichen haben' });
  }

  const updates = {};
  if (username && username.trim() !== user.username) {
    if (username.trim().length < 3)
      return res.status(400).json({ error: 'Benutzername muss mindestens 3 Zeichen lang sein' });
    updates.username = username.trim();
  }
  if (email && email.toLowerCase().trim() !== user.email) {
    updates.email = email.toLowerCase().trim();
  }
  if (newPassword) {
    updates.password_hash = await bcrypt.hash(newPassword, 10);
  }

  if (!Object.keys(updates).length) {
    return res.json({ user: { id: user.id, username: user.username, email: user.email, is_admin: !!user.is_admin } });
  }

  try {
    const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.userId);
    const updated = db.prepare('SELECT id, username, email, is_admin FROM users WHERE id = ?').get(req.userId);
    res.json({ user: { ...updated, is_admin: !!updated.is_admin } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      if (err.message.includes('username'))
        return res.status(400).json({ error: 'Benutzername bereits vergeben' });
      return res.status(400).json({ error: 'E-Mail bereits registriert' });
    }
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
