/* =====================================================
   AniGa – media.js
   Status-Mappings, Medien-Helfer und geteilte Karten-Komponenten
   ===================================================== */
import { IC } from './icons.js';
import { S } from './state.js';
import { $$, esc, coverImg, toast } from './dom.js';
import { API } from './api.js';
import { showTrackModal } from './modals/track.js';

/* ---- BEREICHE & TYP-METADATEN ---- */
export const AREAS = {
  otaku:  { label: '🌸 Anime & Manga',  types: ['anime', 'manga'] },
  screen: { label: '🎬 Filme & Serien', types: ['movie', 'tv'] },
};

export const TYPE_META = {
  anime: { view: 'anime', label: 'Anime-Liste',  short: 'Anime',  singular: 'Anime', plural: 'Anime',  emoji: '🎬', icon: 'tv' },
  manga: { view: 'manga', label: 'Manga-Liste',  short: 'Manga',  singular: 'Manga', plural: 'Manga',  emoji: '📚', icon: 'book' },
  movie: { view: 'movie', label: 'Film-Liste',   short: 'Filme',  singular: 'Film',  plural: 'Filme',  emoji: '🎥', icon: 'film' },
  tv:    { view: 'tv',    label: 'Serien-Liste', short: 'Serien', singular: 'Serie', plural: 'Serien', emoji: '📺', icon: 'monitor' },
};

export function areaOf(type)
{
  return AREAS.screen.types.includes(type) ? 'screen' : 'otaku';
}

/* Zentrale Zuordnung Typ → State-Liste (ersetzt verstreute anime/manga-Ternaries) */
export function getUserList(type)
{
  return { anime: S.animeList, manga: S.mangaList, movie: S.movieList, tv: S.tvList }[type] || [];
}

export function setUserList(type, list)
{
  const key = { anime: 'animeList', manga: 'mangaList', movie: 'movieList', tv: 'tvList' }[type];
  if (key)
  {
    S[key] = list;
  }
}

export const STATUS_LABELS = {
  watching:'Schaut gerade', reading:'Liest gerade',
  completed:'Abgeschlossen', on_hold:'Pausiert', dropped:'Abgebrochen',
  plan_to_watch:'Geplant', plan_to_read:'Geplant',
};
export const STATUS_CSS = {
  watching:'s-watching', reading:'s-reading',
  completed:'s-completed', on_hold:'s-on_hold', dropped:'s-dropped',
  plan_to_watch:'s-plan_to_watch', plan_to_read:'s-plan_to_read',
};
export const ANIME_STATUSES = [
  {val:'watching',label:'Schaut gerade'},{val:'plan_to_watch',label:'Geplant'},
  {val:'completed',label:'Abgeschlossen'},{val:'on_hold',label:'Pausiert'},{val:'dropped',label:'Abgebrochen'},
];
export const MANGA_STATUSES = [
  {val:'reading',label:'Liest gerade'},{val:'plan_to_read',label:'Geplant'},
  {val:'completed',label:'Abgeschlossen'},{val:'on_hold',label:'Pausiert'},{val:'dropped',label:'Abgebrochen'},
];

/* Filme/Serien nutzen dieselben Stati wie Anime (watching/plan_to_watch/…) */
export function statusesFor(type)
{
  return type === 'manga' ? MANGA_STATUSES : ANIME_STATUSES;
}

export function mediaStatusBadge(status)
{
  const MAP = {
    'Currently Airing':['Läuft','badge-airing'],
    'Finished Airing':['Abgeschlossen','badge-finished'],
    'Not yet aired':['Angekündigt','badge-upcoming'],
    'Publishing':['Erscheint noch','badge-publishing'],
    'Finished':['Abgeschlossen','badge-finished'],
    'On Hiatus':['Hiatus','badge-upcoming'],
    'Discontinued':['Eingestellt','badge-finished'],
    'Not yet published':['Angekündigt','badge-upcoming'],
  };
  const [label, cls] = MAP[status] || [esc(status), 'badge-finished'];
  return `<span class="media-card-badge ${cls}">${label}</span>`;
}

