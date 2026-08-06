/* =====================================================
   AniGa – views/search.js
   Suche für den aktiven Bereich (Anime/Manga bzw. Filme/Serien)
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, renderEmptyState } from '../dom.js';
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
          <div class="page-sub">${S.area==='screen' ? 'Filme &amp; Serien entdecken' : 'Anime &amp; Manga entdecken'}</div>
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

function renderSearchDefault()
{
  if (S.area === 'screen')
  {
    return renderScreenDefault();
  }
  return renderOtakuDefault();
}

function renderOtakuDefault()
{
  const loading = !S.topAnime.length && !S.topManga.length;
  if (loading)
  {
    return '<div class="loader-wrap"><div class="spinner"></div></div>';
  }
  const isAnime = S.searchType === 'anime';
  const top = isAnime ? S.topAnime : S.topManga;

  return `
    ${isAnime && S.seasonal.length ? `
    <div class="section">
      <div class="section-head">
        <div class="section-title">${IC.calendar} Aktuell laufende Anime</div>
      </div>
      <div class="media-grid">${S.seasonal.slice(0,10).map(renderMediaCard).join('')}</div>
    </div>` : ''}
    <div class="section">
      <div class="section-head">
        <div class="section-title">${IC.flame} ${isAnime?'Top Anime':'Top Manga'}</div>
      </div>
      <div class="media-grid">${top.slice(0,20).map(renderMediaCard).join('')}</div>
    </div>
    ${manualHintHtml()}`;
}

function renderScreenDefault()
{
  const loading = !S.topMovie.length && !S.topTv.length;
  if (loading)
  {
    return '<div class="loader-wrap"><div class="spinner"></div></div>';
  }
  const isMovie = S.searchType === 'movie';
  const top = isMovie ? S.topMovie : S.topTv;

  return `
    ${isMovie && S.trendingMovie.length ? `
    <div class="section">
      <div class="section-head">
        <div class="section-title">${IC.flame} Trending diese Woche</div>
      </div>
      <div class="media-grid">${S.trendingMovie.slice(0,10).map(renderMediaCard).join('')}</div>
    </div>` : ''}
    <div class="section">
      <div class="section-head">
        <div class="section-title">${IC.star} ${isMovie?'Beliebte Filme':'Beliebte Serien'}</div>
      </div>
      <div class="media-grid">${top.slice(0,20).map(renderMediaCard).join('')}</div>
    </div>
    ${manualHintHtml()}`;
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
      $('#search-results').innerHTML = renderSearchDefault();
      bindSearchResults();
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
  res.innerHTML = '<div class="loader-wrap"><div class="spinner"></div></div>';
  try
  {
    const data = await API.search.query(S.searchType, q, S.searchPage);
    S.searchResults = data.results || [];
    S.searchPagination = data.pagination || null;
    res.innerHTML = renderSearchResults();
    bindSearchResults();
  }
  catch (e)
  {
    res.innerHTML = renderEmptyState(
      '⚠️', 'Suche fehlgeschlagen', esc(e.message)
    );
  }
  finally
  {
    _searchLock = false;
  }
}

export async function loadTopContent()
{
  const area = S.area;
  try
  {
    if (area === 'screen')
    {
      const [tm, tt, tr] = await Promise.all([
        API.search.top('movie'), API.search.top('tv'), API.search.trending('movie')
      ]);
      S.topMovie = tm.results || [];
      S.topTv = tt.results || [];
      S.trendingMovie = tr.results || [];
    }
    else
    {
      const [ta, tm, sea] = await Promise.all([
        API.search.top('anime'), API.search.top('manga'), API.search.seasonal()
      ]);
      S.topAnime = ta.results || [];
      S.topManga = tm.results || [];
      S.seasonal = sea.results || [];
    }
    if (S.view === 'search' && S.area === area)
    {
      const main = $('#main-content');
      if (main && !S.searchQ)
      {
        main.innerHTML = renderSearch();
        bindSearch();
      }
    }
  }
  catch (e)
  {
    console.warn('Top-Inhalte nicht geladen:', e.message);
  }
}
