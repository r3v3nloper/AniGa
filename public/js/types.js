/* =====================================================
   AniGa – types.js
   Zentrale Typ-Abstraktion: Bereiche, Medientypen, Status-Tabellen.
   Bewusst ohne Imports (Leaf-Modul), damit state.js und media.js
   ihre Defaults daraus ableiten können, ohne Zyklen zu erzeugen.
   NEUE MEDIENTYPEN NUR HIER EINTRAGEN — keine Typ-Ternaries streuen!
   ===================================================== */

/* ---- BEREICHE (Switcher in Sidebar + Mehr-Sheet, S.area) ---- */
export const AREAS = {
  otaku:  { label: '🌸 Anime & Manga',  discover: 'Anime & Manga entdecken',  types: ['anime', 'manga'] },
  screen: { label: '🎬 Filme & Serien', discover: 'Filme & Serien entdecken', types: ['movie', 'tv'] },
  games:  { label: '🎮 Spiele',         discover: 'Spiele entdecken',         types: ['game'] },
};

/* ---- TYP-METADATEN ----
   progress:     'episodes' | 'chapters' | null (kein Fortschrittszähler)
   needsDetail:  Suchergebnisse des Anbieters sind unvollständig → vor dem Modal nachladen
   playtime:     eigene Spielzeit erfassen + Durchschnitt des Anbieters anzeigen
   top:          Überschrift der Top-Sektion in der Suche
   highlight:    optionale Sektion darüber (Seasonal / Trending), gefüllt über S.highlight
   manualCounts: Zählfelder im Modal für manuelle Einträge (null = keine)               */
export const TYPE_META = {
  anime: {
    view: 'anime', label: 'Anime-Liste', short: 'Anime',
    singular: 'Anime', plural: 'Anime', emoji: '🎬', icon: 'tv',
    progress: 'episodes',
    top: { title: 'Top Anime', icon: 'flame' },
    highlight: { title: 'Aktuell laufende Anime', icon: 'calendar' },
    manualCounts: { field: 'episodes', countLabel: 'Episoden', volLabel: 'Staffeln' },
  },
  manga: {
    view: 'manga', label: 'Manga-Liste', short: 'Manga',
    singular: 'Manga', plural: 'Manga', emoji: '📚', icon: 'book',
    progress: 'chapters',
    top: { title: 'Top Manga', icon: 'flame' },
    manualCounts: { field: 'chapters', countLabel: 'Kapitel', volLabel: 'Bände' },
  },
  movie: {
    view: 'movie', label: 'Film-Liste', short: 'Filme',
    singular: 'Film', plural: 'Filme', emoji: '🎥', icon: 'film',
    progress: null, needsDetail: true,
    top: { title: 'Beliebte Filme', icon: 'star' },
    highlight: { title: 'Trending diese Woche', icon: 'flame' },
    manualCounts: null,
  },
  tv: {
    view: 'tv', label: 'Serien-Liste', short: 'Serien',
    singular: 'Serie', plural: 'Serien', emoji: '📺', icon: 'monitor',
    progress: 'episodes', needsDetail: true,
    top: { title: 'Beliebte Serien', icon: 'star' },
    manualCounts: { field: 'episodes', countLabel: 'Episoden', volLabel: 'Staffeln' },
  },
  game: {
    view: 'game', label: 'Spiele-Liste', short: 'Spiele',
    singular: 'Spiel', plural: 'Spiele', emoji: '🎮', icon: 'gamepad',
    // Spiele werden wie Filme ohne Zähler getrackt; Details liefern erst die Beschreibung
    progress: null, needsDetail: true, playtime: true,
    top: { title: 'Beliebte Spiele', icon: 'star' },
    highlight: { title: 'Neu & angesagt', icon: 'flame' },
    manualCounts: null,
  },
};

export const MEDIA_TYPES = Object.keys(TYPE_META);

export function areaOf(type)
{
  return Object.keys(AREAS).find(a => AREAS[a].types.includes(type)) || 'otaku';
}

/* ---- LISTEN-STATI ----
   Die Status-Werte selbst bleiben typ-übergreifend (watching/plan_to_watch/…),
   nur die Beschriftung bekommt eine Typ-Dimension. */
const STATUS_LABELS_BASE = {
  watching: 'Schaut gerade', reading: 'Liest gerade',
  completed: 'Abgeschlossen', on_hold: 'Pausiert', dropped: 'Abgebrochen',
  plan_to_watch: 'Geplant', plan_to_read: 'Geplant',
};

const STATUS_LABELS_BY_TYPE = {
  game: {
    watching: 'Am Spielen', plan_to_watch: 'Will spielen', completed: 'Durchgespielt',
  },
};

export const STATUS_CSS = {
  watching: 's-watching', reading: 's-reading',
  completed: 's-completed', on_hold: 's-on_hold', dropped: 's-dropped',
  plan_to_watch: 's-plan_to_watch', plan_to_read: 's-plan_to_read',
};

const STATUS_ORDER_BASE = ['watching', 'plan_to_watch', 'completed', 'on_hold', 'dropped'];
const STATUS_ORDER_BY_TYPE = {
  manga: ['reading', 'plan_to_read', 'completed', 'on_hold', 'dropped'],
};

export function statusLabel(status, type)
{
  return STATUS_LABELS_BY_TYPE[type]?.[status] || STATUS_LABELS_BASE[status] || '';
}

/* Auswahlliste für Status-Dropdowns und Status-Tabs (Reihenfolge ist bewusst) */
export function statusesFor(type)
{
  return (STATUS_ORDER_BY_TYPE[type] || STATUS_ORDER_BASE)
    .map(val => ({ val, label: statusLabel(val, type) }));
}

/* „Aktiv"-Status (Vorauswahl im Track-Modal) und „Geplant"-Status (manuelle Einträge) */
const ACTIVE_STATUS_BY_TYPE = { manga: 'reading' };
const PLAN_STATUS_BY_TYPE = { manga: 'plan_to_read' };

export function defaultStatusFor(type)
{
  return ACTIVE_STATUS_BY_TYPE[type] || 'watching';
}

export function planStatusFor(type)
{
  return PLAN_STATUS_BY_TYPE[type] || 'plan_to_watch';
}

/* ---- MEDIEN-STATUS (Badge auf den Karten) ----
   Basis sind die MAL-Status-Strings; andere Anbieter mappen darauf. */
const MEDIA_STATUS_BASE = {
  'Currently Airing': ['Läuft', 'badge-airing'],
  'Finished Airing': ['Abgeschlossen', 'badge-finished'],
  'Not yet aired': ['Angekündigt', 'badge-upcoming'],
  'Publishing': ['Erscheint noch', 'badge-publishing'],
  'Finished': ['Abgeschlossen', 'badge-finished'],
  'On Hiatus': ['Hiatus', 'badge-upcoming'],
  'Discontinued': ['Eingestellt', 'badge-finished'],
  'Not yet published': ['Angekündigt', 'badge-upcoming'],
};

const MEDIA_STATUS_BY_TYPE = {
  game: { 'Finished': ['Erschienen', 'badge-finished'] },
};

export function mediaStatusMeta(status, type)
{
  return MEDIA_STATUS_BY_TYPE[type]?.[status] || MEDIA_STATUS_BASE[status] || null;
}

/* Anbieter-Kürzel für die Score-Anzeige im Track-Modal */
export const SOURCE_LABELS = { tmdb: 'TMDB', igdb: 'IGDB' };

export function sourceLabel(source)
{
  return SOURCE_LABELS[source] || 'MAL';
}
