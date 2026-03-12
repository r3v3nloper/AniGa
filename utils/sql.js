/* Shared SQL fragments used across multiple route files */

const ANIME_COUNT_COL = `(SELECT COUNT(*) FROM user_list ul
  JOIN media_entries me ON ul.media_id = me.id
  WHERE ul.user_id = u.id AND me.type = 'anime') AS animeCount`;

const MANGA_COUNT_COL = `(SELECT COUNT(*) FROM user_list ul
  JOIN media_entries me ON ul.media_id = me.id
  WHERE ul.user_id = u.id AND me.type = 'manga') AS mangaCount`;

function parseIntParam(raw)
{
  const n = parseInt(raw);
  return Number.isInteger(n) ? n : null;
}

module.exports = { ANIME_COUNT_COL, MANGA_COUNT_COL, parseIntParam };
