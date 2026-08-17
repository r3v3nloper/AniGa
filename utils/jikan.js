/* Shared Jikan API helper – rate limiter comes from utils/rateLimitedFetch.js */
const { createRateLimitedFetch } = require('./rateLimitedFetch');

const JIKAN = 'https://api.jikan.moe/v4';
const MIN_INTERVAL = 450;

const jFetch = createRateLimitedFetch({ name: 'Jikan', minInterval: MIN_INTERVAL });

/* Maps a raw Jikan item to the app-internal media format */
function formatMedia(item, type)
{
  const isAnime = type === 'anime';
  return {
    mal_id: item.mal_id,
    type,
    title: item.title,
    title_english: item.title_english || null,
    title_japanese: item.title_japanese || null,
    image_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || null,
    synopsis: item.synopsis || null,
    media_status: item.status || null,
    ...(isAnime
      ? { episodes: item.episodes || null, year: item.year || null, season: item.season || null }
      : { chapters: item.chapters || null, volumes: item.volumes || null,
          year: item.published?.prop?.from?.year || null }),
    api_score: item.score || null,
    genres: item.genres?.map(g => g.name) || [],
    mal_url: item.url || null,
    source: 'jikan'
  };
}

module.exports = { jFetch, JIKAN, formatMedia };
