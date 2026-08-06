/* =====================================================
   AniGa – views/users.js
   Nutzerliste, Folgen, fremde Listen + Eintrags-Info-Modal
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, coverImg, debounce, toast, renderEmptyState, bindStatusTabs, bindViewToggle } from '../dom.js';
import { openModal, closeModal } from '../modal.js';
import { API } from '../api.js';
import {
  STATUS_LABELS, STATUS_CSS, ANIME_STATUSES, MANGA_STATUSES,
  starsHtml, progressText, progressPct, ownedBadgeHtml, ownedChipHtml
} from '../media.js';
import { navigate } from '../router.js';
import { showCompareView } from './compare.js';

export function renderUsersView()
{
  const filter = S.userListFilter.toLowerCase();
  const filtered = filter
    ? S.allUsers.filter(u => u.username.toLowerCase().includes(filter))
    : S.allUsers;

  return `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-icon">${IC.users}</div>
        <div>
          <div class="page-title">Nutzer</div>
          <div class="page-sub">${S.allUsers.length} Mitglieder registriert</div>
        </div>
      </div>
    </div>

    <div class="filter-bar" style="margin-bottom:16px">
      <input class="filter-input" id="user-search" type="text"
        placeholder="Benutzer suchen…" value="${esc(S.userListFilter)}"/>
    </div>

    ${filtered.length ? `
      <div class="user-list">
        ${filtered.map(u => renderUserCard(u)).join('')}
      </div>` : `
      ${renderEmptyState('👥',
        S.userListFilter ? 'Kein Benutzer gefunden' : 'Noch keine anderen Nutzer',
        S.userListFilter ? 'Probiere einen anderen Suchbegriff.' : 'Lade Freunde zu AniGa ein!')}`}`;
}

function renderUserCard(u)
{
  return `
    <div class="user-card" data-user-id="${u.id}">
      <div class="user-avatar">${(u.username||'?').substring(0,2).toUpperCase()}</div>
      <div class="user-card-info">
        <div class="user-card-name">${esc(u.username)}</div>
        <div class="user-card-counts">${u.animeCount} Anime · ${u.mangaCount} Manga</div>
      </div>
      <button class="btn-follow${u.isFollowing?' following':''}" data-uid="${u.id}">
        ${u.isFollowing ? 'Entfolgen' : 'Folgen'}
      </button>
    </div>`;
}

export function bindUsersView()
{
  const input = $('#user-search');
  input?.addEventListener('input', debounce(() =>
  {
    S.userListFilter = input.value;
    const filter = S.userListFilter.toLowerCase();
    const filtered = filter
      ? S.allUsers.filter(u => u.username.toLowerCase().includes(filter))
      : S.allUsers;
    const ul = $('.user-list');
    if (ul)
    {
      ul.innerHTML = filtered.map(u => renderUserCard(u)).join('');
      bindUserCards();
    }
    else
    {
      const main = $('#main-content');
      if (main)
      {
        main.innerHTML = renderUsersView();
        bindUsersView();
      }
    }
  }, 200));
  bindUserCards();
}

function bindUserCards()
{
  $$('.user-card').forEach(card =>
  {
    card.addEventListener('click', e =>
    {
      if (e.target.closest('.btn-follow'))
      {
        return;
      }
      const uid = +card.dataset.userId;
      const user = S.allUsers.find(u => u.id === uid);
      if (user)
      {
        showUserList(user);
      }
    });
  });
  $$('.btn-follow').forEach(btn =>
  {
    btn.addEventListener('click', async e =>
    {
      e.stopPropagation();
      const uid = +btn.dataset.uid;
      const wasFollowing = btn.classList.contains('following');
      btn.disabled = true;
      try
      {
        if (wasFollowing)
        {
          await API.users.unfollow(uid);
          btn.classList.remove('following');
          btn.textContent = 'Folgen';
          const u = S.allUsers.find(x => x.id === uid);
          if (u)
          {
            u.isFollowing = false;
          }
          toast('Nicht mehr gefolgt', 'info');
        }
        else
        {
          await API.users.follow(uid);
          btn.classList.add('following');
          btn.textContent = 'Entfolgen';
          const u = S.allUsers.find(x => x.id === uid);
          if (u)
          {
            u.isFollowing = true;
          }
          toast('Jetzt gefolgt! 🎉', 'success');
        }
      }
      catch (err)
      {
        toast(err.message, 'error');
      }
      btn.disabled = false;
    });
  });
}

export async function showUserList(user)
{
  S.viewingUser = user;
  S.userListType = 'anime';
  S.userListStatus = 'all';
  S.userListView = 'grid';
  const main = $('#main-content');
  main.innerHTML = '<div class="loader-wrap"><div class="spinner"></div></div>';
  try
  {
    S.viewingUserList = await API.users.getList(user.id, 'anime');
    main.innerHTML = renderUserListView();
    bindUserListView();
  }
  catch (e)
  {
    main.innerHTML = renderEmptyState(
      '⚠️', 'Fehler beim Laden', esc(e.message),
      `<button class="btn btn-primary" data-nav="users">Zurück</button>`
    );
  }
}

function renderUserListView()
{
  const u = S.viewingUser;
  const list = S.viewingUserList;
  const type = S.userListType;
  const curStatus = S.userListStatus;
  const curView = S.userListView;
  const counts = {};
  list.forEach(e =>
  {
    counts[e.list_status] = (counts[e.list_status]||0)+1;
  });
  const statuses = [
    {val:'all',label:'Alle'},
    ...(type==='anime'?ANIME_STATUSES:MANGA_STATUSES)
  ];
  const filtered = curStatus==='all'
    ? list
    : list.filter(e=>e.list_status===curStatus);

  return `
    <div class="user-list-header">
      <button class="btn btn-ghost btn-sm" id="btn-back-users">${IC.chevL} Zurück</button>
      <div class="user-avatar"
        style="width:40px;height:40px;font-size:1rem;flex-shrink:0">
        ${(u.username||'?').substring(0,2).toUpperCase()}
      </div>
      <div class="user-list-header-info">
        <div class="user-list-header-name">${esc(u.username)}</div>
        <div class="user-list-header-sub">${u.animeCount} Anime · ${u.mangaCount} Manga</div>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-compare-user"
        style="margin-left:auto;flex-shrink:0">⚖️ Vergleichen</button>
    </div>

    <div class="type-toggle" style="margin-bottom:16px">
      <button class="type-btn${type==='anime'?' active':''}" data-utype="anime">🎬 Anime</button>
      <button class="type-btn${type==='manga'?' active':''}" data-utype="manga">📚 Manga</button>
    </div>

    <div class="status-tabs">
      ${statuses.map(s=>`
        <button class="status-tab${curStatus===s.val?' active':''}" data-ustatus="${s.val}">
          ${s.label}<span class="cnt">${s.val==='all'?list.length:(counts[s.val]||0)}</span>
        </button>`).join('')}
    </div>

    <div class="filter-bar" style="margin-bottom:16px">
      <div style="flex:1"></div>
      <div class="view-toggle">
        <button class="view-btn${curView==='grid'?' active':''}" id="uvgrid" title="Raster">${IC.gridV}</button>
        <button class="view-btn${curView==='list'?' active':''}" id="uvlist" title="Liste">${IC.listV}</button>
      </div>
    </div>

    <div id="user-list-content">${renderUserListContent(filtered, curView)}</div>`;
}

function renderUserListContent(filtered, curView)
{
  if (!filtered.length)
  {
    return renderEmptyState(
      S.userListType==='anime'?'🎬':'📚', 'Keine Einträge',
      'Dieser Nutzer hat noch nichts in dieser Kategorie.');
  }
  return curView === 'grid'
    ? `<div class="media-grid">${filtered.map(e=>renderUserMediaCard(e)).join('')}</div>`
    : `<div class="list-grid">${filtered.map(e=>renderUserListCard(e)).join('')}</div>`;
}

function renderUserMediaCard(entry)
{
  const pct = progressPct(entry);
  return `
    <div class="media-card user-entry-card" data-entry-id="${entry.id}">
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
      </div>
      ${pct>0 ? `<div class="progress-bar"
        style="margin:-1px 0 0;border-radius:0 0 var(--r) var(--r)">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>` : ''}
    </div>`;
}

function renderUserListCard(e)
{
  const pct = progressPct(e);
  return `
    <div class="list-card user-entry-card" data-entry-id="${e.id}">
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

export function bindUserListView()
{
  $('#btn-back-users')?.addEventListener('click', () => navigate('users'));
  $('#btn-compare-user')?.addEventListener('click', () =>
    showCompareView(S.viewingUser));

  $$('.type-btn[data-utype]').forEach(b =>
  {
    b.addEventListener('click', async () =>
    {
      S.userListType = b.dataset.utype;
      S.userListStatus = 'all';
      const main = $('#main-content');
      main.innerHTML = '<div class="loader-wrap"><div class="spinner"></div></div>';
      try
      {
        S.viewingUserList = await API.users.getList(
          S.viewingUser.id, S.userListType
        );
        main.innerHTML = renderUserListView();
        bindUserListView();
      }
      catch (e)
      {
        toast(e.message, 'error');
      }
    });
  });

  bindStatusTabs('.status-tab[data-ustatus]', 'ustatus', v =>
  {
    S.userListStatus = v;
    refreshUserListContent();
  });
  bindViewToggle('#uvgrid', '#uvlist', v =>
  {
    S.userListView = v;
    refreshUserListContent();
  });

  bindUserEntryCards();
}

/* Wird vom Vergleichs-View für den Zurück-Button gebraucht */
export function renderAndBindUserListView(main)
{
  main.innerHTML = renderUserListView();
  bindUserListView();
}

