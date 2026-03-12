const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET)
{
  throw new Error('JWT_SECRET Umgebungsvariable muss gesetzt sein');
}

function authMiddleware(req, res, next)
{
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
  {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2)
  {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  try
  {
    const decoded = jwt.verify(parts[1], JWT_SECRET);
    req.userId = decoded.userId;
    next();
  }
  catch
  {
    return res.status(401).json({ error: 'Ungültiger Token' });
  }
}

authMiddleware.JWT_SECRET = JWT_SECRET;
module.exports = authMiddleware;
