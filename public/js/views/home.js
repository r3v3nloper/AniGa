/* =====================================================
   AniGa – views/home.js
   Dashboard: Statistiken, Empfehlungen, zuletzt aktualisiert
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, coverImg, timeAgo, toast, renderEmptyState } from '../dom.js';
import { API } from '../api.js';
import {
  STATUS_LABELS, STATUS_CSS, starsHtml, progressText,
  entryToMedia, renderMediaCardFromEntry, bindMediaCards
} from '../media.js';
import { showTrackModal } from '../modals/track.js';
import { navigate } from '../router.js';

export function renderHome()
{
  const a = S.stats?.anime || {};
  const m = S.stats?.manga || {};
  const watching = S.animeList.filter(e => e.list_status === 'watching').slice(0, 6);
  const reading = S.mangaList.filter(e => e.list_status === 'reading').slice(0, 6);
  const recent = [...S.animeList, ...S.mangaList]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 8);

  return `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-icon">${IC.home}</div>
        <div>
          <div class="page-title">Hallo, ${esc(S.user?.username||'')}! 👋</div>
          <div class="page-sub">Dein persönlicher Überblick</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" data-nav="search">${IC.search} Entdecken</button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-num">${a.total||0}</div>
        <div class="stat-label">Anime gesamt</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${a.total_episodes||0}</div>
        <div class="stat-label">Episoden gesehen</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${m.total||0}</div>
        <div class="stat-label">Manga gesamt</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${m.total_chapters||0}</div>
        <div class="stat-label">Kapitel gelesen</div>
      </div>
    </div>

    ${watching.length ? `
    <div class="section">
      <div class="section-head">
        <div class="section-title">${IC.tv} Aktuell am Schauen</div>
        <button class="btn btn-ghost btn-sm" data-nav="anime">Alle ansehen ${IC.chevR}</button>
      </div>
      <div class="media-grid">${watching.map(e=>renderMediaCardFromEntry(e)).join('')}</div>
    </div>` : ''}

    ${reading.length ? `
    <div class="section">
      <div class="section-head">
        <div class="section-title">${IC.book} Aktuell am Lesen</div>
        <button class="btn btn-ghost btn-sm" data-nav="manga">Alle ansehen ${IC.chevR}</button>
      </div>
      <div class="media-grid">${reading.map(e=>renderMediaCardFromEntry(e)).join('')}</div>
    </div>` : ''}

    <div class="section" id="rec-section">
      <div class="section-head rec-head">
        <div class="section-title">✨ Empfohlen für dich</div>
        <div style="display:flex;gap:6px;align-items:center">
          <div class="type-toggle" style="margin:0">
            <button class="type-btn${S.recommendType==='anime'?' active':''}" id="rec-btn-anime">Anime</button>
            <button class="type-btn${S.recommendType==='manga'?' active':''}" id="rec-btn-manga">Manga</button>
          </div>
          <button class="btn btn-ghost btn-sm" id="rec-refresh" title="Neu laden">↺</button>
        </div>
      </div>
      <div id="rec-content">${renderRecommendationContent()}</div>
    </div>

    <div class="section">
      <div class="section-head">
        <div class="section-title">${IC.clock} Zuletzt aktualisiert</div>
      </div>
      ${recent.length ? `
        <div class="recent-list">
          ${recent.map(e=>`
            <div class="recent-item" data-entry-id="${e.id}" data-type="${e.type}">
              <div class="recent-cover">${coverImg(e.image_url,e.title)}</div>
              <div class="recent-info">
                <div class="recent-title">${esc(e.title)}</div>
                <div class="recent-meta">
                  <span class="status-badge ${STATUS_CSS[e.list_status]}">${STATUS_LABELS[e.list_status]||''}</span>
                  &nbsp;·&nbsp;${progressText(e)}
                  ${e.user_score != null?` &nbsp;·&nbsp;${starsHtml(e.user_score,true)}`:''}
                </div>
              </div>
              <div class="recent-updated">${timeAgo(e.updated_at)}</div>
            </div>`).join('')}
        </div>` : renderEmptyState('🌸', 'Noch nichts in deiner Liste',
          'Suche nach Animes und Mangas und starte deinen Tracker!',
          `<button class="btn btn-primary" data-nav="search">${IC.search} Jetzt suchen</button>`)}
    </div>`;
}

function renderRecommendationContent()
{
  const r = S.recommendations;
  if (!r)
  {
    return `<div class="rec-loading">` +
      `<div class="spinner" style="width:20px;height:20px;` +
      `border-width:2px"></div> Wird geladen…</div>`;
  }
  if (!r.results.length)
  {
    return renderEmptyState('🔍', 'Keine Empfehlungen',
      'Füge Anime oder Manga zu deiner Liste hinzu, um personalisierte Empfehlungen zu erhalten.',
      '', 'padding:20px 0');
  }

  const badge = r.basedOn.length
    ? `<div class="rec-based-on">Basiert auf: ` +
      `${r.basedOn.map(g=>`<span class="genre-tag">${esc(g)}</span>`).join('')}</div>`
    : '';

  return `
    ${badge}
    <div class="media-grid">${r.results.map(m => renderRecommendCard(m)).join('')}</div>`;
}

function renderRecommendCard(m)
{
  return `
    <div class="media-card rec-card" data-mal-id="${m.mal_id}" data-type="${m.type}">
      <div class="media-card-cover">
        ${coverImg(m.image_url, m.title)}
        ${m.api_score ? `<div class="media-card-score">${IC.star}${m.api_score.toFixed(1)}</div>` : ''}
        <div class="media-card-overlay"><div class="media-card-title">${esc(m.title)}</div></div>
      </div>
      <div class="media-card-footer">
        <span class="media-card-type">${
          m.type==='anime'
            ? (m.episodes ? `${m.episodes} Ep.` : 'Anime')
            : (m.chapters ? `${m.chapters} Kap.` : 'Manga')
        }</span>
        <button class="btn-add-rec" title="Hinzufügen">${IC.plus}</button>
      </div>
    </div>`;
}

export function bindHome()
{
  $$('[data-nav]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.nav)));
  $$('.recent-item').forEach(el =>
  {
    el.addEventListener('click', () =>
    {
      const type = el.dataset.type;
      const entry = (type==='anime'?S.animeList:S.mangaList)
        .find(e=>e.id==el.dataset.entryId);
      if (entry)
      {
        showTrackModal(entryToMedia(entry), entry);
      }
    });
  });
  bindMediaCards();

  // Recommendation controls
  $('#rec-btn-anime')?.addEventListener('click', () =>
  {
    if (S.recommendType === 'anime')
    {
      return;
    }
    S.recommendType = 'anime';
    S.recommendations = null;
    S.recommendPage = 1;
    $('#rec-btn-anime').classList.add('active');
    $('#rec-btn-manga').classList.remove('active');
    $('#rec-content').innerHTML = renderRecommendationContent();
    loadRecommendations();
  });
  $('#rec-btn-manga')?.addEventListener('click', () =>
  {
    if (S.recommendType === 'manga')
    {
      return;
    }
    S.recommendType = 'manga';
    S.recommendations = null;
    S.recommendPage = 1;
    $('#rec-btn-manga').classList.add('active');
    $('#rec-btn-anime').classList.remove('active');
    $('#rec-content').innerHTML = renderRecommendationContent();
    loadRecommendations();
  });
  $('#rec-refresh')?.addEventListener('click', () =>
  {
    S.recommendations = null;
    S.recommendPage = (S.recommendPage % 5) + 1;
    $('#rec-content').innerHTML = renderRecommendationContent();
    loadRecommendations();
  });

  bindRecCards();
}

function bindRecCards()
{
  $$('.rec-card').forEach(card =>
  {
    card.addEventListener('click', async () =>
    {
      const malId = +card.dataset.malId;
      const type  = card.dataset.type;
      try
      {
        const media = type === 'anime'
          ? await API.search.getAnime(malId)
          : await API.search.getManga(malId);
        const existing = await API.list.check(malId, type).catch(() => null);
        showTrackModal(media, existing || null);
      }
      catch (err)
      {
        toast(err.message, 'error');
      }
    });
  });
}

let _recLoadId = 0;
export async function loadRecommendations()
{
  const myId = ++_recLoadId;
  try
  {
    S.recommendations = await API.recommendations.get(
      S.recommendType, S.recommendPage
    );
    if (myId !== _recLoadId)
    {
      return;
    }
    const content = $('#rec-content');
    if (content && S.view === 'home')
    {
      content.innerHTML = renderRecommendationContent();
      bindRecCards();
    }
  }
  catch (e)
  {
    if (myId !== _recLoadId)
    {
      return;
    }
    const content = $('#rec-content');
    if (content && S.view === 'home')
    {
      content.innerHTML = renderEmptyState(
        '⚠️', '', esc(e.message), '', 'padding:20px 0'
      );
    }
  }
}
