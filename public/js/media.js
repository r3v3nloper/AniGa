/* =====================================================
   AniGa – media.js
   Status-Mappings, Medien-Helfer und geteilte Karten-Komponenten
   ===================================================== */
import { IC } from './icons.js';
import { S } from './state.js';
import { $$, esc, coverImg, toast, bindActivate } from './dom.js';
import { API } from './api.js';
import { showTrackModal } from './modals/track.js';
import { TYPE_META, MEDIA_TYPES, STATUS_CSS, mediaStatusMeta, statusLabel,
  sourceLabel as sourceLabelOf } from './types.js';

/* Die Typ-Abstraktion selbst liegt in types.js (zyklenfreies Leaf-Modul);
   media.js bleibt der Einstiegspunkt für alle Views. */
export {
  AREAS, TYPE_META, MEDIA_TYPES, STATUS_CSS,
  areaOf, statusLabel, statusesFor, defaultStatusFor, planStatusFor, sourceLabel,
} from './types.js';

/* Zentrale Zuordnung Typ → State-Liste (ersetzt verstreute anime/manga-Ternaries) */
export function getUserList(type)
{
  return S.lists[type] || [];
}

export function setUserList(type, list)
{
  if (type in S.lists)
  {
    S.lists[type] = list;
  }
}

