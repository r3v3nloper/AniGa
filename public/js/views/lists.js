/* =====================================================
   AniGa – views/lists.js
   Eigene Anime-/Manga-Liste (Filter, Grid/Listen-Ansicht)
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, coverImg, debounce, renderEmptyState, bindStatusTabs, bindViewToggle } from '../dom.js';
import {
  STATUS_LABELS, STATUS_CSS, ANIME_STATUSES, MANGA_STATUSES,
  starsHtml, progressText, progressPct, entryToMedia, ownedChipHtml,
  renderMediaCardFromEntry, bindMediaCards
} from '../media.js';
import { showTrackModal } from '../modals/track.js';
import { navigate } from '../router.js';

export function renderList(type)
{
  const list = type === 'anime' ? S.animeList : S.mangaList;
  const curStatus = S.listStatus[type] || 'all';
  const curView = S.listView[type] || 'grid';
  const curFilter = S.listFilter[type] || '';
  const counts = {};
  list.forEach(e =>
  {
    counts[e.list_status] = (counts[e.list_status]||0)+1;
  });
  const statuses = [
    {val:'all',label:'Alle'},
    ...(type==='anime'?ANIME_STATUSES:MANGA_STATUSES)
  ];

  let filtered = curStatus==='all'
    ? list
    : list.filter(e=>e.list_status===curStatus);
  if (curFilter)
  {
    const q = curFilter.toLowerCase();
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(q)
      || (e.title_english||'').toLowerCase().includes(q));
  }

  return `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-icon">${type==='anime'?IC.tv:IC.book}</div>
        <div>
          <div class="page-title">${type==='anime'?'Anime-Liste':'Manga-Liste'}</div>
          <div class="page-sub">${list.length} ${type==='anime'?'Anime':'Manga'} in deiner Liste</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-add-new">${IC.plus} Hinzufügen</button>
    </div>

    <div class="status-tabs">
      ${statuses.map(s=>`
        <button class="status-tab${curStatus===s.val?' active':''}" data-status="${s.val}">
          ${s.label}<span class="cnt">${s.val==='all'?list.length:(counts[s.val]||0)}</span>
        </button>`).join('')}
    </div>

    <div class="filter-bar">
      <input class="filter-input" id="list-filter" type="text"
        placeholder="In Liste suchen…" value="${esc(curFilter)}" />
      <div class="view-toggle">
        <button class="view-btn${curView==='grid'?' active':''}" id="vgrid" title="Raster">${IC.gridV}</button>
        <button class="view-btn${curView==='list'?' active':''}" id="vlist" title="Liste">${IC.listV}</button>
      </div>
    </div>

    <div id="list-content">${renderListContent(filtered, curView, type)}</div>`;
}

function renderListContent(filtered, curView, type)
{
  if (!filtered.length)
  {
    return renderEmptyState(
      type==='anime'?'🎬':'📚',
      `Keine Einträge${S.listFilter[type]?' für diesen Filter':''}`,
      S.listFilter[type]?'Probiere einen anderen Filter.':'Füge über die Suche neue Einträge hinzu!',
      `<button class="btn btn-primary" id="go-search-btn">${IC.search} Suche</button>`
    );
  }
  return curView === 'grid'
    ? `<div class="media-grid">${filtered.map(e=>renderMediaCardFromEntry(e)).join('')}</div>`
    : `<div class="list-grid">${filtered.map(e=>renderListCard(e)).join('')}</div>`;
}

function renderListCard(e)
{
  const pct = progressPct(e);
  return `
    <div class="list-card card" data-entry-id="${e.id}" data-type="${e.type}">
      <div class="list-card-cover">${coverImg(e.image_url,e.title)}</div>
      <div class="list-card-body">
        <div class="list-card-title" title="${esc(e.title)}">${esc(e.title)}</div>
        <div class="list-card-row">
          <span class="status-badge ${STATUS_CSS[e.list_status]}">${STATUS_LABELS[e.list_status]||''}</span>
          ${ownedChipHtml(e)}
          ${e.user_score != null?starsHtml(e.user_score,true):''}
        </div>
        <div class="list-card-progress">${progressText(e)}</div>
        ${pct>0?`<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`:''}
      </div>
    </div>`;
}

export function bindList(type)
{
  bindStatusTabs('.status-tab', 'status', v =>
  {
    S.listStatus[type] = v;
    refreshListContent(type);
  });

  const filterInput = $('#list-filter');
  filterInput?.addEventListener('input', debounce(() =>
  {
    S.listFilter[type] = filterInput.value;
    refreshListContent(type);
  }, 250));

  bindViewToggle('#vgrid', '#vlist', v =>
  {
    S.listView[type] = v;
    refreshListContent(type);
  });

  $('#btn-add-new')?.addEventListener('click', () =>
  {
    S.searchType = type;
    navigate('search');
  });
  bindListCards();
}

function refreshListContent(type)
{
  const list = type==='anime' ? S.animeList : S.mangaList;
  const curStatus = S.listStatus[type]||'all';
  const curView = S.listView[type]||'grid';
  const curFilter = S.listFilter[type]||'';

  let filtered = curStatus==='all'
    ? list
    : list.filter(e=>e.list_status===curStatus);
  if (curFilter)
  {
    const q = curFilter.toLowerCase();
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(q)
      || (e.title_english||'').toLowerCase().includes(q));
  }

  const content = $('#list-content');
  if (content)
  {
    content.innerHTML = renderListContent(filtered, curView, type);
    bindListCards();
    $('#go-search-btn')?.addEventListener('click', () => navigate('search'));
  }
}

function bindListCards()
{
  bindMediaCards();
  $$('.list-card').forEach(c =>
  {
    c.addEventListener('click', () =>
    {
      const type = c.dataset.type;
      const entry = (type==='anime'?S.animeList:S.mangaList)
        .find(e=>e.id==c.dataset.entryId);
      if (entry)
      {
        showTrackModal(entryToMedia(entry), entry);
      }
    });
  });
}
