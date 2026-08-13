/* TMDB-Client (The Movie Database) für Filme & Serien.
   Auth: TMDB_API_TOKEN in .env — akzeptiert beide Formate:
   - v4 "API-Lesezugriffstoken" (beginnt mit eyJ…) → Authorization: Bearer
   - v3 "API-Schlüssel" (kurzer Hex-String)        → ?api_key=…
   Liefert Medien im App-internen Format (wie utils/jikan.js formatMedia). */
const TMDB = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const MIN_INTERVAL = 150;
const TIMEOUT_MS = 8000;

const TOKEN = process.env.TMDB_API_TOKEN || '';
const IS_BEARER = TOKEN.startsWith('eyJ');

function isConfigured()
{
  return TOKEN.length > 0;
}

let pending = Promise.resolve();

async function tFetch(path, params = {})
{
  const execute = async () =>
  {
    const url = new URL(TMDB + path);
    url.searchParams.set('language', 'de-DE');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const headers = { 'Accept': 'application/json' };
    if (IS_BEARER)
    {
      headers.Authorization = `Bearer ${TOKEN}`;
    }
    else
    {
      url.searchParams.set('api_key', TOKEN);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try
    {
      const res = await fetch(url, { headers, signal: controller.signal });
      if (!res.ok)
      {
        throw new Error(`TMDB ${res.status}`);
      }
      return res.json();
    }
    finally
    {
      clearTimeout(timer);
    }
  };

  // Serialisierung mit Abstand — gleiches Muster wie jikan.js/anilist.js
  pending = pending
    .catch(() => {})
    .then(() => new Promise(r => setTimeout(r, MIN_INTERVAL)))
    .then(execute);

  return pending;
}

/* TMDB-Genre-IDs → deutsche Namen (statisch, TMDB-Genrelisten sind stabil) */
const MOVIE_GENRES = {
  28: 'Action', 12: 'Abenteuer', 16: 'Animation', 35: 'Komödie', 80: 'Krimi',
  99: 'Dokumentarfilm', 18: 'Drama', 10751: 'Familie', 14: 'Fantasy',
  36: 'Historie', 27: 'Horror', 10402: 'Musik', 9648: 'Mystery',
  10749: 'Liebesfilm', 878: 'Science Fiction', 10770: 'TV-Film',
  53: 'Thriller', 10752: 'Kriegsfilm', 37: 'Western',
};
const TV_GENRES = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Komödie', 80: 'Krimi',
  99: 'Dokumentarfilm', 18: 'Drama', 10751: 'Familie', 10762: 'Kids',
  9648: 'Mystery', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics', 37: 'Western',
};

/* TMDB-Status → App-Status-Strings (Frontend-Badge-Map versteht diese bereits) */
const TV_STATUS = {
  'Returning Series': 'Currently Airing',
  'Ended': 'Finished Airing',
  'Canceled': 'Discontinued',
  'In Production': 'Not yet aired',
  'Planned': 'Not yet aired',
  'Pilot': 'Not yet aired',
};
const MOVIE_STATUS = {
  'Released': 'Finished',
  'Post Production': 'Not yet aired',
  'In Production': 'Not yet aired',
  'Planned': 'Not yet aired',
  'Rumored': 'Not yet aired',
  'Canceled': 'Discontinued',
};

function mapGenres(item, type)
{
  if (Array.isArray(item.genres))
  {
    return item.genres.map(g => g.name);
  }
  const table = type === 'movie' ? MOVIE_GENRES : TV_GENRES;
  return (item.genre_ids || []).map(id => table[id]).filter(Boolean);
}

function deriveStatus(item, type)
{
  if (item.status)
  {
    return (type === 'movie' ? MOVIE_STATUS : TV_STATUS)[item.status] || null;
  }
  // Suchergebnisse haben kein status-Feld — bei Filmen übers Datum ableiten
  if (type === 'movie' && item.release_date)
  {
    return item.release_date <= new Date().toISOString().substring(0, 10)
      ? 'Finished'
      : 'Not yet aired';
  }
  return null;
}

/* Mappt ein rohes TMDB-Item auf das App-interne Medienformat.
   mal_id trägt hier die TMDB-ID (source unterscheidet die Provider). */
function formatMedia(item, type)
{
  const isMovie = type === 'movie';
  const title = isMovie ? item.title : item.name;
  const original = isMovie ? item.original_title : item.original_name;
  const date = isMovie ? item.release_date : item.first_air_date;

  return {
    mal_id: item.id,
    type,
    title: title || original,
    title_english: original && original !== title ? original : null,
    title_japanese: null,
    image_url: item.poster_path ? IMG_BASE + item.poster_path : null,
    synopsis: item.overview || null,
    media_status: deriveStatus(item, type),
    ...(isMovie
      ? { episodes: null, year: date ? +date.substring(0, 4) : null, season: null }
      : { episodes: item.number_of_episodes || null,
          volumes: item.number_of_seasons || null,
          // Episodenzahl pro Staffel (nur im Detail-Response; Staffel 0 = Specials wird übersprungen)
          seasons_data: Array.isArray(item.seasons)
            ? item.seasons
                .filter(s => s.season_number > 0 && s.episode_count)
                .map(s => ({ season: s.season_number, episodes: s.episode_count }))
            : null,
          year: date ? +date.substring(0, 4) : null }),
    api_score: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
    genres: mapGenres(item, type),
    mal_url: null,
    source: 'tmdb'
  };
}

function formatPage(data, type)
{
  return {
    results: (data.results || [])
      .filter(m => m.poster_path || m.overview)
      .map(m => formatMedia(m, type)),
    pagination: {
      current_page: data.page || 1,
      last_visible_page: data.total_pages || 1,
      has_next_page: (data.page || 1) < (data.total_pages || 1),
    },
  };
}

async function searchMedia(type, q, page = 1)
{
  const data = await tFetch(`/search/${type}`, { query: q, page, include_adult: 'false' });
  return formatPage(data, type);
}

async function getById(type, id)
{
  const data = await tFetch(`/${type}/${id}`);
  return formatMedia(data, type);
}

async function topMedia(type, page = 1)
{
  const data = await tFetch(`/${type}/popular`, { page });
  return formatPage(data, type);
}

async function trending(type)
{
  const data = await tFetch(`/trending/${type}/week`);
  return formatPage(data, type);
}

async function byGenres(type, genreNames, page = 1)
{
  const table = type === 'movie' ? MOVIE_GENRES : TV_GENRES;
  const ids = Object.entries(table)
    .filter(([, name]) => genreNames.includes(name))
    .map(([id]) => id);
  if (!ids.length)
  {
    return topMedia(type, page);
  }
  const data = await tFetch(`/discover/${type}`, {
    with_genres: ids.join(','),
    sort_by: 'vote_average.desc',
    'vote_count.gte': 200,
    page,
  });
  return formatPage(data, type);
}

module.exports = {
  isConfigured, searchMedia, getById, topMedia, trending, byGenres, formatMedia,
};
