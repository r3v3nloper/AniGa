/* AniList GraphQL fallback provider – used when Jikan/MyAnimeList is unreachable.
   Returns media in the same app-internal format as utils/jikan.js formatMedia(). */
const { createRateLimitedFetch } = require('./rateLimitedFetch');

const ANILIST = 'https://graphql.anilist.co';
const MIN_INTERVAL = 700;

const limitedFetch = createRateLimitedFetch({ name: 'AniList', minInterval: MIN_INTERVAL });

/* AniList status → Jikan-style status strings (frontend badge map expects these) */
const STATUS_MAP = {
  anime: {
    RELEASING: 'Currently Airing',
    FINISHED: 'Finished Airing',
    NOT_YET_RELEASED: 'Not yet aired',
    CANCELLED: 'Discontinued',
    HIATUS: 'On Hiatus',
  },
  manga: {
    RELEASING: 'Publishing',
    FINISHED: 'Finished',
    NOT_YET_RELEASED: 'Not yet published',
    CANCELLED: 'Discontinued',
    HIATUS: 'On Hiatus',
  },
};

/* Genres AniList knows by name (subset of MAL genre names used for recommendations) */
const ANILIST_GENRES = new Set([
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mecha', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
  'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
]);

const MEDIA_FIELDS = `
  idMal
  title { romaji english native }
  description(asHtml: false)
  status
  episodes
  chapters
  volumes
  averageScore
  genres
  season
  seasonYear
  startDate { year }
  coverImage { extraLarge large }
`;

const PAGE_QUERY = `
  query ($page: Int, $perPage: Int, $search: String, $type: MediaType, $sort: [MediaSort],
         $genres: [String], $season: MediaSeason, $seasonYear: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage lastPage hasNextPage }
      media(search: $search, type: $type, sort: $sort, genre_in: $genres,
            season: $season, seasonYear: $seasonYear, isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }`;

const SINGLE_QUERY = `
  query ($idMal: Int, $type: MediaType) {
    Media(idMal: $idMal, type: $type) {
      ${MEDIA_FIELDS}
    }
  }`;

/* GraphQL meldet Fehler auch mit HTTP 200 im Body — daher eigene Auswertung */
async function alFetch(query, variables)
{
  return limitedFetch(
    ANILIST,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables }),
    },
    async res =>
    {
      const json = await res.json();
      if (!res.ok || json.errors)
      {
        throw new Error(`AniList ${res.status}: ${json.errors?.[0]?.message || 'unknown'}`);
      }
      return json.data;
    }
  );
}

function stripHtml(text)
{
  if (!text)
  {
    return null;
  }
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim() || null;
}

/* Maps a raw AniList media item to the app-internal media format */
function formatMedia(item, type)
{
  const isAnime = type === 'anime';
  return {
    mal_id: item.idMal,
    type,
    title: item.title?.romaji || item.title?.english || item.title?.native,
    title_english: item.title?.english || null,
    title_japanese: item.title?.native || null,
    image_url: item.coverImage?.extraLarge || item.coverImage?.large || null,
    synopsis: stripHtml(item.description),
    media_status: STATUS_MAP[type][item.status] || null,
    ...(isAnime
      ? { episodes: item.episodes || null,
          year: item.seasonYear || item.startDate?.year || null,
          season: item.season ? item.season.toLowerCase() : null }
      : { chapters: item.chapters || null, volumes: item.volumes || null,
          year: item.startDate?.year || null }),
    api_score: item.averageScore ? item.averageScore / 10 : null,
    genres: item.genres || [],
    mal_url: item.idMal ? `https://myanimelist.net/${type}/${item.idMal}` : null,
    source: 'anilist'
  };
}

/* Entries without a MAL id are dropped to keep the mal_id-based list logic consistent */
function formatPage(data, type)
{
  const media = data.Page?.media || [];
  const info = data.Page?.pageInfo || {};
  return {
    results: media.filter(m => m.idMal).map(m => formatMedia(m, type)),
    pagination: {
      current_page: info.currentPage || 1,
      last_visible_page: info.lastPage || 1,
      has_next_page: !!info.hasNextPage,
    },
  };
}

function toAlType(type)
{
  return type === 'manga' ? 'MANGA' : 'ANIME';
}

async function searchMedia(type, q, page)
{
  const data = await alFetch(PAGE_QUERY, {
    page, perPage: 20, search: q, type: toAlType(type), sort: ['SEARCH_MATCH'],
  });
  return formatPage(data, type);
}

async function getByMalId(type, malId)
{
  const data = await alFetch(SINGLE_QUERY, { idMal: malId, type: toAlType(type) });
  return formatMedia(data.Media, type);
}

async function topMedia(type, page = 1)
{
  const data = await alFetch(PAGE_QUERY, {
    page, perPage: 20, type: toAlType(type), sort: ['POPULARITY_DESC'],
  });
  return formatPage(data, type);
}

async function byGenres(type, genreNames, page = 1)
{
  const genres = genreNames.filter(g => ANILIST_GENRES.has(g));
  if (!genres.length)
  {
    return topMedia(type, page);
  }
  const data = await alFetch(PAGE_QUERY, {
    page, perPage: 25, type: toAlType(type), genres, sort: ['SCORE_DESC'],
  });
  return formatPage(data, type);
}

function currentSeason(date = new Date())
{
  const seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  return {
    season: seasons[Math.floor(date.getMonth() / 3)],
    seasonYear: date.getFullYear(),
  };
}

async function seasonal()
{
  const { season, seasonYear } = currentSeason();
  const data = await alFetch(PAGE_QUERY, {
    page: 1, perPage: 20, type: 'ANIME', season, seasonYear, sort: ['POPULARITY_DESC'],
  });
  return formatPage(data, 'anime');
}

/* Runs primary(), falls back to fallback() on failure; rethrows the primary error
   if both fail so logs point at the root cause. */
async function withFallback(primary, fallback)
{
  try
  {
    return await primary();
  }
  catch (primaryErr)
  {
    try
    {
      return await fallback();
    }
    catch
    {
      throw primaryErr;
    }
  }
}

module.exports = { searchMedia, getByMalId, topMedia, byGenres, seasonal, withFallback, formatMedia };
