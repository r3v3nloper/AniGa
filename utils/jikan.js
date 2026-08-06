/* Shared Jikan API helper – sequential queue-based rate limiter */
const JIKAN = 'https://api.jikan.moe/v4';
const MIN_INTERVAL = 450;
const TIMEOUT_MS = 8000;

let pending = Promise.resolve();

async function jFetch(url)
{
  const execute = async () =>
  {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try
    {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok)
      {
        throw new Error(`Jikan ${res.status}`);
      }
      return res.json();
    }
    finally
    {
      clearTimeout(timer);
    }
  };

  // Chain onto pending to serialize all Jikan requests with rate-limit spacing
  pending = pending
    .catch(() => {})
    .then(() => new Promise(r => setTimeout(r, MIN_INTERVAL)))
    .then(execute);

  return pending;
}

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
