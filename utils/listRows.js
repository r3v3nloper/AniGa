/* Aufbereitung von user_list-Zeilen für die API — geteilt von routes/list.js,
   routes/collections.js und routes/users.js (vorher dreimal dupliziert).
   Mutiert die übergebenen Zeilen bewusst in-place (frische DB-Ergebnisse). */
const db = require('../db');

/* JSON-Spalten aus media_entries mit Rückfallwert für NULL und kaputten Inhalt.
   Factories statt fester Werte, damit sich Zeilen keine Array-Referenz teilen. */
const JSON_COLUMNS = { genres: () => [], seasons_data: () => null };

function parseJsonColumns(row)
{
  for (const [column, fallback] of Object.entries(JSON_COLUMNS))
  {
    // Spalten, die die Query gar nicht selektiert, bleiben unangetastet
    if (!(column in row))
    {
      continue;
    }
    if (!row[column])
    {
      row[column] = fallback();
      continue;
    }
    try
    {
      row[column] = JSON.parse(row[column]);
    }
    catch
    {
      row[column] = fallback();
    }
  }
  return row;
}

/* Hängt jeder Zeile ihre Collection-Zugehörigkeiten an — eine Query für alle Zeilen.
   Nur für die eigene Liste verwenden: fremde Collections gehen niemanden etwas an. */
function attachCollections(rows, userId)
{
  const memberships = db.prepare(`
    SELECT ci.list_entry_id, c.id, c.name, c.emoji
    FROM collection_items ci
    JOIN collections c ON c.id = ci.collection_id
    WHERE c.user_id = ?
  `).all(userId);

  const byEntry = new Map();
  memberships.forEach(m =>
  {
    if (!byEntry.has(m.list_entry_id))
    {
      byEntry.set(m.list_entry_id, []);
    }
    byEntry.get(m.list_entry_id).push({ id: m.id, name: m.name, emoji: m.emoji });
  });

  rows.forEach(row =>
  {
    row.collections = byEntry.get(row.id) || [];
  });
  return rows;
}

/* Normalfall für Antworten mit der eigenen Liste: Collections + geparste JSON-Spalten */
function prepareOwnListRows(rows, userId)
{
  attachCollections(rows, userId);
  rows.forEach(parseJsonColumns);
  return rows;
}

module.exports = { parseJsonColumns, attachCollections, prepareOwnListRows };