export function starsHtml(score, sm='')
{
  if (!score)
  {
    return '';
  }
  const n = Math.round(score);
  const stars = Array.from({length:5}, (_,i) =>
    `<span class="star-btn${sm?' sm':''} ${i<n?'on':''}">${IC.star}</span>`
  ).join('');
  return `<div class="stars">${stars}</div>`;
}

/* Absolute Episodennummer über alle Staffeln (Serien mit Staffel-Tracking).
   Fällt auf current_episode zurück, wenn keine Staffel-Daten vorliegen. */
export function absoluteEpisode(e)
{
  if (!e.current_season || !Array.isArray(e.seasons_data) || !e.seasons_data.length)
  {
    return e.current_episode || 0;
  }
  let sum = 0;
  for (const s of e.seasons_data)
  {
    if (s.season < e.current_season)
    {
      sum += s.episodes;
    }
  }
  return sum + (e.current_episode || 0);
}

export function progressText(e)
{
  if (e.type === 'movie')
  {
    return e.year ? `Film · ${e.year}` : 'Film';
  }
  if (e.type === 'tv' && e.current_season)
  {
    return `S${e.current_season} · E${e.current_episode||0}`;
  }
  if (e.type === 'anime' || e.type === 'tv')
  {
    return `Ep. ${e.current_episode||0} / ${e.episodes||'?'}`;
  }
  let t = `Kap. ${e.current_chapter||0} / ${e.chapters||'?'}`;
  if (e.current_page)
  {
    t += ` · S. ${e.current_page}`;
  }
  return t;
}

export function progressPct(e)
{
  if (e.type === 'movie')
  {
    return 0;
  }
  if (e.type === 'anime' || e.type === 'tv')
  {
    return e.episodes
      ? Math.min(100, (absoluteEpisode(e)/e.episodes)*100)
      : 0;
  }
  return e.chapters
    ? Math.min(100, ((e.current_chapter||0)/e.chapters)*100)
    : 0;
}

export function isInList(media)
{
  if (!media.mal_id)
  {
    return false;
  }
  return getUserList(media.type).some(e => String(e.mal_id) === String(media.mal_id));
}

export function findInList(media)
{
  if (!media.mal_id)
  {
    return null;
  }
  return getUserList(media.type).find(e => String(e.mal_id) === String(media.mal_id)) || null;
}

export function findMediaInCache(malId, type)
{
  return [...S.searchResults, ...S.topAnime, ...S.topManga, ...S.seasonal,
          ...S.topMovie, ...S.topTv, ...S.trendingMovie]
    .find(m => String(m.mal_id) === String(malId) && m.type === type) || null;
}

export function entryToMedia(entry)
{
  return {
    mal_id: entry.mal_id, type: entry.type,
    title: entry.title, title_english: entry.title_english,
    title_japanese: entry.title_japanese,
    image_url: entry.image_url, synopsis: entry.synopsis,
    media_status: entry.media_status, episodes: entry.episodes,
    chapters: entry.chapters, volumes: entry.volumes,
    seasons_data: entry.seasons_data || null,
    api_score: entry.api_score, genres: entry.genres || [],
    year: entry.year, season: entry.season,
    is_manual: entry.is_manual, source: entry.source,
  };
}

/* ---- KARTEN-KOMPONENTEN ---- */
export function ownedBadgeHtml(entry)
{
  if (!entry.owned)
  {
    return '';
  }
  const label = entry.type !== 'anime' && entry.volumes
    ? `${entry.owned_volumes || 0}/${entry.volumes}`
    : '';
  return `<div class="owned-badge" title="Physisch im Besitz${label ? ' — ' + label + ' Bände' : ''}">${IC.shelf}${label ? `<span>${label}</span>` : ''}</div>`;
}

