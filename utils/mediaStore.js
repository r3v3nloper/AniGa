/* Persistence for media_entries — keeps upsert logic out of the route layer.
   All functions use prepared statements and compose with the caller's transaction. */
const db = require('../db');

function insertManual(mediaData)
{
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
  return result.lastInsertRowid;
}

function seasonsJson(mediaData)
{
  return Array.isArray(mediaData.seasons_data) && mediaData.seasons_data.length
    ? JSON.stringify(mediaData.seasons_data)
    : null;
}

function updateApiData(id, mediaData)
{
  // seasons_data und avg_play_minutes nur überschreiben, wenn der Aufruf sie mitbringt:
  // Suchergebnisse liefern sie nicht, würden sonst also bereits geholte Details löschen
  db.prepare(`
    UPDATE media_entries SET title=?, title_english=?, title_japanese=?, image_url=?,
    synopsis=?, media_status=?, episodes=?, chapters=?, volumes=?, api_score=?,
    genres=?, year=?, season=?, seasons_data=COALESCE(?, seasons_data),
    avg_play_minutes=COALESCE(?, avg_play_minutes) WHERE id=?
  `).run(
    mediaData.title, mediaData.title_english || null, mediaData.title_japanese || null,
    mediaData.image_url || null, mediaData.synopsis || null,
    mediaData.media_status || null, mediaData.episodes || null,
    mediaData.chapters || null, mediaData.volumes || null,
    mediaData.api_score || null, JSON.stringify(mediaData.genres || []),
    mediaData.year || null, mediaData.season || null, seasonsJson(mediaData),
    mediaData.avg_play_minutes || null, id
  );
}

function insertFromApi(mediaData)
{
  const result = db.prepare(`
    INSERT INTO media_entries (mal_id, source, type, title, title_english, title_japanese,
      image_url, synopsis, media_status, episodes, chapters, volumes, api_score, genres,
      year, season, seasons_data, avg_play_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    mediaData.mal_id, mediaData.source || 'jikan', mediaData.type, mediaData.title,
    mediaData.title_english || null, mediaData.title_japanese || null,
    mediaData.image_url || null, mediaData.synopsis || null,
    mediaData.media_status || null, mediaData.episodes || null,
    mediaData.chapters || null, mediaData.volumes || null,
    mediaData.api_score || null, JSON.stringify(mediaData.genres || []),
    mediaData.year || null, mediaData.season || null, seasonsJson(mediaData),
    mediaData.avg_play_minutes || null
  );
  return result.lastInsertRowid;
}

/* Inserts a manual entry, or upserts an API-sourced entry keyed by (mal_id, type).
   Existing API entries get their metadata refreshed. Returns the media_entries id. */
function upsertMedia(mediaData)
{
  if (mediaData.is_manual)
  {
    return insertManual(mediaData);
  }

  const existing = db.prepare('SELECT id FROM media_entries WHERE mal_id = ? AND type = ?')
    .get(mediaData.mal_id, mediaData.type);
  if (existing)
  {
    updateApiData(existing.id, mediaData);
    return existing.id;
  }
  return insertFromApi(mediaData);
}

module.exports = { upsertMedia };
