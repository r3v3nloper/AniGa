/* IGDB-Client (igdb.com, gehört zu Twitch) für Spiele.
   Auth ist zweistufig und damit anders als bei den übrigen Clients:
   IGDB_CLIENT_ID + IGDB_CLIENT_SECRET (Twitch-Developer-App) → OAuth-Token
   (Client-Credentials, ~60 Tage gültig), das hier gecacht und erneuert wird.
   Abgefragt wird per POST mit Apicalypse-Body, nicht über Query-Parameter. */
const { createRateLimitedFetch } = require('./rateLimitedFetch');

const IGDB = 'https://api.igdb.com/v4';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const IMAGE_BASE = 'https://images.igdb.com/igdb/image/upload/t_cover_big';
/* IGDB erlaubt 4 Anfragen pro Sekunde */
const MIN_INTERVAL = 250;
const TIMEOUT_MS = 8000;
const PAGE_SIZE = 20;
/* Zeitfenster für „Neu & angesagt" (Trending) */
const TRENDING_DAYS = 90;
/* Empfehlungen sortieren nach Wertung — ohne Mindestzahl an Stimmen landen dort
   Titel mit 30 Bewertungen vor Klassikern. Ab ~300 sind die Ergebnisse stabil. */
const MIN_RATINGS_FOR_RECOMMENDATIONS = 300;
/* Token vorzeitig erneuern, damit kein Request in den Ablauf läuft */
const TOKEN_SAFETY_MARGIN_MS = 5 * 60 * 1000;

const CLIENT_ID = process.env.IGDB_CLIENT_ID || '';
const CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET || '';

function isConfigured()
{
  return CLIENT_ID.length > 0 && CLIENT_SECRET.length > 0;
}

const limitedFetch = createRateLimitedFetch({ name: 'IGDB', minInterval: MIN_INTERVAL });

/* ---- OAUTH-TOKEN ---- */
let tokenCache = null;
let tokenRequest = null;

async function requestToken()
{
  const url = new URL(TWITCH_TOKEN_URL);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('client_secret', CLIENT_SECRET);
  url.searchParams.set('grant_type', 'client_credentials');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try
  {
    const res = await fetch(url, { method: 'POST', signal: controller.signal });
    if (!res.ok)
    {
      // Body bewusst nicht mitloggen — er kann die Zugangsdaten spiegeln
      throw new Error(`IGDB-Auth fehlgeschlagen (${res.status})`);
    }
    const data = await res.json();
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000) - TOKEN_SAFETY_MARGIN_MS,
    };
    return tokenCache.token;
  }
  finally
  {
    clearTimeout(timer);
  }
}

/* Parallele Aufrufe teilen sich einen laufenden Token-Abruf */
async function getToken()
{
  if (tokenCache && Date.now() < tokenCache.expiresAt)
  {
    return tokenCache.token;
  }
  if (!tokenRequest)
  {
    tokenRequest = requestToken().finally(() =>
    {
      tokenRequest = null;
    });
  }
  return tokenRequest;
}

/* Nur für Tests: gecachtes Token verwerfen */
function resetToken()
{
  tokenCache = null;
  tokenRequest = null;
}

