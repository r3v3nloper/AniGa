require('../helpers/setup');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../../db');
const { upsertMedia } = require('../../utils/mediaStore');

test('upsertMedia legt einen API-Eintrag an und liefert die id', () =>
{
  // Arrange
  const mediaData = {
    mal_id: 100, type: 'anime', title: 'Test Anime',
    episodes: 12, api_score: 7.5, genres: ['Action'], year: 2024,
  };

  // Act
  const id = upsertMedia(mediaData);

  // Assert
  const row = db.prepare('SELECT * FROM media_entries WHERE id = ?').get(id);
  assert.equal(row.mal_id, 100);
  assert.equal(row.title, 'Test Anime');
  assert.equal(row.source, 'jikan');
  assert.equal(row.is_manual, 0);
  assert.deepEqual(JSON.parse(row.genres), ['Action']);
});

test('upsertMedia aktualisiert einen bestehenden Eintrag statt zu duplizieren', () =>
{
  // Arrange
  const first = upsertMedia({ mal_id: 200, type: 'manga', title: 'Alter Titel', chapters: 10 });

  // Act
  const second = upsertMedia({ mal_id: 200, type: 'manga', title: 'Neuer Titel', chapters: 12, volumes: 3 });

  // Assert
  assert.equal(second, first, 'gleiche mal_id+type muss dieselbe id liefern');
  const row = db.prepare('SELECT * FROM media_entries WHERE id = ?').get(first);
  assert.equal(row.title, 'Neuer Titel');
  assert.equal(row.chapters, 12);
  assert.equal(row.volumes, 3);
  const count = db.prepare('SELECT COUNT(*) AS c FROM media_entries WHERE mal_id = 200').get().c;
  assert.equal(count, 1);
});

test('upsertMedia unterscheidet gleiche mal_id bei verschiedenen Typen', () =>
{
  // Arrange / Act
  const animeId = upsertMedia({ mal_id: 300, type: 'anime', title: 'Same ID Anime' });
  const mangaId = upsertMedia({ mal_id: 300, type: 'manga', title: 'Same ID Manga' });

  // Assert
  assert.notEqual(animeId, mangaId);
});

test('upsertMedia legt manuelle Einträge immer neu an (kein mal_id-Upsert)', () =>
{
  // Arrange / Act
  const a = upsertMedia({ is_manual: true, type: 'anime', title: 'Manuell A' });
  const b = upsertMedia({ is_manual: true, type: 'anime', title: 'Manuell A' });

  // Assert
  assert.notEqual(a, b, 'manuelle Einträge sind unabhängige Zeilen');
  const row = db.prepare('SELECT * FROM media_entries WHERE id = ?').get(a);
  assert.equal(row.is_manual, 1);
  assert.equal(row.source, 'manual');
});
