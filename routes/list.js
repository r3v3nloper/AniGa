const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get user's list
router.get('/', (req, res) => {
  const { type, status } = req.query;
  let query = `
    SELECT ul.id, ul.list_status, ul.current_episode, ul.current_chapter, ul.current_page,
           ul.user_score, ul.notes, ul.started_at, ul.completed_at, ul.updated_at,
           me.title, me.title_english, me.image_url, me.synopsis,
           me.media_status, me.episodes, me.chapters, me.volumes,
           me.api_score, me.genres, me.year, me.season, me.type,
           me.mal_id, me.is_manual, me.source, me.id as media_id
    FROM user_list ul
    JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ?
  `;
  const params = [req.userId];
  if (type) { query += ' AND me.type = ?'; params.push(type); }
  if (status) { query += ' AND ul.list_status = ?'; params.push(status); }
  query += ' ORDER BY ul.updated_at DESC';

  const entries = db.prepare(query).all(...params);
  entries.forEach(e => {
    if (e.genres) { try { e.genres = JSON.parse(e.genres); } catch { e.genres = []; } }
  });
  res.json(entries);
});

// Get stats
router.get('/stats', (req, res) => {
  const stats = {
    anime: { watching: 0, completed: 0, on_hold: 0, dropped: 0, plan_to_watch: 0, total: 0, total_episodes: 0 },
    manga: { reading: 0, completed: 0, on_hold: 0, dropped: 0, plan_to_read: 0, total: 0, total_chapters: 0 }
  };

  const animeRows = db.prepare(`
    SELECT ul.list_status, COUNT(*) as cnt, COALESCE(SUM(ul.current_episode), 0) as ep_sum
    FROM user_list ul JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ? AND me.type = 'anime' GROUP BY ul.list_status
  `).all(req.userId);

  animeRows.forEach(r => {
    if (r.list_status in stats.anime) stats.anime[r.list_status] = r.cnt;
    stats.anime.total += r.cnt;
    stats.anime.total_episodes += r.ep_sum;
  });

  const mangaRows = db.prepare(`
    SELECT ul.list_status, COUNT(*) as cnt, COALESCE(SUM(ul.current_chapter), 0) as ch_sum
    FROM user_list ul JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ? AND me.type = 'manga' GROUP BY ul.list_status
  `).all(req.userId);

  mangaRows.forEach(r => {
    if (r.list_status in stats.manga) stats.manga[r.list_status] = r.cnt;
    stats.manga.total += r.cnt;
    stats.manga.total_chapters += r.ch_sum;
  });

  res.json(stats);
});

// Check if media is in user's list
router.get('/check', (req, res) => {
  const { malId, type } = req.query;
  if (!malId || !type) return res.json(null);
  const entry = db.prepare(`
    SELECT ul.* FROM user_list ul
    JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = ? AND me.mal_id = ? AND me.type = ?
  `).get(req.userId, malId, type);
  res.json(entry || null);
});

// Add or update entry
router.post('/', (req, res) => {
  const { mediaData, listStatus, currentEpisode, currentChapter, currentPage, userScore, notes, startedAt, completedAt } = req.body;
  if (!mediaData || !mediaData.type)
    return res.status(400).json({ error: 'Mediendaten erforderlich' });

  try {
    let mediaId;

    if (mediaData.is_manual) {
      const result = db.prepare(`
        INSERT INTO media_entries (source, type, title, title_english, image_url, synopsis,
          media_status, episodes, chapters, volumes, genres, year, is_manual)
        VALUES ('manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(
        mediaData.type, mediaData.title, mediaData.title_english || null,
        mediaData.image_url || null, mediaData.synopsis || null,
        mediaData.media_status || null, mediaData.episodes || null,
        mediaData.chapters || null, mediaData.volumes || null,
        JSON.stringify(mediaData.genres || []), mediaData.year || null
      );
      mediaId = result.lastInsertRowid;
    } else {
      const existing = db.prepare('SELECT id FROM media_entries WHERE mal_id = ? AND type = ?')
        .get(mediaData.mal_id, mediaData.type);
      if (existing) {
        mediaId = existing.id;
        // Update API data in case it changed
        db.prepare(`
          UPDATE media_entries SET title=?, title_english=?, title_japanese=?, image_url=?,
          synopsis=?, media_status=?, episodes=?, chapters=?, volumes=?, api_score=?,
          genres=?, year=?, season=? WHERE id=?
        `).run(
          mediaData.title, mediaData.title_english || null, mediaData.title_japanese || null,
          mediaData.image_url || null, mediaData.synopsis || null,
          mediaData.media_status || null, mediaData.episodes || null,
          mediaData.chapters || null, mediaData.volumes || null,
          mediaData.api_score || null, JSON.stringify(mediaData.genres || []),
          mediaData.year || null, mediaData.season || null, mediaId
        );
      } else {
        const result = db.prepare(`
          INSERT INTO media_entries (mal_id, source, type, title, title_english, title_japanese,
            image_url, synopsis, media_status, episodes, chapters, volumes, api_score, genres, year, season)
          VALUES (?, 'jikan', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          mediaData.mal_id, mediaData.type, mediaData.title,
          mediaData.title_english || null, mediaData.title_japanese || null,
          mediaData.image_url || null, mediaData.synopsis || null,
          mediaData.media_status || null, mediaData.episodes || null,
          mediaData.chapters || null, mediaData.volumes || null,
          mediaData.api_score || null, JSON.stringify(mediaData.genres || []),
          mediaData.year || null, mediaData.season || null
        );
        mediaId = result.lastInsertRowid;
      }
    }

    db.prepare(`
      INSERT INTO user_list (user_id, media_id, list_status, current_episode, current_chapter,
        current_page, user_score, notes, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, media_id) DO UPDATE SET
        list_status = excluded.list_status,
        current_episode = excluded.current_episode,
        current_chapter = excluded.current_chapter,
        current_page = excluded.current_page,
        user_score = excluded.user_score,
        notes = excluded.notes,
        started_at = excluded.started_at,
        completed_at = excluded.completed_at,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      req.userId, mediaId, listStatus || (mediaData.type === 'anime' ? 'plan_to_watch' : 'plan_to_read'),
      currentEpisode || 0, currentChapter || 0, currentPage || 0,
      userScore || null, notes || null, startedAt || null, completedAt || null
    );

    res.json({ success: true, mediaId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Speichern' });
  }
});

// Update entry by id
router.put('/:id', (req, res) => {
  const { listStatus, currentEpisode, currentChapter, currentPage, userScore, notes, startedAt, completedAt } = req.body;
  try {
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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(listStatus, currentEpisode, currentChapter, currentPage,
      userScore !== undefined ? userScore : null,
      notes, startedAt, completedAt, req.params.id, req.userId);

    if (result.changes === 0)
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Fehler beim Aktualisieren' });
  }
});

// Delete entry
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM user_list WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId);
  if (result.changes === 0)
    return res.status(404).json({ error: 'Eintrag nicht gefunden' });
  res.json({ success: true });
});

module.exports = router;
