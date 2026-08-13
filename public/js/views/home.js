/* =====================================================
   AniGa – views/home.js
   Dashboard des aktiven Bereichs: Statistiken, Empfehlungen, zuletzt aktualisiert
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, coverImg, timeAgo, toast, renderEmptyState } from '../dom.js';
import { API } from '../api.js';
import {
  STATUS_LABELS, STATUS_CSS, AREAS, TYPE_META, getUserList,
  starsHtml, progressText, renderMediaCardFromEntry, bindMediaCards, openEntryTrackModal
} from '../media.js';
import { showTrackModal } from '../modals/track.js';
import { navigate } from '../router.js';

/* Bereichsspezifische Dashboard-Konfiguration */
function areaConfig()
{
  if (S.area === 'screen')
  {
    return {
      statCards: [
        { num: () => S.stats?.movie?.total || 0, label: 'Filme gesamt' },
        { num: () => S.stats?.movie?.completed || 0, label: 'Filme gesehen' },
        { num: () => S.stats?.tv?.total || 0, label: 'Serien gesamt' },
        { num: () => S.stats?.tv?.completed || 0, label: 'Serien abgeschlossen' },
      ],
      sections: [
        { type: 'tv', status: 'watching', icon: IC.monitor, title: 'Serien am Schauen' },
        { type: 'movie', status: 'plan_to_watch', icon: IC.film, title: 'Film-Watchlist' },
      ],
    };
  }
  return {
    statCards: [
      { num: () => S.stats?.anime?.total || 0, label: 'Anime gesamt' },
      { num: () => S.stats?.anime?.total_episodes || 0, label: 'Episoden gesehen' },
      { num: () => S.stats?.manga?.total || 0, label: 'Manga gesamt' },
      { num: () => S.stats?.manga?.total_chapters || 0, label: 'Kapitel gelesen' },
    ],
    sections: [
      { type: 'anime', status: 'watching', icon: IC.tv, title: 'Aktuell am Schauen' },
      { type: 'manga', status: 'reading', icon: IC.book, title: 'Aktuell am Lesen' },
    ],
  };
}

export function renderHome()
{
  const cfg = areaConfig();
  const types = AREAS[S.area].types;
  const recent = types.flatMap(t => getUserList(t))
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
      ${cfg.statCards.map(c => `
        <div class="stat-card">
          <div class="stat-num">${c.num()}</div>
          <div class="stat-label">${c.label}</div>
        </div>`).join('')}
    </div>

    ${cfg.sections.map(sec =>
    {
      const items = getUserList(sec.type).filter(e => e.list_status === sec.status).slice(0, 6);
      if (!items.length)
      {
        return '';
      }
      return `
      <div class="section">
        <div class="section-head">
          <div class="section-title">${sec.icon} ${sec.title}</div>
          <button class="btn btn-ghost btn-sm" data-nav="${sec.type}">Alle ansehen ${IC.chevR}</button>
        </div>
        <div class="media-grid">${items.map(e=>renderMediaCardFromEntry(e)).join('')}</div>
      </div>`;
    }).join('')}

    <div class="section" id="rec-section">
      <div class="section-head rec-head">
        <div class="section-title">✨ Empfohlen für dich</div>
        <div style="display:flex;gap:6px;align-items:center">
          <div class="type-toggle" style="margin:0">
            ${types.map(t => `
              <button class="type-btn${S.recommendType===t?' active':''}" data-rectype="${t}">
                ${TYPE_META[t].short}
              </button>`).join('')}
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
          'Suche nach neuen Titeln und starte deinen Tracker!',
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
      'Füge Titel zu deiner Liste hinzu, um personalisierte Empfehlungen zu erhalten.',
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
          m.type==='manga'
            ? (m.chapters ? `${m.chapters} Kap.` : 'Manga')
            : m.type==='movie'
              ? (m.year || 'Film')
              : (m.episodes ? `${m.episodes} Ep.` : TYPE_META[m.type].singular)
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
      const entry = getUserList(el.dataset.type).find(e=>e.id==el.dataset.entryId);
      if (entry)
      {
        openEntryTrackModal(entry);
      }
    });
  });
  bindMediaCards();

  // Empfehlungs-Typ umschalten (Typen des aktiven Bereichs)
  $$('[data-rectype]').forEach(b =>
  {
    b.addEventListener('click', () =>
    {
      const t = b.dataset.rectype;
      if (S.recommendType === t)
      {
        return;
      }
      S.recommendType = t;
      S.recommendations = null;
      S.recommendPage = 1;
      $$('[data-rectype]').forEach(x => x.classList.toggle('active', x === b));
      $('#rec-content').innerHTML = renderRecommendationContent();
      loadRecommendations();
    });
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
        const media = await API.search.getDetail(type, malId);
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
