/* =====================================================
   AniGa – views/search.js
   Suche für den aktiven Bereich (Anime/Manga bzw. Filme/Serien)
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, renderEmptyState, renderInto, renderMain, spinnerHtml } from '../dom.js';
import { API } from '../api.js';
import { AREAS, TYPE_META, renderMediaCard, bindMediaCards } from '../media.js';
import { showManualModal } from '../modals/manual.js';

function searchPlaceholder()
{
  return `${TYPE_META[S.searchType].plural} suchen…`;
}

export function renderSearch()
{
  const hasResults = S.searchResults.length > 0 && S.searchQ;
  const types = AREAS[S.area].types;
  return `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-icon">${IC.search}</div>
        <div>
          <div class="page-title">Suche</div>
          <div class="page-sub">${esc(AREAS[S.area].discover)}</div>
        </div>
      </div>
    </div>
    <div class="type-toggle">
      ${types.map(t => `
        <button class="type-btn${S.searchType===t?' active':''}" data-type="${t}">
          ${TYPE_META[t].emoji} ${TYPE_META[t].short}
        </button>`).join('')}
    </div>
    <div class="search-bar">
      <input class="search-input" id="search-input" type="text"
        placeholder="${searchPlaceholder()}"
        value="${esc(S.searchQ)}" autocomplete="off" />
      <button class="search-submit" id="search-submit">${IC.search} Suchen</button>
    </div>
    <div id="search-results">${hasResults ? renderSearchResults() : renderSearchDefault()}</div>`;
}

/* Entdecken-Ansicht des aktiven Typs: optionale Highlight-Sektion (Seasonal/Trending)
   über der Top-Sektion — beides beschrieben in TYPE_META. */
function renderSearchDefault()
{
  const types = AREAS[S.area].types;
  if (!types.some(t => S.top[t].length))
  {
    // Anbieter nicht erreichbar/konfiguriert: Hinweis statt Endlos-Spinner,
    // manuelles Eintragen bleibt möglich
    if (S.topError)
    {
      return renderEmptyState('⚠️', 'Entdecken gerade nicht verfügbar', S.topError)
        + manualHintHtml();
    }
    return spinnerHtml();
  }
  const meta = TYPE_META[S.searchType];
  const highlight = S.highlight[S.searchType] || [];

  return `
    ${meta.highlight && highlight.length
      ? sectionHtml(IC[meta.highlight.icon], meta.highlight.title, highlight.slice(0, 10))
      : ''}
    ${sectionHtml(IC[meta.top.icon], meta.top.title, S.top[S.searchType].slice(0, 20))}
    ${manualHintHtml()}`;
}

function sectionHtml(icon, title, items)
{
  return `
    <div class="section">
      <div class="section-head">
        <div class="section-title">${icon} ${title}</div>
      </div>
      <div class="media-grid">${items.map(renderMediaCard).join('')}</div>
    </div>`;
}

function manualHintHtml()
{
  return `
    <div style="text-align:center;margin-top:20px">
      <p class="text-muted" style="font-size:.85rem;margin-bottom:10px">Nicht gefunden?</p>
      <button class="btn btn-secondary" id="btn-manual">Manuell eintragen</button>
    </div>`;
}

function renderSearchResults()
{
  const pag = S.searchPagination;
  return `
    <div class="section-head" style="margin-bottom:14px">
      <div class="section-title">Ergebnisse für „${esc(S.searchQ)}"</div>
      <span class="text-muted" style="font-size:.82rem">${S.searchResults.length} Treffer</span>
    </div>
    ${S.searchResults.length ? `<div class="media-grid">${S.searchResults.map(renderMediaCard).join('')}</div>` :
      renderEmptyState('🔍', 'Keine Ergebnisse', 'Versuche einen anderen Suchbegriff oder trage es manuell ein.')}
    ${(S.searchPage>1||pag?.has_next_page) ? `
      <div class="pagination">
        <button class="btn btn-secondary btn-sm" id="btn-prev"${S.searchPage<=1?' disabled':''}>
          ${IC.chevL} Zurück
        </button>
        <span class="btn btn-ghost btn-sm" style="pointer-events:none">Seite ${S.searchPage}</span>
        <button class="btn btn-secondary btn-sm" id="btn-next"${!pag?.has_next_page?' disabled':''}>
          Weiter ${IC.chevR}
        </button>
      </div>` : ''}
    <div style="text-align:center;margin-top:16px">
      <button class="btn btn-secondary" id="btn-manual">Manuell eintragen</button>
    </div>`;
}

export function bindSearch()
{
  const input = $('#search-input');
  $('#search-submit')?.addEventListener('click', doSearch);
  input?.addEventListener('keydown', e =>
  {
    if (e.key==='Enter')
    {
      doSearch();
    }
  });

  $$('.type-btn').forEach(b =>
  {
    b.addEventListener('click', () =>
    {
      S.searchType = b.dataset.type;
      S.searchQ = '';
      S.searchResults = [];
      S.searchPage = 1;
      $$('.type-btn').forEach(x => x.classList.toggle('active', x===b));
      if (input)
      {
        input.placeholder = searchPlaceholder();
      }
      renderInto($('#search-results'), renderSearchDefault(), bindSearchResults);
    });
  });
  bindSearchResults();
}

function bindSearchResults()
{
  bindMediaCards();
  $('#btn-manual')?.addEventListener('click', () => showManualModal(S.searchType));
  $('#btn-prev')?.addEventListener('click', () =>
  {
    S.searchPage = Math.max(1, S.searchPage - 1);
    doSearch();
  });
  $('#btn-next')?.addEventListener('click', () =>
  {
    S.searchPage++;
    doSearch();
  });
}

let _searchLock = false;
async function doSearch()
{
  const q = $('#search-input')?.value.trim();
  if (!q || _searchLock)
  {
    return;
  }
  _searchLock = true;
  S.searchQ = q;
  const res = $('#search-results');
  renderInto(res, spinnerHtml());
  try
  {
    const data = await API.search.query(S.searchType, q, S.searchPage);
    S.searchResults = data.results || [];
    S.searchPagination = data.pagination || null;
    renderInto(res, renderSearchResults(), bindSearchResults);
  }
  catch (e)
  {
    renderInto(res, renderEmptyState(
      '⚠️', 'Suche fehlgeschlagen', e.message
    ));
  }
  finally
  {
    _searchLock = false;
  }
}

/* Quelle der Highlight-Sektion pro Typ (nur Typen mit TYPE_META.highlight) */
const HIGHLIGHT_SOURCES = {
  anime: () => API.search.seasonal(),
  movie: () => API.search.trending('movie'),
  game:  () => API.search.trending('game'),
};

export async function loadTopContent()
{
  const area = S.area;
  S.topError = null;
  try
  {
    await Promise.all(AREAS[area].types.map(async type =>
    {
      const [top, highlight] = await Promise.all([
        API.search.top(type),
        HIGHLIGHT_SOURCES[type] ? HIGHLIGHT_SOURCES[type]() : null,
      ]);
      S.top[type] = top.results || [];
      if (highlight)
      {
        S.highlight[type] = highlight.results || [];
      }
    }));
  }
  catch (e)
  {
    S.topError = e.message;
    console.warn('Top-Inhalte nicht geladen:', e.message);
  }

  if (S.view === 'search' && S.area === area && !S.searchQ)
  {
    renderMain(renderSearch(), bindSearch);
  }
}