function refreshUserListContent()
{
  const list = S.viewingUserList;
  const curStatus = S.userListStatus;
  const curView = S.userListView;
  const filtered = curStatus==='all'
    ? list
    : list.filter(e=>e.list_status===curStatus);
  const content = $('#user-list-content');
  if (content)
  {
    content.innerHTML = renderUserListContent(filtered, curView);
    bindUserEntryCards();
  }
}

function bindUserEntryCards()
{
  $$('.user-entry-card').forEach(card =>
  {
    card.addEventListener('click', () =>
    {
      const entryId = +card.dataset.entryId;
      const entry = S.viewingUserList.find(e => e.id === entryId);
      if (entry)
      {
        showUserInfoModal(entry);
      }
    });
  });
}

function showUserInfoModal(entry)
{
  const isAnime = entry.type === 'anime';
  const synopsis = entry.synopsis || '';

  const html = `
    <div class="modal-head">
      <h2>${esc(entry.title)}</h2>
      <button class="btn-modal-close" id="modal-close" aria-label="Schließen">${IC.x}</button>
    </div>
    <div class="modal-body">
      <div class="media-detail-hero">
        ${entry.image_url
          ? `<img class="media-detail-bg" src="${esc(entry.image_url)}" alt=""/>`
          : '<div style="height:130px;background:var(--bg3)"></div>'}
        <div class="media-detail-info">
          <div class="media-detail-cover">${coverImg(entry.image_url,entry.title)}</div>
          <div class="media-detail-titles">
            <div class="media-detail-title">${esc(entry.title)}</div>
            ${entry.title_english&&entry.title_english!==entry.title
              ?`<div class="media-detail-title-alt">${esc(entry.title_english)}</div>`:''}
          </div>
        </div>
      </div>

      <div class="media-meta">
        ${entry.api_score
          ? `<div class="meta-chip">${IC.star}` +
            `<span style="color:var(--star)">${Number(entry.api_score).toFixed(1)}</span> MAL</div>`
          : ''}
        ${isAnime&&entry.episodes?`<div class="meta-chip">${IC.play} ${entry.episodes} Folgen</div>`:''}
        ${!isAnime&&entry.chapters?`<div class="meta-chip">${IC.book} ${entry.chapters} Kapitel</div>`:''}
        ${!isAnime&&entry.volumes?`<div class="meta-chip">📦 ${entry.volumes} Bände</div>`:''}
        ${entry.year?`<div class="meta-chip">${IC.calendar} ${entry.year}</div>`:''}
      </div>

      ${entry.genres&&entry.genres.length?`
        <div class="genre-tags" style="margin-bottom:12px">
          ${entry.genres.slice(0,8).map(g=>`<span class="genre-tag">${esc(g)}</span>`).join('')}
        </div>`:''}

      ${synopsis?`
        <div style="margin-bottom:14px">
          <p class="synopsis-text" id="syn-text">${esc(synopsis)}</p>
          ${synopsis.length>220?`<button class="btn-synopsis" id="btn-expand">Mehr anzeigen</button>`:''}
        </div>`:''}

      <div class="divider"></div>
      <h3 style="font-size:.95rem;font-weight:700;margin-bottom:12px">
        ${esc(S.viewingUser?.username||'')}'s Eintrag
      </h3>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px">
        <span class="status-badge ${STATUS_CSS[entry.list_status]}">${STATUS_LABELS[entry.list_status]||''}</span>
        ${entry.user_score != null
          ? starsHtml(entry.user_score)
          : '<span style="color:var(--text3);font-size:.8rem">Keine Bewertung</span>'}
      </div>
      <div style="color:var(--text2);font-size:.88rem;margin-bottom:6px">${progressText(entry)}</div>
      ${entry.notes
        ? `<div style="background:var(--bg3);border:1px solid var(--border);` +
          `border-radius:var(--r-sm);padding:10px 13px;font-size:.85rem;` +
          `color:var(--text2);margin-top:10px;white-space:pre-wrap">` +
          `${esc(entry.notes)}</div>`
        : ''}
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" id="modal-cancel">Schließen</button>
    </div>`;

  openModal(html, () =>
  {
    $('#modal-close')?.addEventListener('click', closeModal);
    $('#modal-cancel')?.addEventListener('click', closeModal);
    $('#btn-expand')?.addEventListener('click', () =>
    {
      const st = $('#syn-text');
      const exp = st.classList.toggle('expanded');
      $('#btn-expand').textContent = exp
        ? 'Weniger anzeigen'
        : 'Mehr anzeigen';
    });
  });
}
