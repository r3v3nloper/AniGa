/* Express-App (ohne listen) — separat vom Server-Start, damit Tests
   die echte App auf einem ephemeren Port hochfahren können */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const listRoutes = require('./routes/list');
const searchRoutes = require('./routes/search');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const recommendRoutes = require('./routes/recommendations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      // 'unsafe-inline' ist nötig, weil das SPA-Markup Inline-style-Attribute nutzt
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      // https: statt fester Hosts, weil manuelle Einträge beliebige Cover-URLs erlauben
      imgSrc: ["'self'", 'data:', 'https:'],
      // Font-Hosts nötig, weil der Service Worker sie beim Install in den Cache lädt
      connectSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      // Entfernt: würde Deployments über plain HTTP im LAN (Synology/NAS) brechen
      upgradeInsecureRequests: null,
    },
  },
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || `http://localhost:${PORT}` }));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/list', listRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recommendations', recommendRoutes);

// SPA fallback
app.get('*', (req, res) =>
{
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
