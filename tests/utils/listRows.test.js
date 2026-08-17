require('../helpers/setup');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseJsonColumns } = require('../../utils/listRows');

test('parseJsonColumns wandelt die JSON-Spalten in echte Werte um', () =>
{
  // Arrange — so kommen die Spalten aus SQLite zurück
  const row = {
    id: 1,
    genres: '["Action","Abenteuer"]',
    seasons_data: '[{"season":1,"episodes":7}]',
  };

  // Act
  parseJsonColumns(row);

  // Assert
  assert.deepEqual(row.genres, ['Action', 'Abenteuer']);
  assert.deepEqual(row.seasons_data, [{ season: 1, episodes: 7 }]);
});

test('parseJsonColumns normalisiert NULL und kaputte Inhalte auf den Rückfallwert', () =>
{
  // Arrange
  const empty = { id: 1, genres: null, seasons_data: null };
  const broken = { id: 2, genres: '{kaputt', seasons_data: 'auch kaputt' };

  // Act
  parseJsonColumns(empty);
  parseJsonColumns(broken);

  // Assert
  assert.deepEqual(empty.genres, [], 'genres sind immer ein Array');
  assert.equal(empty.seasons_data, null);
  assert.deepEqual(broken.genres, [], 'kaputtes JSON darf die Antwort nicht sprengen');
  assert.equal(broken.seasons_data, null);
});

test('parseJsonColumns liefert je Zeile eigene Arrays (keine geteilte Referenz)', () =>
{
  // Arrange
  const a = { genres: null };
  const b = { genres: null };

  // Act
  parseJsonColumns(a);
  parseJsonColumns(b);
  a.genres.push('Action');

  // Assert
  assert.deepEqual(b.genres, [], 'die zweite Zeile darf nicht mitmutiert werden');
});

test('parseJsonColumns lässt nicht selektierte Spalten unangetastet', () =>
{
  // Arrange — Query ohne seasons_data
  const row = { id: 1, genres: '["Action"]' };

  // Act
  parseJsonColumns(row);

  // Assert
  assert.deepEqual(row.genres, ['Action']);
  assert.equal('seasons_data' in row, false, 'kein Feld erfinden, das die Query nicht liefert');
});
