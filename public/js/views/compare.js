/* =====================================================
   AniGa – views/compare.js
   Listen-Vergleich zwischen zwei Nutzern
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, coverImg, toast, renderEmptyState, bindStatusTabs } from '../dom.js';
import { API } from '../api.js';
import { STATUS_LABELS, STATUS_CSS, TYPE_META } from '../media.js';
import { renderAndBindUserListView } from './users.js';

export async function showCompareView(user)
{
  S.compareType = 'anime';
  S.compareTab  = 'both';
  const main = $('#main-content');
  main.innerHTML = '<div class="loader-wrap"><div class="spinner"></div></div>';
  try
  {
    S.compareData = await API.users.compare(user.id, 'anime');
    main.innerHTML = renderCompareView();
    bindCompareView();
  }
  catch (e)
  {
    main.innerHTML = renderEmptyState(
      '⚠️', 'Fehler beim Laden', esc(e.message),
      `<button class="btn btn-primary" id="btn-back-userlist">Zurück</button>`
    );
    $('#btn-back-userlist')?.addEventListener('click', () =>
      renderAndBindUserListView($('#main-content')));
  }
}

function renderCompareView()
{
  const u    = S.viewingUser;
  const me   = S.user;
  const d    = S.compareData || { both: [], onlyMe: [], onlyThem: [] };
  const type = S.compareType;
  const tab  = S.compareTab;

  const tabs = [
    { id: 'both',   label: `⚖️ Beide`,          count: d.both.length },
    { id: 'onlyMe', label: `👤 Nur ich`,         count: d.onlyMe.length },
    { id: 'onlyThem', label: `👤 Nur ${esc(u.username)}`, count: d.onlyThem.length },
  ];

  return `
    <div class="page-header">
      <div class="page-title-row">
        <button class="btn btn-ghost btn-sm" id="btn-back-compare">${IC.chevL} Zurück</button>
        <div>
          <div class="page-title">Vergleich</div>
          <div class="page-sub">${esc(me.username)} vs. ${esc(u.username)}</div>
        </div>
      </div>
    </div>

    <div class="type-toggle" style="margin-bottom:16px">
      ${Object.keys(TYPE_META).map(t => `
        <button class="type-btn${type===t?' active':''}" data-ctype="${t}">
          ${TYPE_META[t].emoji} ${TYPE_META[t].short}
        </button>`).join('')}
    </div>

    <div class="compare-summary">
      <div class="compare-summary-item">
        <div class="compare-summary-num">${d.both.length}</div>
        <div class="compare-summary-label">Gemeinsam</div>
      </div>
      <div class="compare-summary-sep">·</div>
      <div class="compare-summary-item">
        <div class="compare-summary-num">${d.onlyMe.length}</div>
        <div class="compare-summary-label">Nur du</div>
      </div>
      <div class="compare-summary-sep">·</div>
      <div class="compare-summary-item">
        <div class="compare-summary-num">${d.onlyThem.length}</div>
        <div class="compare-summary-label">Nur ${esc(u.username)}</div>
      </div>
    </div>

    <div class="status-tabs" style="margin-bottom:16px">
      ${tabs.map(t => `
        <button class="status-tab${tab===t.id?' active':''}" data-ctab="${t.id}">
          ${t.label}<span class="cnt">${t.count}</span>
        </button>`).join('')}
    </div>

    <div id="compare-content">${renderCompareContent()}</div>`;
}

function renderCompareContent()
{
  const d    = S.compareData || { both: [], onlyMe: [], onlyThem: [] };
  const tab  = S.compareTab;
  const type = S.compareType;
  const u    = S.viewingUser;
  const me   = S.user;

  if (tab === 'both')
  {
    if (!d.both.length)
    {
      return renderEmptyState('🤝', 'Noch nichts gemeinsam',
        `Ihr habt noch kein ${type==='anime'?'Anime':'Manga'} auf beiden Listen.`);
    }
    const cards = d.both.map(item =>
      renderCompareCard(item, type, me.username, u.username)
    ).join('');
    return `<div class="compare-list">${cards}</div>`;
  }
  if (tab === 'onlyMe')
  {
    if (!d.onlyMe.length)
    {
      return renderEmptyState('📋', 'Nichts exklusiv bei dir',
        `Alles was du hast, hat ${esc(u.username)} auch.`);
    }
    return `<div class="compare-list">${d.onlyMe.map(e => renderCompareSimpleCard(e, type)).join('')}</div>`;
  }
  if (!d.onlyThem.length)
  {
    return renderEmptyState('📋',
      `Nichts exklusiv bei ${esc(u.username)}`,
      `Alles was ${esc(u.username)} hat, hast du auch.`);
  }
  return `<div class="compare-list">${d.onlyThem.map(e => renderCompareSimpleCard(e, type)).join('')}</div>`;
}

function renderCompareCard(item, type, myName, theirName)
{
  const { media, me, them } = item;
  const isEpisodic = type === 'anime' || type === 'tv';
  const isMovie = type === 'movie';
  const total   = isEpisodic ? media.episodes : media.chapters;
  const myProg  = isEpisodic ? me.episode  : me.chapter;
  const thProg  = isEpisodic ? them.episode : them.chapter;
  const myPct   = total ? Math.round((myProg  / total) * 100) : 0;
  const thPct   = total ? Math.round((thProg  / total) * 100) : 0;
  const progLabel = isEpisodic ? 'Ep.' : 'Kap.';
  const totalTxt  = total ? `/${total}` : '';

  const sideHtml = (name, status, prog, pct, score) => `
    <div class="compare-side">
      <div class="compare-side-name">${esc(name)}</div>
      <span class="status-badge ${STATUS_CSS[status]||'status-default'}">${STATUS_LABELS[status]||status}</span>
      ${isMovie ? '' : `<div class="compare-side-prog">${progLabel} ${prog||0}${totalTxt}</div>`}
      ${score ? `<div class="compare-side-score">${IC.star} ${score}.0</div>` : ''}
      ${total && !isMovie
        ? `<div class="progress-bar" style="margin-top:4px">` +
          `<div class="progress-fill" style="width:${pct}%"></div></div>`
        : ''}
    </div>`;

  return `
    <div class="compare-card">
      <div class="compare-card-cover">${coverImg(media.image_url, media.title)}</div>
      <div class="compare-card-body">
        <div class="compare-card-title" title="${esc(media.title)}">${esc(media.title)}</div>
        <div class="compare-sides">
          ${sideHtml(myName,    me.status,   myProg, myPct, me.score)}
          <div class="compare-vs">vs</div>
          ${sideHtml(theirName, them.status, thProg, thPct, them.score)}
        </div>
      </div>
    </div>`;
}

function renderCompareSimpleCard(e, type)
{
  const isEpisodic = type === 'anime' || type === 'tv';
  const isMovie = type === 'movie';
  const total = isEpisodic ? e.episodes : e.chapters;
  const prog  = isEpisodic ? e.current_episode : e.current_chapter;
  const pct   = total ? Math.round((prog / total) * 100) : 0;
  return `
    <div class="compare-card">
      <div class="compare-card-cover">${coverImg(e.image_url, e.title)}</div>
      <div class="compare-card-body">
        <div class="compare-card-title" title="${esc(e.title)}">${esc(e.title)}</div>
        <div class="compare-sides" style="justify-content:flex-start;gap:0">
          <div class="compare-side" style="flex:unset;min-width:0">
            <span class="status-badge ${STATUS_CSS[e.list_status]||'status-default'}">
              ${STATUS_LABELS[e.list_status]||e.list_status}
            </span>
            ${isMovie ? '' : `<div class="compare-side-prog">${isEpisodic?'Ep.':'Kap.'} ${prog||0}${total?'/'+total:''}</div>`}
            ${e.user_score ? `<div class="compare-side-score">${IC.star} ${e.user_score}.0</div>` : ''}
            ${total
        ? `<div class="progress-bar" style="margin-top:4px">` +
          `<div class="progress-fill" style="width:${pct}%"></div></div>`
        : ''}
          </div>
        </div>
      </div>
    </div>`;
}

function bindCompareView()
{
  $('#btn-back-compare')?.addEventListener('click', () =>
  {
    renderAndBindUserListView($('#main-content'));
  });

  $$('.type-btn[data-ctype]').forEach(b =>
  {
    b.addEventListener('click', async () =>
    {
      S.compareType = b.dataset.ctype;
      S.compareTab  = 'both';
      const main = $('#main-content');
      main.innerHTML = '<div class="loader-wrap"><div class="spinner"></div></div>';
      try
      {
        S.compareData = await API.users.compare(
          S.viewingUser.id, S.compareType
        );
        main.innerHTML = renderCompareView();
        bindCompareView();
      }
      catch (e)
      {
        toast(e.message, 'error');
      }
    });
  });

  bindStatusTabs('.status-tab[data-ctab]', 'ctab', v =>
  {
    S.compareTab = v;
    $('#compare-content').innerHTML = renderCompareContent();
  });
}
