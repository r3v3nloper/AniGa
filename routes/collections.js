const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { parseIntParam } = require('../utils/sql');

const router = express.Router();
router.use(authMiddleware);

/* Lädt eine Collection nur, wenn sie dem eingeloggten Nutzer gehört */
function getOwnCollection(id, userId)
{
  return db.prepare('SELECT * FROM collections WHERE id = ? AND user_id = ?').get(id, userId);
}

function validateName(raw)
{
  const name = (raw || '').trim();
  if (name.length < 1 || name.length > 50)
  {
    return null;
  }
  return name;
}

/* ── GET /api/collections — alle Collections inkl. Anzahl + Cover-Vorschau ── */
router.get('/', (req, res) =>
{
  const collections = db.prepare(`
    SELECT c.id, c.name, c.emoji, c.created_at,
      (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS itemCount
    FROM collections c
    WHERE c.user_id = ?
    ORDER BY c.name COLLATE NOCASE
  `).all(req.userId);

  const coverStmt = db.prepare(`
    SELECT me.image_url
    FROM collection_items ci
    JOIN user_list ul ON ul.id = ci.list_entry_id
    JOIN media_entries me ON me.id = ul.media_id
    WHERE ci.collection_id = ? AND me.image_url IS NOT NULL
    ORDER BY ci.created_at DESC LIMIT 4
  `);
  collections.forEach(c =>
  {
    c.covers = coverStmt.all(c.id).map(r => r.image_url);
  });

  res.json(collections);
});

/* ── GET /api/collections/:id — Detail mit allen Items (typ-übergreifend) ── */
router.get('/:id', (req, res) =>
{
  const id = parseIntParam(req.params.id);
  if (id === null)
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }
  const collection = getOwnCollection(id, req.userId);
  if (!collection)
  {
    return res.status(404).json({ error: 'Collection nicht gefunden' });
  }

  const items = db.prepare(`
    SELECT ul.id, ul.list_status, ul.current_episode, ul.current_chapter, ul.current_page,
           ul.current_season, ul.user_score, ul.notes, ul.started_at, ul.completed_at,
           ul.owned, ul.owned_volumes, ul.updated_at,
           me.title, me.title_english, me.image_url, me.synopsis, me.media_status,
           me.episodes, me.chapters, me.volumes, me.seasons_data, me.api_score, me.genres,
           me.type, me.mal_id, me.year, me.season, me.is_manual, me.source
    FROM collection_items ci
    JOIN user_list ul ON ul.id = ci.list_entry_id
    JOIN media_entries me ON me.id = ul.media_id
    WHERE ci.collection_id = ?
    ORDER BY ci.created_at DESC
  `).all(id);

  // Zugehörigkeiten aller Items (für korrekte Chip-Anzeige im Track-Modal)
  const memberships = db.prepare(`
    SELECT ci.list_entry_id, c.id, c.name, c.emoji
    FROM collection_items ci
    JOIN collections c ON c.id = ci.collection_id
    WHERE c.user_id = ?
  `).all(req.userId);
  const byEntry = new Map();
  memberships.forEach(m =>
  {
    if (!byEntry.has(m.list_entry_id))
    {
      byEntry.set(m.list_entry_id, []);
    }
    byEntry.get(m.list_entry_id).push({ id: m.id, name: m.name, emoji: m.emoji });
  });

  items.forEach(i =>
  {
    i.collections = byEntry.get(i.id) || [];
    if (i.genres)
    {
      try
      {
        i.genres = JSON.parse(i.genres);
      }
      catch
      {
        i.genres = [];
      }
    }
    if (i.seasons_data)
    {
      try
      {
        i.seasons_data = JSON.parse(i.seasons_data);
      }
      catch
      {
        i.seasons_data = null;
      }
    }
  });

  res.json({ ...collection, items });
});