async function iFetch(endpoint, body, allowRetry = true)
{
  const token = await getToken();
  try
  {
    return await limitedFetch(`${IGDB}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body,
    });
  }
  catch (err)
  {
    // Zurückgezogenes Token: einmalig mit frischem Token wiederholen
    if (allowRetry && /IGDB 401/.test(err.message))
    {
      resetToken();
      return iFetch(endpoint, body, false);
    }
    throw err;
  }
}

/* ---- ABFRAGEN ---- */
const FIELDS = 'id,name,summary,cover.image_id,first_release_date,genres.slug,'
  + 'aggregated_rating,total_rating,rating,status';

/* Nur eigenständig spielbare Titel: 0 Hauptspiel, 4 eigenständige Erweiterung,
   8 Remake, 9 Remaster, 10 erweitertes Spiel. Draußen bleiben damit u.a. Mods (5),
   Bundles (3), DLC (1), Episoden (6), Ports (11) und Packs (13) — ohne diesen Filter
   stehen Mods und Bundles in der Suche vor dem eigentlichen Spiel.
   Achtung: Das früher übliche Feld `category` liefert inzwischen durchgehend NULL,
   maßgeblich ist `game_type` (gleiche Nummerierung, Endpunkt `game_types`).
   `version_parent = null` wirft zusätzlich Sonderausgaben desselben Spiels raus. */
const PLAYABLE = 'version_parent = null & game_type = (0,4,8,9,10)';

/* IGDB-Genre-Slugs → deutsche Namen (Slugs sind stabil, die API liefert nur Englisch).
   Die deutschen Namen landen in media_entries.genres und werden für die Empfehlungen
   über byGenres() wieder in Slugs zurückübersetzt. */
const GENRES = {
  'point-and-click': 'Point & Click',
  'fighting': 'Kampfspiel',
  'shooter': 'Shooter',
  'music': 'Musik',
  'platform': 'Plattformer',
  'puzzle': 'Puzzle',
  'racing': 'Rennspiel',
  'real-time-strategy-rts': 'Echtzeit-Strategie',
  'role-playing-rpg': 'Rollenspiel',
  'simulator': 'Simulation',
  'sport': 'Sport',
  'strategy': 'Strategie',
  'turn-based-strategy-tbs': 'Rundenstrategie',
  'tactical': 'Taktik',
  'hack-and-slash-beat-em-up': 'Hack & Slash',
  'quiz-trivia': 'Quiz',
  'pinball': 'Flipper',
  'adventure': 'Abenteuer',
  'indie': 'Indie',
  'arcade': 'Arcade',
  'visual-novel': 'Visual Novel',
  'card-and-board-game': 'Karten- & Brettspiel',
  'moba': 'MOBA',
};

/* IGDB-Status-Enum → App-Status-Strings (nur die eindeutigen Fälle;
   alles andere wird unten übers Erscheinungsdatum abgeleitet). */
const STATUS_BY_ID = {
  4: 'Currently Airing',  // Early Access → Badge „Läuft"
  6: 'Discontinued',      // Cancelled    → Badge „Eingestellt"
  7: 'Not yet aired',     // Rumored      → Badge „Angekündigt"
};

function nowSeconds()
{
  return Math.floor(Date.now() / 1000);
}

/* IGDB liefert Wertungen auf einer 0–100-Skala; die App zeigt 0–10 wie bei MAL/TMDB.
   Kritiker-Wertung hat Vorrang, dann die kombinierte, zuletzt die Nutzer-Wertung. */
function normalizeScore(item)
{
  const raw = item.aggregated_rating || item.total_rating || item.rating;
  return raw ? Math.round(raw) / 10 : null;
}

function deriveStatus(item)
{
  if (STATUS_BY_ID[item.status])
  {
    return STATUS_BY_ID[item.status];
  }
  if (!item.first_release_date)
  {
    return 'Not yet aired';
  }
  return item.first_release_date <= nowSeconds() ? 'Finished' : 'Not yet aired';
}

/* Mappt ein rohes IGDB-Item auf das App-interne Medienformat.
   mal_id trägt hier die IGDB-ID (source unterscheidet die Provider).
   Spiele haben keinen Fortschrittszähler — episodes/chapters/volumes bleiben leer. */
function formatMedia(item)
{
  return {
    mal_id: item.id,
    type: 'game',
    title: item.name,
    title_english: null,
    title_japanese: null,
    image_url: item.cover?.image_id ? `${IMAGE_BASE}/${item.cover.image_id}.jpg` : null,
    synopsis: item.summary || null,
    media_status: deriveStatus(item),
    episodes: null,
    chapters: null,
    volumes: null,
    api_score: normalizeScore(item),
    genres: (item.genres || []).map(g => GENRES[g.slug] || g.slug).filter(Boolean),
    // first_release_date ist ein Unix-Zeitstempel in Sekunden
    year: item.first_release_date
      ? new Date(item.first_release_date * 1000).getUTCFullYear()
      : null,
    season: null,
    // Wird nur im Detail-Abruf gefüllt (eigener Endpunkt, siehe getById)
    avg_play_minutes: null,
    mal_url: null,
    source: 'igdb',
  };
}

/* IGDB kennt keine Gesamtzahl — „weiter" gibt es, solange eine volle Seite zurückkommt */
function formatPage(items, page)
{
  const results = (items || []).filter(g => g && g.name).map(formatMedia);
  return {
    results,
    pagination: {
      current_page: page,
      last_visible_page: page + (results.length === PAGE_SIZE ? 1 : 0),
      has_next_page: results.length === PAGE_SIZE,
    },
  };
}

function offsetFor(page)
{
  return (Math.max(1, page) - 1) * PAGE_SIZE;
}

/* Anführungszeichen im Suchbegriff würden den Apicalypse-Body aufbrechen */
function escapeSearch(q)
{
  return String(q).replace(/["\\]/g, ' ');
}

async function searchMedia(q, page = 1)
{
  const body = `search "${escapeSearch(q)}"; fields ${FIELDS}; `
    + `where ${PLAYABLE}; limit ${PAGE_SIZE}; offset ${offsetFor(page)};`;
  return formatPage(await iFetch('games', body), page);
}

/* Durchschnittliche Spieldauer bis zum Durchspielen. IGDB führt die Werte in einem
   eigenen Endpunkt (kein Expander von `games` aus) und rechnet in Sekunden.
   Fehlt der Datensatz — bei vielen Titeln der Fall —, bleibt das Feld schlicht leer. */
async function avgPlayMinutes(gameId)
{
  try
  {
    const rows = await iFetch('game_time_to_beats',
      `fields normally; where game_id = ${gameId}; limit 1;`);
    const seconds = rows?.[0]?.normally;
    return seconds ? Math.round(seconds / 60) : null;
  }
  catch
  {
    // Spielzeit ist ein Bonus — ein Fehler hier darf das Detail nicht kippen
    return null;
  }
}

async function getById(id)
{
  const gameId = parseInt(id);
  const items = await iFetch('games', `fields ${FIELDS}; where id = ${gameId}; limit 1;`);
  if (!items || !items.length)
  {
    throw new Error('IGDB: Spiel nicht gefunden');
  }
  const media = formatMedia(items[0]);
  media.avg_play_minutes = await avgPlayMinutes(gameId);
  return media;
}

/* „Beliebte Spiele" — die meistbewerteten Titel */
async function topMedia(page = 1)
{
  const body = `fields ${FIELDS}; where ${PLAYABLE} & total_rating_count > 50; `
    + `sort total_rating_count desc; limit ${PAGE_SIZE}; offset ${offsetFor(page)};`;
  return formatPage(await iFetch('games', body), page);
}

/* „Neu & angesagt" — populärste Titel der letzten Monate */
async function trending()
{
  const from = nowSeconds() - TRENDING_DAYS * 86400;
  const body = `fields ${FIELDS}; where ${PLAYABLE} & first_release_date > ${from} `
    + `& first_release_date < ${nowSeconds()}; sort total_rating_count desc; limit ${PAGE_SIZE};`;
  return formatPage(await iFetch('games', body), 1);
}

/* Empfehlungen: deutsche Genre-Namen → Slugs, sortiert nach Wertung.
   Ohne Treffer (unbekannte Genres oder leeres Ergebnis) auf die Top-Liste zurückfallen. */
async function byGenres(genreNames, page = 1)
{
  const slugs = Object.entries(GENRES)
    .filter(([, name]) => genreNames.includes(name))
    .map(([slug]) => slug);
  if (!slugs.length)
  {
    return topMedia(page);
  }
  // ODER-Verkettung statt Mengen-Syntax — eindeutig und unabhängig von Array-Semantik
  const genreFilter = slugs.map(s => `genres.slug = "${s}"`).join(' | ');
  // Mindestzahl an Wertungen, sonst stehen Nischentitel mit 30 Stimmen vor den Klassikern
  const body = `fields ${FIELDS}; where (${genreFilter}) & ${PLAYABLE} `
    + `& total_rating_count > ${MIN_RATINGS_FOR_RECOMMENDATIONS} & total_rating != null; `
    + `sort total_rating desc; limit ${PAGE_SIZE}; offset ${offsetFor(page)};`;

  const formatted = formatPage(await iFetch('games', body), page);
  return formatted.results.length ? formatted : topMedia(page);
}

module.exports = {
  isConfigured, searchMedia, getById, topMedia, trending, byGenres, formatMedia,
  // nur für Tests
  resetToken,
};
