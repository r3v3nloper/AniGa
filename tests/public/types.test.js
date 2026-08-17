/* Testet die Typ-Abstraktion des Frontends direkt (public/js/types.js ist ein
   importfreies ES-Leaf-Modul und damit ohne DOM in Node ladbar). */
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let T;

before(async () =>
{
  // Windows braucht eine file://-URL für dynamische ESM-Imports
  T = await import(pathToFileURL(path.join(__dirname, '../../public/js/types.js')).href);
});

test('Spiele bilden einen eigenen Bereich mit dem Typ game', () =>
{
  // Assert
  assert.deepEqual(T.AREAS.games.types, ['game']);
  assert.equal(T.areaOf('game'), 'games');
  assert.equal(T.areaOf('anime'), 'otaku', 'bestehende Typen bleiben in ihrem Bereich');
  assert.equal(T.areaOf('tv'), 'screen');
});

test('statusLabel liefert eigene deutsche Bezeichnungen für Spiele', () =>
{
  // Assert
  assert.equal(T.statusLabel('watching', 'game'), 'Am Spielen');
  assert.equal(T.statusLabel('plan_to_watch', 'game'), 'Will spielen');
  assert.equal(T.statusLabel('completed', 'game'), 'Durchgespielt');
  assert.equal(T.statusLabel('on_hold', 'game'), 'Pausiert', 'Fallback auf die Basis-Tabelle');
  assert.equal(T.statusLabel('dropped', 'game'), 'Abgebrochen');
});

test('statusLabel lässt die Beschriftungen der bestehenden Typen unverändert', () =>
{
  // Assert
  assert.equal(T.statusLabel('watching', 'anime'), 'Schaut gerade');
  assert.equal(T.statusLabel('watching', 'tv'), 'Schaut gerade');
  assert.equal(T.statusLabel('reading', 'manga'), 'Liest gerade');
  assert.equal(T.statusLabel('plan_to_watch', 'movie'), 'Geplant');
  assert.equal(T.statusLabel('plan_to_read', 'manga'), 'Geplant');
  assert.equal(T.statusLabel('completed', 'anime'), 'Abgeschlossen');
});

test('statusesFor liefert dieselben Status-Werte, nur anders beschriftet', () =>
{
  // Act
  const game = T.statusesFor('game');
  const anime = T.statusesFor('anime');
  const manga = T.statusesFor('manga');

  // Assert
  assert.deepEqual(game.map(s => s.val), anime.map(s => s.val),
    'Spiele nutzen dieselben Status-Werte wie Anime (watching/plan_to_watch/…)');
  assert.deepEqual(game.map(s => s.label),
    ['Am Spielen', 'Will spielen', 'Durchgespielt', 'Pausiert', 'Abgebrochen']);
  assert.deepEqual(anime.map(s => s.label),
    ['Schaut gerade', 'Geplant', 'Abgeschlossen', 'Pausiert', 'Abgebrochen']);
  assert.deepEqual(manga.map(s => s.val),
    ['reading', 'plan_to_read', 'completed', 'on_hold', 'dropped']);
});

test('Spiele werden wie Filme ohne Fortschrittszähler getrackt', () =>
{
  // Assert
  assert.equal(T.TYPE_META.game.progress, null);
  assert.equal(T.TYPE_META.movie.progress, null);
  assert.equal(T.TYPE_META.anime.progress, 'episodes');
  assert.equal(T.TYPE_META.tv.progress, 'episodes');
  assert.equal(T.TYPE_META.manga.progress, 'chapters');
  assert.equal(T.TYPE_META.game.manualCounts, null, 'kein Zählfeld im Manuell-Modal');
  assert.ok(T.TYPE_META.game.needsDetail, 'IGDB-Suchergebnisse brauchen den Detail-Abruf');
});

test('Nur Spiele erfassen eine Spielzeit', () =>
{
  // Assert
  assert.ok(T.TYPE_META.game.playtime, 'Spiele haben ein Spielzeit-Feld');
  ['anime', 'manga', 'movie', 'tv'].forEach(t =>
    assert.ok(!T.TYPE_META[t].playtime, `${t} bekommt kein Spielzeit-Feld`));
});

test('Default-Stati passen zum Typ', () =>
{
  // Assert
  assert.equal(T.defaultStatusFor('game'), 'watching');
  assert.equal(T.defaultStatusFor('manga'), 'reading');
  assert.equal(T.planStatusFor('game'), 'plan_to_watch');
  assert.equal(T.planStatusFor('manga'), 'plan_to_read');
});

test('Medienstatus-Badge zeigt bei Spielen „Erschienen"', () =>
{
  // Assert
  assert.deepEqual(T.mediaStatusMeta('Finished', 'game'), ['Erschienen', 'badge-finished']);
  assert.deepEqual(T.mediaStatusMeta('Finished', 'movie'), ['Abgeschlossen', 'badge-finished']);
  assert.deepEqual(T.mediaStatusMeta('Not yet aired', 'game'), ['Angekündigt', 'badge-upcoming']);
  assert.equal(T.mediaStatusMeta('Unbekannt', 'game'), null);
});

test('sourceLabel unterscheidet die Anbieter', () =>
{
  assert.equal(T.sourceLabel('igdb'), 'IGDB');
  assert.equal(T.sourceLabel('tmdb'), 'TMDB');
  assert.equal(T.sourceLabel('jikan'), 'MAL');
});
