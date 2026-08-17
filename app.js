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
const collectionsRoutes = require('./routes/collections');

const app = express();
const PORT = process.env.PORT || 3000;

/* Hinter einem Reverse-Proxy (oder Dockers Userland-Proxy) ist die Socket-IP für alle
   Clients dieselbe — das Rate-Limiting auf den Auth-Routen würde damit zu einem
   GLOBALEN Zähler und ein einzelner Angreifer könnte alle Nutzer aussperren.
   Bewusst als Hop-Anzahl konfigurierbar: ein pauschales `true` würde erlauben, sich
   über einen gefälschten X-Forwarded-For-Header eine beliebige IP zu geben. */
const TRUST_PROXY = process.env.TRUST_PROXY;
if (TRUST_PROXY)
{
  const hops = Number(TRUST_PROXY);
  app.set('trust proxy', Number.isInteger(hops) ? hops : TRUST_PROXY);
}

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
app.use('/api/collections', collectionsRoutes);

/* Unbekannte API-Pfade dürfen NICHT im SPA-Fallback landen — der Client würde
   sonst HTML mit Status 200 bekommen und beim res.json() an „Unexpected token '<'"
   scheitern statt eine verständliche Fehlermeldung zu zeigen. */
app.use('/api', (req, res) =>
{
  res.status(404).json({ error: 'Endpunkt nicht gefunden' });
});

// SPA fallback
app.get('*', (req, res) =>
{
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* Zentraler Fehler-Handler: hält die JSON-Fehlerform durch (statt Express'
   HTML-Standardseite) und protokolliert unerwartete Fehler serverseitig. */
// eslint-disable-next-line no-unused-vars — Express erkennt Error-Handler an der Signatur
app.use((err, req, res, next) =>
{
  if (err.type === 'entity.parse.failed')
  {
    return res.status(400).json({ error: 'Ungültiger JSON-Body' });
  }
  if (err.type === 'entity.too.large')
  {
    return res.status(413).json({ error: 'Anfrage zu groß' });
  }
  console.error(err);
  if (res.headersSent)
  {
    return next(err);
  }
  res.status(500).json({ error: 'Serverfehler' });
});

module.exports = app;
