/* Shared SQL fragments used across multiple route files */
const { MEDIA_TYPES } = require('./mediaTypes');

/* Eine Zählspalte je Medientyp für Nutzer-Übersichten (`animeCount`, `gameCount`, …).
   Die Typnamen stammen aus der internen Whitelist, nie aus Nutzereingaben.
   Erwartet, dass die umgebende Query die users-Tabelle als `u` aliast. */
const TYPE_COUNT_COLUMNS = MEDIA_TYPES
  .map(type => `(SELECT COUNT(*) FROM user_list ul
    JOIN media_entries me ON ul.media_id = me.id
    WHERE ul.user_id = u.id AND me.type = '${type}') AS ${type}Count`)
  .join(',\n  ');

function parseIntParam(raw)
{
  const n = parseInt(raw);
  return Number.isInteger(n) ? n : null;
}

module.exports = { TYPE_COUNT_COLUMNS, parseIntParam };
