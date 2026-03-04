const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aniga-secret-key');
    const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(decoded.userId);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Kein Admin-Zugriff' });
    }
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Ungültiger Token' });
  }
};