export function ownedChipHtml(e)
{
  if (!e.owned)
  {
    return '';
  }
  return `<span class="owned-chip">${IC.shelf} Besitz${e.type!=='anime'&&e.volumes?' '+((e.owned_volumes||0)+'/'+e.volumes):''}</span>`;
}

export function renderMediaCard(media)
{
  const inList = isInList(media);
  return `
    <div class="media-card" data-mal-id="${media.mal_id||''}" data-type="${media.type}">
      <div class="media-card-cover">
        ${coverImg(media.image_url, media.title)}
        ${media.api_score?`<div class="media-card-score">${IC.star}${media.api_score.toFixed(1)}</div>`:''}
        ${media.media_status?mediaStatusBadge(media.media_status):''}
        <div class="media-card-overlay">
          <div class="media-card-title">${esc(media.title)}</div>
        </div>
      </div>
      <div class="media-card-footer">
        <span class="media-card-type">${TYPE_META[media.type]?.singular || media.type}${media.year?' · '+media.year:''}</span>
        <button class="btn-add-to-list${inList?' in-list':''}" title="${inList?'Bearbeiten':'Hinzufügen'}">
          ${inList?IC.check:IC.plus}
        </button>
      </div>
    </div>`;
}

export function renderMediaCardFromEntry(entry)
{
  const pct = progressPct(entry);
  return `
    <div class="media-card" data-entry-id="${entry.id}" data-type="${entry.type}">
      <div class="media-card-cover">
        ${coverImg(entry.image_url, entry.title)}
        ${entry.user_score != null?`<div class="media-card-score">${IC.star}${entry.user_score}.0</div>`:''}
        <div class="media-card-badge">
          <span class="status-badge ${STATUS_CSS[entry.list_status]}">${STATUS_LABELS[entry.list_status]||''}</span>
        </div>
        ${ownedBadgeHtml(entry)}
        <div class="media-card-overlay">
          <div class="media-card-title">${esc(entry.title)}</div>
        </div>
      </div>
      <div class="media-card-footer">
        <span class="media-card-type">${progressText(entry)}</span>
        <button class="btn-add-to-list in-list" title="Bearbeiten">${IC.edit}</button>
      </div>
      ${pct>0 ? `<div class="progress-bar"
        style="margin:-1px 0 0;border-radius:0 0 var(--r) var(--r)">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>` : ''}
    </div>`;
}

/* Öffnet das Track-Modal für einen eigenen Listen-Eintrag.
   Serien ohne gespeicherte Staffel-Daten holen einmalig die TMDB-Details nach
   (heilt Alt-Einträge mit absoluter Episodenzählung). */
export async function openEntryTrackModal(entry)
{
  let media = entryToMedia(entry);
  if (entry.type === 'tv' && !media.seasons_data && media.mal_id && !media.is_manual)
  {
    try
    {
      media = await API.search.getDetail('tv', media.mal_id);
    }
    catch
    {
      // Fallback auf die gespeicherten Daten
    }
  }
  showTrackModal(media, entry);
}

export function bindMediaCard(card)
{
  card.addEventListener('click', async () =>
  {
    const entryId = card.dataset.entryId;
    const malId = card.dataset.malId;
    const type = card.dataset.type;

    if (entryId)
    {
      const entry = getUserList(type).find(e=>e.id==entryId);
      if (entry)
      {
        openEntryTrackModal(entry);
      }
      return;
    }
    if (!malId)
    {
      return;
    }

    // TMDB-Suchergebnisse enthalten keine Episoden/Staffeln — für movie/tv immer Details holen
    let media = findMediaInCache(malId, type);
    if (!media || type === 'movie' || type === 'tv')
    {
      try
      {
        media = await API.search.getDetail(type, malId);
      }
      catch
      {
        toast('Details konnten nicht geladen werden', 'error');
        return;
      }
    }
    const existing = findInList(media);
    showTrackModal(media, existing);
  });
}

export function bindMediaCards()
{
  $$('.media-card').forEach(c => bindMediaCard(c));
}
