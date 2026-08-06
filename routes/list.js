const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { upsertMedia } = require('../utils/mediaStore');

const router = express.Router();
router.use(authMiddleware);

// Get user's list
router.get('/', (req, res) =>
{
  const { type, status } = req.query;
  let query = `
    SELECT ul.id, ul.list_status, ul.current_episode, ul.current_chapter, ul.current_page,
           ul.user_score, ul.notes, ul.started_at, ul.completed_at, ul.updated_at,
           ul.owned, ul.owned_volumes,
           me.title, me.title_english, me.image_url, me.synopsis,
           me.media_status, me.episodes, me.chapters, me.volumes,
           me.api_score, me.genres, me.year, me.season, me.type,
           me.mal_id, me.is_manual, me.source, me.id as media_id
    FROM user_list ul
    JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ?
  `;
  const params = [req.userId];
  if (type)
  {
    query += ' AND me.type = ?';
    params.push(type);
  }
  if (status)
  {
    query += ' AND ul.list_status = ?';
    params.push(status);
  }
  query += ' ORDER BY ul.updated_at DESC';

  const entries = db.prepare(query).all(...params);

  // Collection-Zugehörigkeiten in einem Rutsch anhängen (für Chips & Filter im Frontend)
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

  entries.forEach(e =>
  {
    e.collections = byEntry.get(e.id) || [];
    if (e.genres)
    {
      try
      {
        e.genres = JSON.parse(e.genres);
      }
      catch
      {
        e.genres = [];
      }
    }
  });
  res.json(entries);
});

// Get stats — pro Medientyp gruppiert (statische Konfiguration, keine User-Eingaben im SQL)
const STATS_CONFIG = {
  anime: { statuses: ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'],
    sumCol: 'current_episode', sumKey: 'total_episodes' },
  manga: { statuses: ['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read'],
    sumCol: 'current_chapter', sumKey: 'total_chapters' },
  movie: { statuses: ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'],
    sumCol: null, sumKey: null },
  tv: { statuses: ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'],
    sumCol: 'current_episode', sumKey: 'total_episodes' },
};

router.get('/stats', (req, res) =>
{
  const stats = {};
  for (const [type, cfg] of Object.entries(STATS_CONFIG))
  {
    const s = { total: 0 };
    cfg.statuses.forEach(st =>
    {
      s[st] = 0;
    });
    if (cfg.sumKey)
    {
      s[cfg.sumKey] = 0;
    }

    const rows = db.prepare(`
      SELECT ul.list_status, COUNT(*) as cnt,
             COALESCE(SUM(ul.${cfg.sumCol || 'current_episode'}), 0) as sum_val
      FROM user_list ul JOIN media_entries me ON ul.media_id = me.id
      WHERE ul.user_id = ? AND me.type = ? GROUP BY ul.list_status
    `).all(req.userId, type);

    rows.forEach(r =>
    {
      if (r.list_status in s)
      {
        s[r.list_status] = r.cnt;
      }
      s.total += r.cnt;
      if (cfg.sumKey)
      {
        s[cfg.sumKey] += r.sum_val;
      }
    });
    stats[type] = s;
  }
  res.json(stats);
});

// Check if media is in user's list
router.get('/check', (req, res) =>
{
  const malId = parseInt(req.query.malId);
  const type = req.query.type;
  if (!Number.isInteger(malId) || !['anime', 'manga', 'movie', 'tv'].includes(type))
  {
    return res.json(null);
  }
  const entry = db.prepare(`
    SELECT ul.* FROM user_list ul
    JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ? AND me.mal_id = ? AND me.type = ?
  `).get(req.userId, malId, type);
  if (entry)
  {
    entry.collections = db.prepare(`
      SELECT c.id, c.name, c.emoji
      FROM collection_items ci
      JOIN collections c ON c.id = ci.collection_id
      WHERE ci.list_entry_id = ?
    `).all(entry.id);
  }
  res.json(entry || null);
});

// Add or update entry
router.post('/', (req, res) =>
{
  const {
    mediaData, listStatus, currentEpisode, currentChapter,
    currentPage, userScore, notes, startedAt, completedAt,
    owned, ownedVolumes
  } = req.body;
  if (!mediaData || !['anime', 'manga', 'movie', 'tv'].includes(mediaData.type))
  {
    return res.status(400).json({ error: 'Mediendaten erforderlich' });
  }

  try
  {
    const { mediaId, entryId } = db.transaction(() =>
    {
      const mid = upsertMedia(mediaData);

      db.prepare(`
        INSERT INTO user_list (user_id, media_id, list_status, current_episode, current_chapter,
          current_page, user_score, notes, started_at, completed_at, owned, owned_volumes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, media_id) DO UPDATE SET
          list_status = excluded.list_status,
          current_episode = excluded.current_episode,
          current_chapter = excluded.current_chapter,
          current_page = excluded.current_page,
          user_score = excluded.user_score,
          notes = excluded.notes,
          started_at = excluded.started_at,
          completed_at = excluded.completed_at,
          owned = excluded.owned,
          owned_volumes = excluded.owned_volumes,
          updated_at = CURRENT_TIMESTAMP
      `).run(
        req.userId, mid, listStatus || (mediaData.type === 'manga' ? 'plan_to_read' : 'plan_to_watch'),
        currentEpisode || 0, currentChapter || 0, currentPage || 0,
        userScore || null, notes || null, startedAt || null, completedAt || null,
        owned ? 1 : 0, ownedVolumes || 0
      );

      const ul = db.prepare('SELECT id FROM user_list WHERE user_id = ? AND media_id = ?')
        .get(req.userId, mid);
      return { mediaId: mid, entryId: ul.id };
    })();

    res.json({ success: true, mediaId, entryId });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Speichern' });
  }
});

// Update entry by id
router.put('/:id', (req, res) =>
{
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id))
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }

  const {
    listStatus, currentEpisode, currentChapter,
    currentPage, userScore, notes, startedAt, completedAt,
    owned, ownedVolumes
  } = req.body;
  try
  {
    const result = db.prepare(`
      UPDATE user_list SET
        list_status = COALESCE(?, list_status),
        current_episode = COALESCE(?, current_episode),
        current_chapter = COALESCE(?, current_chapter),
        current_page = COALESCE(?, current_page),
        user_score = ?,
        notes = COALESCE(?, notes),
        started_at = COALESCE(?, started_at),
        completed_at = COALESCE(?, completed_at),
        owned = COALESCE(?, owned),
        owned_volumes = COALESCE(?, owned_volumes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(listStatus, currentEpisode, currentChapter, currentPage,
      userScore !== undefined ? userScore : null,
      notes, startedAt, completedAt,
      owned !== undefined ? (owned ? 1 : 0) : null,
      ownedVolumes !== undefined ? ownedVolumes : null,
      id, req.userId);

    if (result.changes === 0)
    {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }
    res.json({ success: true });
  }
  catch
  {
    res.status(500).json({ error: 'Fehler beim Aktualisieren' });
  }
});

// Delete entry
router.delete('/:id', (req, res) =>
{
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id))
  {
    return res.status(400).json({ error: 'Ungültige ID' });
  }

  const result = db.prepare('DELETE FROM user_list WHERE id = ? AND user_id = ?')
    .run(id, req.userId);
  if (result.changes === 0)
  {
    return res.status(404).json({ error: 'Eintrag nicht gefunden' });
  }
  res.json({ success: true });
});

module.exports = router;