export function mediaStatusBadge(status, type)
{
  const [label, cls] = mediaStatusMeta(status, type) || [esc(status), 'badge-finished'];
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
  const meta = TYPE_META[e.type] || {};
  // Typen ohne Zähler (Filme, Spiele) zeigen stattdessen Art, Jahr und — falls
  // erfasst — die eigene Spielzeit
  if (!meta.progress)
  {
    return [meta.singular, e.year, meta.playtime ? playtimeText(e.play_minutes) : '']
      .filter(Boolean).join(' · ');
  }
  if (meta.progress === 'episodes')
  {
    return e.type === 'tv' && e.current_season
      ? `S${e.current_season} · E${e.current_episode||0}`
      : `Ep. ${e.current_episode||0} / ${e.episodes||'?'}`;
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
  const meta = TYPE_META[e.type] || {};
  if (meta.progress === 'episodes')
  {
    return e.episodes
      ? Math.min(100, (absoluteEpisode(e)/e.episodes)*100)
      : 0;
  }
  if (meta.progress === 'chapters')
  {
    return e.chapters
      ? Math.min(100, ((e.current_chapter||0)/e.chapters)*100)
      : 0;
  }
  return 0;
}

/* „12 Anime · 3 Spiele" — zählt alle Typen, die der Nutzer tatsächlich getrackt hat.
   Erwartet die `<typ>Count`-Felder aus TYPE_COUNT_COLUMNS (utils/sql.js). */
export function typeCountsText(counts)
{
  const parts = MEDIA_TYPES
    .map(type => ({ n: counts[`${type}Count`] || 0, meta: TYPE_META[type] }))
    .filter(({ n }) => n > 0)
    .map(({ n, meta }) => `${n} ${n === 1 ? meta.singular : meta.plural}`);
  return parts.length ? parts.join(' · ') : 'Noch keine Einträge';
}

/* Spielzeit in Minuten → lesbare Angabe („45 Min", „12 Std", „92,3 Std") */
export function playtimeText(minutes)
{
  if (!minutes)
  {
    return '';
  }
  if (minutes < 60)
  {
    return `${minutes} Min`;
  }
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${String(hours).replace('.', ',')} Std`;
}

/* Kurzbeschriftung eines Suchergebnisses/einer Empfehlung (Karten-Footer) */
export function mediaSubtitle(m)
{
  const meta = TYPE_META[m.type] || {};
  if (meta.progress === 'episodes')
  {
    return m.episodes ? `${m.episodes} Ep.` : meta.singular;
  }
  if (meta.progress === 'chapters')
  {
    return m.chapters ? `${m.chapters} Kap.` : meta.singular;
  }
  return m.year ? String(m.year) : meta.singular;
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
  return [...S.searchResults, ...Object.values(S.top).flat(), ...Object.values(S.highlight).flat()]
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
    avg_play_minutes: entry.avg_play_minutes || null,
    is_manual: entry.is_manual, source: entry.source,
  };
}

/* ---- GETEILTE DETAIL-BAUSTEINE ----
   Werden vom Track-Modal und vom Info-Modal fremder Einträge genutzt.
   Beide arbeiten auf Objekten mit denselben Feldnamen (Media bzw. Listen-Eintrag). */
export function mediaHeroHtml(m)
{
  return `
    <div class="media-detail-hero">
      ${m.image_url
        ? `<img class="media-detail-bg" src="${esc(m.image_url)}" alt=""/>`
        : '<div style="height:130px;background:var(--bg3)"></div>'}
      <div class="media-detail-info">
        <div class="media-detail-cover">${coverImg(m.image_url, m.title)}</div>
        <div class="media-detail-titles">
          <div class="media-detail-title">${esc(m.title)}</div>
          ${m.title_english && m.title_english !== m.title
            ? `<div class="media-detail-title-alt">${esc(m.title_english)}</div>` : ''}
        </div>
      </div>
    </div>`;
}

export function mediaMetaChipsHtml(m)
{
  const meta = TYPE_META[m.type] || {};
  const chips = [];
  if (m.api_score)
  {
    chips.push(`${IC.star}<span style="color:var(--star)">${Number(m.api_score).toFixed(1)}</span> `
      + sourceLabelOf(m.source));
  }
  if (meta.progress === 'episodes' && m.episodes)
  {
    chips.push(`${IC.play} ${m.episodes} Folgen`);
  }
  if (m.type === 'tv' && m.volumes)
  {
    chips.push(`${IC.monitor} ${m.volumes} Staffeln`);
  }
  if (meta.progress === 'chapters' && m.chapters)
  {
    chips.push(`${IC.book} ${m.chapters} Kapitel`);
  }
  if (m.type === 'manga' && m.volumes)
  {
    chips.push(`📦 ${m.volumes} Bände`);
  }
  if (meta.playtime && m.avg_play_minutes)
  {
    chips.push(`${IC.clock} ⌀ ${playtimeText(m.avg_play_minutes)} Spielzeit`);
  }
  if (m.media_status)
  {
    chips.push(`${IC.info} ${esc(m.media_status)}`);
  }
  if (m.year)
  {
    chips.push(`${IC.calendar} ${m.year}`);
  }
  return `<div class="media-meta">${chips.map(c => `<div class="meta-chip">${c}</div>`).join('')}</div>`;
}

export function genreTagsHtml(genres)
{
  if (!genres || !genres.length)
  {
    return '';
  }
  return `<div class="genre-tags" style="margin-bottom:12px">
    ${genres.slice(0, 8).map(g => `<span class="genre-tag">${esc(g)}</span>`).join('')}
  </div>`;
}

/* Beschreibung mit „Mehr anzeigen"-Umschalter (bindSynopsisToggle nicht vergessen) */
export function synopsisHtml(text)
{
  if (!text)
  {
    return '';
  }
  return `
    <div style="margin-bottom:14px">
      <p class="synopsis-text" id="syn-text">${esc(text)}</p>
      ${text.length > 220 ? '<button class="btn-synopsis" id="btn-expand">Mehr anzeigen</button>' : ''}
    </div>`;
}

export function bindSynopsisToggle()
{
  document.getElementById('btn-expand')?.addEventListener('click', () =>
  {
    const st = document.getElementById('syn-text');
    const expanded = st.classList.toggle('expanded');
    document.getElementById('btn-expand').textContent =
      expanded ? 'Weniger anzeigen' : 'Mehr anzeigen';
  });
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
        ${media.media_status?mediaStatusBadge(media.media_status, media.type):''}
        <div class="media-card-overlay">
          <div class="media-card-title">${esc(media.title)}</div>
        </div>
      </div>
      <div class="media-card-footer">
        <span class="media-card-type">${TYPE_META[media.type]?.singular || media.type}${media.year?' · '+media.year:''}</span>
        <button class="btn-add-to-list${inList?' in-list':''}" title="${inList?'Bearbeiten':'Hinzufügen'}"
          tabindex="-1" aria-hidden="true">
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
          <span class="status-badge ${STATUS_CSS[entry.list_status]}">${statusLabel(entry.list_status, entry.type)}</span>
        </div>
        ${ownedBadgeHtml(entry)}
        <div class="media-card-overlay">
          <div class="media-card-title">${esc(entry.title)}</div>
        </div>
      </div>
      <div class="media-card-footer">
        <span class="media-card-type">${progressText(entry)}</span>
        <button class="btn-add-to-list in-list" title="Bearbeiten"
          tabindex="-1" aria-hidden="true">${IC.edit}</button>
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
  bindActivate(card, async () =>
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

    // TMDB-/IGDB-Suchergebnisse sind unvollständig (Episoden, Staffeln, Beschreibung)
    // — für diese Typen immer die Details nachladen (TYPE_META.needsDetail)
    let media = findMediaInCache(malId, type);
    if (!media || TYPE_META[type]?.needsDetail)
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