/* ── POST /api/collections — anlegen ── */
router.post('/', (req, res) =>
{
  const name = validateName(req.body.name);
  if (!name)
  {
    return res.status(400).json({ error: 'Name muss 1–50 Zeichen lang sein' });
  }
  const emoji = (req.body.emoji || '').trim().substring(0, 8) || null;

  try
  {
    const result = db.prepare('INSERT INTO collections (user_id, name, emoji) VALUES (?, ?, ?)')
      .run(req.userId, name, emoji);
    res.json({ id: result.lastInsertRowid, name, emoji, itemCount: 0, covers: [] });
  }
  catch (err)
  {
    if (err.message.includes('UNIQUE'))
    {
      return res.status(400).json({ error: 'Eine Collection mit diesem Namen existiert bereits' });
    }
    res.status(500).json({ error: 'Fehler beim Anlegen' });
  }
});

/* ── PUT /api/collections/:id — umbenennen ── */
router.put('/:id', (req, res) =>
{
  const id = parseIntParam(req.params.id);
  if (id === null || !getOwnCollection(id, req.userId))
  {
    return res.status(404).json({ error: 'Collection nicht gefunden' });
  }
  const name = validateName(req.body.name);
  if (!name)
  {
    return res.status(400).json({ error: 'Name muss 1–50 Zeichen lang sein' });
  }
  const emoji = (req.body.emoji || '').trim().substring(0, 8) || null;

  try
  {
    db.prepare('UPDATE collections SET name = ?, emoji = ? WHERE id = ? AND user_id = ?')
      .run(name, emoji, id, req.userId);
    res.json({ success: true });
  }
  catch (err)
  {
    if (err.message.includes('UNIQUE'))
    {
      return res.status(400).json({ error: 'Eine Collection mit diesem Namen existiert bereits' });
    }
    res.status(500).json({ error: 'Fehler beim Umbenennen' });
  }
});

/* ── DELETE /api/collections/:id — löschen (Items via CASCADE) ── */
router.delete('/:id', (req, res) =>
{
  const id = parseIntParam(req.params.id);
  if (id === null)
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }
  const result = db.prepare('DELETE FROM collections WHERE id = ? AND user_id = ?')
    .run(id, req.userId);
  if (result.changes === 0)
  {
    return res.status(404).json({ error: 'Collection nicht gefunden' });
  }
  res.json({ success: true });
});

/* ── POST /api/collections/:id/items — Eintrag hinzufügen ── */
router.post('/:id/items', (req, res) =>
{
  const id = parseIntParam(req.params.id);
  const listEntryId = parseIntParam(req.body.listEntryId);
  if (id === null || listEntryId === null)
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }
  if (!getOwnCollection(id, req.userId))
  {
    return res.status(404).json({ error: 'Collection nicht gefunden' });
  }

  // Nur eigene Listen-Einträge dürfen in eigene Collections
  const entry = db.prepare('SELECT id FROM user_list WHERE id = ? AND user_id = ?')
    .get(listEntryId, req.userId);
  if (!entry)
  {
    return res.status(404).json({ error: 'Listen-Eintrag nicht gefunden' });
  }

  db.prepare(`
    INSERT INTO collection_items (collection_id, list_entry_id) VALUES (?, ?)
    ON CONFLICT(collection_id, list_entry_id) DO NOTHING
  `).run(id, listEntryId);
  res.json({ success: true });
});

/* ── DELETE /api/collections/:id/items/:entryId — Eintrag entfernen ── */
router.delete('/:id/items/:entryId', (req, res) =>
{
  const id = parseIntParam(req.params.id);
  const entryId = parseIntParam(req.params.entryId);
  if (id === null || entryId === null)
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }
  if (!getOwnCollection(id, req.userId))
  {
    return res.status(404).json({ error: 'Collection nicht gefunden' });
  }

  db.prepare('DELETE FROM collection_items WHERE collection_id = ? AND list_entry_id = ?')
    .run(id, entryId);
  res.json({ success: true });
});

module.exports = router;
