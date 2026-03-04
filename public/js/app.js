/* =====================================================
   AniGa – app.js  |  Hauptanwendung (SPA)
   ===================================================== */

/* ---- ICONS (inline SVG) ---- */
const IC = {
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  tv: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
  book: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  plus: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  logout: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  menu: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  gridV: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  listV: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  flame: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  play: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  chevR: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  chevL: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  warn: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  key: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
};

/* ---- STATE ---- */
const S = {
  user: null,
  token: localStorage.getItem('aniga_token'),
  view: 'home',
  animeList: [],
  mangaList: [],
  stats: null,
  searchType: 'anime',
  searchQ: '',
  searchPage: 1,
  searchResults: [],
  searchPagination: null,
  topAnime: [],
  topManga: [],
  seasonal: [],
  listStatus: { anime: 'all', manga: 'all' },
  listView: { anime: 'grid', manga: 'grid' },
  listFilter: { anime: '', manga: '' },
  allUsers: [],
  following: [],
  adminUsers: [],
  viewingUser: null,
  viewingUserList: [],
  userListFilter: '',
  userListType: 'anime',
  userListStatus: 'all',
  userListView: 'grid',
};

/* ---- HELPERS ---- */
const $ = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'Gerade eben';
  if (diff < 3600) return `vor ${Math.floor(diff/60)} Min.`;
  if (diff < 86400) return `vor ${Math.floor(diff/3600)} Std.`;
  if (diff < 604800) return `vor ${Math.floor(diff/86400)} Tagen`;
  return new Date(dateStr).toLocaleDateString('de-DE');
}

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function coverImg(url, title) {
  const safe = esc(title || '').substring(0, 12);
  if (url) {
    return `<img src="${esc(url)}" alt="${esc(title||'')}" loading="lazy"
      onerror="this.outerHTML='<div class=\\'no-cover\\'><span>🖼️</span><span>${safe}</span></div>'" />`;
  }
  return `<div class="no-cover"><span>🖼️</span><span>${safe}</span></div>`;
}

/* ---- STATUS MAPPING ---- */
const STATUS_LABELS = {
  watching:'Schaut gerade', reading:'Liest gerade',
  completed:'Abgeschlossen', on_hold:'Pausiert', dropped:'Abgebrochen',
  plan_to_watch:'Geplant', plan_to_read:'Geplant',
};
const STATUS_CSS = {
  watching:'s-watching', reading:'s-reading',
  completed:'s-completed', on_hold:'s-on_hold', dropped:'s-dropped',
  plan_to_watch:'s-plan_to_watch', plan_to_read:'s-plan_to_read',
};
const ANIME_STATUSES = [
  {val:'watching',label:'Schaut gerade'},{val:'plan_to_watch',label:'Geplant'},
  {val:'completed',label:'Abgeschlossen'},{val:'on_hold',label:'Pausiert'},{val:'dropped',label:'Abgebrochen'},
];
const MANGA_STATUSES = [
  {val:'reading',label:'Liest gerade'},{val:'plan_to_read',label:'Geplant'},
  {val:'completed',label:'Abgeschlossen'},{val:'on_hold',label:'Pausiert'},{val:'dropped',label:'Abgebrochen'},
];

function mediaStatusBadge(status) {
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

function starsHtml(score, sm='') {
  if (!score) return '';
  const n = Math.round(score);
  return `<div class="stars">${Array.from({length:5},(_,i)=>`<span class="star-btn${sm?' sm':''} ${i<n?'on':''}">${IC.star}</span>`).join('')}</div>`;
}

function progressText(e) {
  if (e.type === 'anime') {
    return `Ep. ${e.current_episode||0} / ${e.episodes||'?'}`;
  }
  let t = `Kap. ${e.current_chapter||0} / ${e.chapters||'?'}`;
  if (e.current_page) t += ` · S. ${e.current_page}`;
  return t;
}

function progressPct(e) {
  if (e.type === 'anime')
    return e.episodes ? Math.min(100, ((e.current_episode||0)/e.episodes)*100) : 0;
  return e.chapters ? Math.min(100, ((e.current_chapter||0)/e.chapters)*100) : 0;
}

function isInList(media) {
  if (!media.mal_id) return false;
  const list = media.type === 'anime' ? S.animeList : S.mangaList;
  return list.some(e => String(e.mal_id) === String(media.mal_id));
}

function findInList(media) {
  if (!media.mal_id) return null;
  const list = media.type === 'anime' ? S.animeList : S.mangaList;
  return list.find(e => String(e.mal_id) === String(media.mal_id)) || null;
}

function findMediaInCache(malId, type) {
  return [...S.searchResults, ...S.topAnime, ...S.topManga, ...S.seasonal]
    .find(m => String(m.mal_id) === String(malId) && m.type === type) || null;
}

function entryToMedia(entry) {
  return {
    mal_id: entry.mal_id, type: entry.type,
    title: entry.title, title_english: entry.title_english,
    title_japanese: entry.title_japanese,
    image_url: entry.image_url, synopsis: entry.synopsis,
    media_status: entry.media_status, episodes: entry.episodes,
    chapters: entry.chapters, volumes: entry.volumes,
    api_score: entry.api_score, genres: entry.genres || [],
    year: entry.year, season: entry.season,
    is_manual: entry.is_manual, source: entry.source,
  };
}

/* ---- TOAST ---- */
function toast(msg, type = 'info', title = '') {
  const iconMap = { success: IC.check, error: IC.x, warning: IC.warn, info: IC.info };
  const t = document.createElement('div');
  t.className = `toast t-${type}`;
  t.innerHTML = `<div class="toast-icon">${iconMap[type]||IC.info}</div>
    <div class="toast-content">
      ${title?`<div class="toast-title">${esc(title)}</div>`:''}
      <div class="toast-msg">${esc(msg)}</div>
    </div>`;
  document.getElementById('toasts').prepend(t);
  setTimeout(() => {
    t.style.opacity = '0'; t.style.transform = 'translateX(120%)';
    t.style.transition = 'all .2s'; setTimeout(() => t.remove(), 220);
  }, 3500);
}

/* ---- MODAL ---- */
let _modal = null;

function openModal(html, afterRender) {
  closeModal();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'modal-overlay';
  ov.innerHTML = `<div class="modal" id="modal-box">${html}</div>`;
  document.body.appendChild(ov);
  _modal = ov;
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });
  document.addEventListener('keydown', _modalKey);
  if (afterRender) afterRender();
}

function closeModal() {
  if (_modal) { _modal.remove(); _modal = null; }
  document.removeEventListener('keydown', _modalKey);
}

function _modalKey(e) { if (e.key === 'Escape') closeModal(); }

/* ================================================================
   SHELL (Sidebar + Header + Bottom Nav)
   ================================================================ */
function renderShell() {
  const v = S.view;
  const u = S.user || {};
  const initials = (u.username || '?').substring(0, 2).toUpperCase();
  const navItems = [
    { id:'home',    icon:IC.home,   label:'Übersicht' },
    { id:'search',  icon:IC.search, label:'Suche' },
    { id:'anime',   icon:IC.tv,     label:'Anime-Liste' },
    { id:'manga',   icon:IC.book,   label:'Manga-Liste' },
    { id:'users',   icon:IC.users,  label:'Nutzer' },
    { id:'profile', icon:IC.user,   label:'Profil' },
    ...(S.user?.is_admin ? [{ id:'admin', icon:IC.shield, label:'Admin', admin:true }] : []),
  ];

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <img src="/icons/logo.jpeg" class="logo-img" alt="AniGa Logo"/>
        <span class="logo-text">AniGa</span>
      </div>
      <nav class="sidebar-nav">
        ${navItems.map(n=>`
          <button class="nav-item${v===n.id?' active':''}${n.admin?' nav-item-admin':''}" data-nav="${n.id}">
            ${n.icon}<span>${n.label}</span>
          </button>`).join('')}
      </nav>
      <div class="sidebar-user">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${esc(u.username||'')}</div>
          <div class="user-email">${esc(u.email||'')}</div>
        </div>
        <button class="btn-logout" id="btn-logout" title="Abmelden">${IC.logout}</button>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <header class="mobile-header">
      <button class="btn-menu" id="btn-menu">${IC.menu}</button>
      <div class="mobile-logo">
        <img src="/icons/logo.jpeg" class="logo-img" alt="AniGa Logo" style="width:30px;height:30px;"/>
        <span class="logo-text">AniGa</span>
      </div>
      <div style="width:34px"></div>
    </header>
    <main class="main-content" id="main-content"></main>
    <nav class="bottom-nav">
      <div class="bottom-nav-inner">
        ${navItems.map(n=>`
          <button class="bottom-nav-item${v===n.id?' active':''}" data-nav="${n.id}">
            ${n.icon}<span>${n.label}</span>
          </button>`).join('')}
      </div>
    </nav>`;
}

function updateNav() {
  $$('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === S.view));
}

/* ================================================================
   ROUTER / NAVIGATION
   ================================================================ */
async function navigate(view) {
  S.view = view;
  updateNav();
  closeSidebar();
  const main = $('#main-content');
  if (!main) return;
  main.innerHTML = '<div class="loader-wrap"><div class="spinner"></div></div>';

  try {
    switch (view) {
      case 'home':
        await Promise.all([loadAllLists(), loadStats()]);
        main.innerHTML = renderHome(); bindHome(); break;
      case 'search':
        main.innerHTML = renderSearch(); bindSearch();
        if (!S.topAnime.length) loadTopContent(); break;
      case 'anime':
        S.animeList = await API.list.getAll('anime');
        main.innerHTML = renderList('anime'); bindList('anime'); break;
      case 'manga':
        S.mangaList = await API.list.getAll('manga');
        main.innerHTML = renderList('manga'); bindList('manga'); break;
      case 'profile':
        S.stats = await API.list.getStats();
        main.innerHTML = renderProfile(); bindProfile(); break;
      case 'admin':
        if (!S.user?.is_admin) { navigate('home'); return; }
        S.adminUsers = await API.admin.getUsers();
        main.innerHTML = renderAdminView();
        bindAdminView();
        break;
      case 'users':
        [S.allUsers, S.following] = await Promise.all([
          API.users.getAll(),
          API.users.getFollowing()
        ]);
        S.viewingUser = null;
        S.userListFilter = '';
        main.innerHTML = renderUsersView();
        bindUsersView();
        break;
    }
  } catch (e) {
    main.innerHTML = `<div class="empty-state">
      <div class="empty-state-emoji">⚠️</div>
      <h3>Fehler beim Laden</h3><p>${esc(e.message)}</p>
      <button class="btn btn-primary" onclick="navigate('${view}')">Nochmal versuchen</button>
    </div>`;
  }
}

async function loadAllLists() {
  const [a, m] = await Promise.all([API.list.getAll('anime'), API.list.getAll('manga')]);
  S.animeList = a; S.mangaList = m;
}

async function loadStats() {
  S.stats = await API.list.getStats();
}

async function loadTopContent() {
  try {
    const [ta, tm, sea] = await Promise.all([
      API.search.topAnime(), API.search.topManga(), API.search.seasonal()
    ]);
    S.topAnime = ta.results || [];
    S.topManga = tm.results || [];
    S.seasonal = sea.results || [];
    if (S.view === 'search') {
      const main = $('#main-content');
      if (main && !S.searchQ) {
        main.innerHTML = renderSearch(); bindSearch();
      }
    }
  } catch (e) { console.warn('Top-Inhalte nicht geladen:', e.message); }
}

function closeSidebar() {
  $('#sidebar')?.classList.remove('open');
  $('#sidebar-overlay')?.classList.remove('open');
}

/* ================================================================
   VIEW: AUTH
   ================================================================ */
function renderAuthView() {
  return `<div class="auth-wrap">
    <div class="auth-box">
      <div class="auth-logo">
        <img src="/icons/logo.jpeg" class="logo-img" alt="AniGa Logo" style="width:56px;height:56px;margin:0 auto 10px;display:block;"/>
        <h1>AniGa</h1>
        <p>Dein persönlicher Anime &amp; Manga Tracker</p>
      </div>
      <div class="auth-tabs">
        <button class="auth-tab active" id="tab-login">Anmelden</button>
        <button class="auth-tab" id="tab-register">Registrieren</button>
      </div>
      <div id="auth-form-wrap">${loginFormHtml()}</div>
    </div>
  </div>`;
}

function loginFormHtml() {
  return `<form id="login-form">
    <div class="form-group">
      <label class="form-label">E-Mail</label>
      <input class="form-input" type="email" name="email" placeholder="name@beispiel.de" required autocomplete="email"/>
    </div>
    <div class="form-group">
      <label class="form-label">Passwort</label>
      <input class="form-input" type="password" name="password" placeholder="Passwort" required autocomplete="current-password"/>
    </div>
    <div class="form-error" id="login-error"></div>
    <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-top:6px">Anmelden</button>
  </form>`;
}

function registerFormHtml() {
  return `<form id="register-form">
    <div class="form-group">
      <label class="form-label">Benutzername</label>
      <input class="form-input" type="text" name="username" placeholder="Mindestens 3 Zeichen" required minlength="3" autocomplete="username"/>
    </div>
    <div class="form-group">
      <label class="form-label">E-Mail</label>
      <input class="form-input" type="email" name="email" placeholder="name@beispiel.de" required autocomplete="email"/>
    </div>
    <div class="form-group">
      <label class="form-label">Passwort</label>
      <input class="form-input" type="password" name="password" placeholder="Mindestens 6 Zeichen" required minlength="6" autocomplete="new-password"/>
    </div>
    <div class="form-group">
      <label class="form-label">Passwort bestätigen</label>
      <input class="form-input" type="password" name="confirm" placeholder="Passwort wiederholen" required autocomplete="new-password"/>
    </div>
    <div class="form-error" id="register-error"></div>
    <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-top:6px">Konto erstellen</button>
  </form>`;
}

function bindAuth() {
  const app = document.getElementById('app');
  app.innerHTML = renderAuthView();

  $('#tab-login').addEventListener('click', () => {
    $('#tab-login').classList.add('active');
    $('#tab-register').classList.remove('active');
    $('#auth-form-wrap').innerHTML = loginFormHtml();
    bindLoginForm();
  });
  $('#tab-register').addEventListener('click', () => {
    $('#tab-register').classList.add('active');
    $('#tab-login').classList.remove('active');
    $('#auth-form-wrap').innerHTML = registerFormHtml();
    bindRegisterForm();
  });
  bindLoginForm();
}

function bindLoginForm() {
  const form = $('#login-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const errEl = $('#login-error');
    const btn = form.querySelector('button[type=submit]');
    errEl.classList.remove('show'); btn.disabled = true; btn.textContent = 'Anmelden…';
    try {
      const { token, user } = await API.auth.login(fd.get('email'), fd.get('password'));
      localStorage.setItem('aniga_token', token);
      S.token = token; S.user = user;
      initApp();
    } catch (err) {
      errEl.textContent = err.message; errEl.classList.add('show');
      btn.disabled = false; btn.textContent = 'Anmelden';
    }
  });
}

function bindRegisterForm() {
  const form = $('#register-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const errEl = $('#register-error');
    const btn = form.querySelector('button[type=submit]');
    errEl.classList.remove('show');
    if (fd.get('password') !== fd.get('confirm')) {
      errEl.textContent = 'Passwörter stimmen nicht überein';
      errEl.classList.add('show'); return;
    }
    btn.disabled = true; btn.textContent = 'Registrieren…';
    try {
      const { token, user } = await API.auth.register(fd.get('username'), fd.get('email'), fd.get('password'));
      localStorage.setItem('aniga_token', token);
      S.token = token; S.user = user;
      initApp();
    } catch (err) {
      errEl.textContent = err.message; errEl.classList.add('show');
      btn.disabled = false; btn.textContent = 'Konto erstellen';
    }
  });
}

/* ================================================================
   VIEW: HOME / DASHBOARD
   ================================================================ */
function renderHome() {
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
      <div class="stat-card"><div class="stat-num">${a.total||0}</div><div class="stat-label">Anime gesamt</div></div>
      <div class="stat-card"><div class="stat-num">${a.total_episodes||0}</div><div class="stat-label">Episoden gesehen</div></div>
      <div class="stat-card"><div class="stat-num">${m.total||0}</div><div class="stat-label">Manga gesamt</div></div>
      <div class="stat-card"><div class="stat-num">${m.total_chapters||0}</div><div class="stat-label">Kapitel gelesen</div></div>
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
                  ${e.user_score?` &nbsp;·&nbsp;${starsHtml(e.user_score,true)}`:''}
                </div>
              </div>
              <div class="recent-updated">${timeAgo(e.updated_at)}</div>
            </div>`).join('')}
        </div>` : `
        <div class="empty-state">
          <div class="empty-state-emoji">🌸</div>
          <h3>Noch nichts in deiner Liste</h3>
          <p>Suche nach Animes und Mangas und starte deinen Tracker!</p>
          <button class="btn btn-primary" data-nav="search">${IC.search} Jetzt suchen</button>
        </div>`}
    </div>`;
}

function bindHome() {
  $$('[data-nav]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.nav)));
  $$('.recent-item').forEach(el => {
    el.addEventListener('click', () => {
      const type = el.dataset.type;
      const entry = (type==='anime'?S.animeList:S.mangaList).find(e=>e.id==el.dataset.entryId);
      if (entry) showTrackModal(entryToMedia(entry), entry);
    });
  });
  $$('.media-card').forEach(c => bindMediaCard(c));
}

/* ================================================================
   VIEW: SEARCH
   ================================================================ */
function renderSearch() {
  const hasResults = S.searchResults.length > 0 && S.searchQ;
  return `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-icon">${IC.search}</div>
        <div>
          <div class="page-title">Suche</div>
          <div class="page-sub">Anime &amp; Manga entdecken</div>
        </div>
      </div>
    </div>
    <div class="type-toggle">
      <button class="type-btn${S.searchType==='anime'?' active':''}" data-type="anime">🎬 Anime</button>
      <button class="type-btn${S.searchType==='manga'?' active':''}" data-type="manga">📚 Manga</button>
    </div>
    <div class="search-bar">
      <input class="search-input" id="search-input" type="text"
        placeholder="${S.searchType==='anime'?'Anime suchen…':'Manga suchen…'}"
        value="${esc(S.searchQ)}" autocomplete="off" />
      <button class="search-submit" id="search-submit">${IC.search} Suchen</button>
    </div>
    <div id="search-results">${hasResults ? renderSearchResults() : renderSearchDefault()}</div>`;
}

function renderSearchDefault() {
  const loading = !S.topAnime.length && !S.topManga.length;
  if (loading) return '<div class="loader-wrap"><div class="spinner"></div></div>';
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
    <div style="text-align:center;margin-top:20px">
      <p class="text-muted" style="font-size:.85rem;margin-bottom:10px">Nicht gefunden?</p>
      <button class="btn btn-secondary" id="btn-manual">Manuell eintragen</button>
    </div>`;
}

function renderSearchResults() {
  const pag = S.searchPagination;
  return `
    <div class="section-head" style="margin-bottom:14px">
      <div class="section-title">Ergebnisse für „${esc(S.searchQ)}"</div>
      <span class="text-muted" style="font-size:.82rem">${S.searchResults.length} Treffer</span>
    </div>
    ${S.searchResults.length ? `<div class="media-grid">${S.searchResults.map(renderMediaCard).join('')}</div>` : `
      <div class="empty-state">
        <div class="empty-state-emoji">🔍</div>
        <h3>Keine Ergebnisse</h3>
        <p>Versuche einen anderen Suchbegriff oder trage es manuell ein.</p>
      </div>`}
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

function bindSearch() {
  const input = $('#search-input');
  $('#search-submit')?.addEventListener('click', doSearch);
  input?.addEventListener('keydown', e => { if (e.key==='Enter') doSearch(); });

  $$('.type-btn').forEach(b => {
    b.addEventListener('click', () => {
      S.searchType = b.dataset.type;
      S.searchQ = ''; S.searchResults = []; S.searchPage = 1;
      $$('.type-btn').forEach(x => x.classList.toggle('active', x===b));
      if (input) input.placeholder = S.searchType==='anime' ? 'Anime suchen…' : 'Manga suchen…';
      $('#search-results').innerHTML = renderSearchDefault();
      bindSearchResults();
    });
  });
  bindSearchResults();
}

function bindSearchResults() {
  $$('.media-card').forEach(c => bindMediaCard(c));
  $('#btn-manual')?.addEventListener('click', () => showManualModal(S.searchType));
  $('#btn-prev')?.addEventListener('click', () => { S.searchPage = Math.max(1,S.searchPage-1); doSearch(); });
  $('#btn-next')?.addEventListener('click', () => { S.searchPage++; doSearch(); });
}

async function doSearch() {
  const q = $('#search-input')?.value.trim();
  if (!q) return;
  S.searchQ = q;
  const res = $('#search-results');
  res.innerHTML = '<div class="loader-wrap"><div class="spinner"></div></div>';
  try {
    const fn = S.searchType === 'anime' ? API.search.anime : API.search.manga;
    const data = await fn(q, S.searchPage);
    S.searchResults = data.results || [];
    S.searchPagination = data.pagination || null;
    res.innerHTML = renderSearchResults();
    bindSearchResults();
  } catch (e) {
    res.innerHTML = `<div class="empty-state"><div class="empty-state-emoji">⚠️</div><h3>Suche fehlgeschlagen</h3><p>${esc(e.message)}</p></div>`;
  }
}

/* ================================================================
   VIEW: ANIME / MANGA LIST
   ================================================================ */
function renderList(type) {
  const list = type === 'anime' ? S.animeList : S.mangaList;
  const curStatus = S.listStatus[type] || 'all';
  const curView = S.listView[type] || 'grid';
  const curFilter = S.listFilter[type] || '';
  const counts = {};
  list.forEach(e => { counts[e.list_status] = (counts[e.list_status]||0)+1; });
  const statuses = [{val:'all',label:'Alle'}, ...(type==='anime'?ANIME_STATUSES:MANGA_STATUSES)];

  let filtered = curStatus==='all' ? list : list.filter(e=>e.list_status===curStatus);
  if (curFilter) {
    const q = curFilter.toLowerCase();
    filtered = filtered.filter(e=>
      e.title.toLowerCase().includes(q)||(e.title_english||'').toLowerCase().includes(q));
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

function renderListContent(filtered, curView, type) {
  if (!filtered.length) {
    return `<div class="empty-state">
      <div class="empty-state-emoji">${type==='anime'?'🎬':'📚'}</div>
      <h3>Keine Einträge${S.listFilter[type]?' für diesen Filter':''}</h3>
      <p>${S.listFilter[type]?'Probiere einen anderen Filter.':'Füge über die Suche neue Einträge hinzu!'}</p>
      <button class="btn btn-primary" id="go-search-btn">${IC.search} Suche</button>
    </div>`;
  }
  return curView === 'grid'
    ? `<div class="media-grid">${filtered.map(e=>renderMediaCardFromEntry(e)).join('')}</div>`
    : `<div class="list-grid">${filtered.map(e=>renderListCard(e)).join('')}</div>`;
}

function renderListCard(e) {
  const pct = progressPct(e);
  return `
    <div class="list-card card" data-entry-id="${e.id}" data-type="${e.type}">
      <div class="list-card-cover">${coverImg(e.image_url,e.title)}</div>
      <div class="list-card-body">
        <div class="list-card-title" title="${esc(e.title)}">${esc(e.title)}</div>
        <div class="list-card-row">
          <span class="status-badge ${STATUS_CSS[e.list_status]}">${STATUS_LABELS[e.list_status]||''}</span>
          ${e.user_score?starsHtml(e.user_score,true):''}
        </div>
        <div class="list-card-progress">${progressText(e)}</div>
        ${pct>0?`<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`:''}
      </div>
    </div>`;
}

function bindList(type) {
  $$('.status-tab').forEach(t => {
    t.addEventListener('click', () => {
      S.listStatus[type] = t.dataset.status;
      $$('.status-tab').forEach(x => x.classList.toggle('active', x===t));
      refreshListContent(type);
    });
  });

  const filterInput = $('#list-filter');
  filterInput?.addEventListener('input', debounce(() => {
    S.listFilter[type] = filterInput.value;
    refreshListContent(type);
  }, 250));

  $('#vgrid')?.addEventListener('click', () => { S.listView[type]='grid'; $('#vgrid').classList.add('active'); $('#vlist').classList.remove('active'); refreshListContent(type); });
  $('#vlist')?.addEventListener('click', () => { S.listView[type]='list'; $('#vlist').classList.add('active'); $('#vgrid').classList.remove('active'); refreshListContent(type); });

  $('#btn-add-new')?.addEventListener('click', () => { S.searchType=type; navigate('search'); });
  bindListCards();
}

function refreshListContent(type) {
  const list = type==='anime' ? S.animeList : S.mangaList;
  const curStatus = S.listStatus[type]||'all';
  const curView = S.listView[type]||'grid';
  const curFilter = S.listFilter[type]||'';

  let filtered = curStatus==='all' ? list : list.filter(e=>e.list_status===curStatus);
  if (curFilter) {
    const q = curFilter.toLowerCase();
    filtered = filtered.filter(e=>e.title.toLowerCase().includes(q)||(e.title_english||'').toLowerCase().includes(q));
  }

  const content = $('#list-content');
  if (content) {
    content.innerHTML = renderListContent(filtered, curView, type);
    bindListCards();
    $('#go-search-btn')?.addEventListener('click', () => navigate('search'));
  }
}

function bindListCards() {
  $$('.media-card').forEach(c => bindMediaCard(c));
  $$('.list-card').forEach(c => {
    c.addEventListener('click', () => {
      const type = c.dataset.type;
      const entry = (type==='anime'?S.animeList:S.mangaList).find(e=>e.id==c.dataset.entryId);
      if (entry) showTrackModal(entryToMedia(entry), entry);
    });
  });
}

/* ================================================================
   VIEW: PROFILE
   ================================================================ */
function renderProfile() {
  const u = S.user || {};
  const a = S.stats?.anime || {};
  const m = S.stats?.manga || {};
  const joined = u.created_at ? new Date(u.created_at).toLocaleDateString('de-DE') : '';

  return `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-icon">${IC.user}</div>
        <div><div class="page-title">Profil</div><div class="page-sub">Deine Statistiken &amp; Konto</div></div>
      </div>
    </div>

    <div class="profile-hero">
      <div class="profile-avatar">${(u.username||'?').substring(0,2).toUpperCase()}</div>
      <div>
        <div class="profile-name">${esc(u.username||'')}</div>
        <div class="profile-email">${esc(u.email||'')}</div>
        ${joined?`<div class="profile-joined">Mitglied seit ${joined}</div>`:''}
      </div>
    </div>

    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card"><div class="stat-num">${a.total||0}</div><div class="stat-label">Anime gesamt</div></div>
      <div class="stat-card"><div class="stat-num">${a.total_episodes||0}</div><div class="stat-label">Episoden gesehen</div></div>
      <div class="stat-card"><div class="stat-num">${a.completed||0}</div><div class="stat-label">Anime abgeschlossen</div></div>
      <div class="stat-card"><div class="stat-num">${m.total||0}</div><div class="stat-label">Manga gesamt</div></div>
      <div class="stat-card"><div class="stat-num">${m.total_chapters||0}</div><div class="stat-label">Kapitel gelesen</div></div>
      <div class="stat-card"><div class="stat-num">${m.completed||0}</div><div class="stat-label">Manga abgeschlossen</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px">
      <div class="stats-detail">
        <h3>${IC.tv} Anime</h3>
        <div class="stats-row">
          ${[['Schaut gerade',a.watching||0,'#00e5ff'],['Abgeschlossen',a.completed||0,'#4caf50'],
             ['Geplant',a.plan_to_watch||0,'#7c4dff'],['Pausiert',a.on_hold||0,'#ff9800'],
             ['Abgebrochen',a.dropped||0,'#ef5350']].map(([l,v,c])=>`
            <div class="stats-item">
              <span class="stats-item-label"><span class="stats-dot" style="background:${c}"></span>${l}</span>
              <span class="stats-item-val">${v}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="stats-detail">
        <h3>${IC.book} Manga</h3>
        <div class="stats-row">
          ${[['Liest gerade',m.reading||0,'#00e5ff'],['Abgeschlossen',m.completed||0,'#4caf50'],
             ['Geplant',m.plan_to_read||0,'#7c4dff'],['Pausiert',m.on_hold||0,'#ff9800'],
             ['Abgebrochen',m.dropped||0,'#ef5350']].map(([l,v,c])=>`
            <div class="stats-item">
              <span class="stats-item-label"><span class="stats-dot" style="background:${c}"></span>${l}</span>
              <span class="stats-item-val">${v}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <button class="btn btn-danger" id="btn-logout-profile">${IC.logout} Abmelden</button>`;
}

function bindProfile() {
  $('#btn-logout-profile')?.addEventListener('click', logout);
}

/* ================================================================
   MEDIA CARD COMPONENTS
   ================================================================ */
function renderMediaCard(media) {
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
        <span class="media-card-type">${media.type==='anime'?'Anime':'Manga'}${media.year?' · '+media.year:''}</span>
        <button class="btn-add-to-list${inList?' in-list':''}" title="${inList?'Bearbeiten':'Hinzufügen'}">
          ${inList?IC.check:IC.plus}
        </button>
      </div>
    </div>`;
}

function renderMediaCardFromEntry(entry) {
  const pct = progressPct(entry);
  return `
    <div class="media-card" data-entry-id="${entry.id}" data-type="${entry.type}">
      <div class="media-card-cover">
        ${coverImg(entry.image_url, entry.title)}
        ${entry.user_score?`<div class="media-card-score">${IC.star}${entry.user_score}.0</div>`:''}
        <div class="media-card-badge">
          <span class="status-badge ${STATUS_CSS[entry.list_status]}">${STATUS_LABELS[entry.list_status]||''}</span>
        </div>
        <div class="media-card-overlay">
          <div class="media-card-title">${esc(entry.title)}</div>
        </div>
      </div>
      <div class="media-card-footer">
        <span class="media-card-type">${progressText(entry)}</span>
        <button class="btn-add-to-list in-list" title="Bearbeiten">${IC.edit}</button>
      </div>
      ${pct>0?`<div class="progress-bar" style="margin:-1px 0 0;border-radius:0 0 var(--r) var(--r)"><div class="progress-fill" style="width:${pct}%"></div></div>`:''}
    </div>`;
}

function bindMediaCard(card) {
  card.addEventListener('click', async () => {
    const entryId = card.dataset.entryId;
    const malId = card.dataset.malId;
    const type = card.dataset.type;

    if (entryId) {
      const entry = (type==='anime'?S.animeList:S.mangaList).find(e=>e.id==entryId);
      if (entry) showTrackModal(entryToMedia(entry), entry);
      return;
    }
    if (!malId) return;

    let media = findMediaInCache(malId, type);
    if (!media) {
      try {
        const fn = type==='anime' ? API.search.getAnime : API.search.getManga;
        media = await fn(malId);
      } catch { toast('Details konnten nicht geladen werden', 'error'); return; }
    }
    const existing = findInList(media);
    showTrackModal(media, existing);
  });
}

/* ================================================================
   MODAL: TRACKING (Add / Edit)
   ================================================================ */
function showTrackModal(media, existingEntry) {
  const isAnime = media.type === 'anime';
  const statuses = isAnime ? ANIME_STATUSES : MANGA_STATUSES;
  const entry = existingEntry || {};
  const curStatus = entry.list_status || (isAnime ? 'watching' : 'reading');
  const synopsis = media.synopsis || '';
  const maxEp = media.episodes || 99999;
  const maxCh = media.chapters || 99999;

  const html = `
    <div class="modal-head">
      <h2>${existingEntry ? 'Eintrag bearbeiten' : 'Zur Liste hinzufügen'}</h2>
      <button class="btn-modal-close" id="modal-close">${IC.x}</button>
    </div>
    <div class="modal-body">
      <div class="media-detail-hero">
        ${media.image_url
          ? `<img class="media-detail-bg" src="${esc(media.image_url)}" alt=""/>`
          : '<div style="height:130px;background:var(--bg3)"></div>'}
        <div class="media-detail-info">
          <div class="media-detail-cover">${coverImg(media.image_url,media.title)}</div>
          <div class="media-detail-titles">
            <div class="media-detail-title">${esc(media.title)}</div>
            ${media.title_english&&media.title_english!==media.title
              ?`<div class="media-detail-title-alt">${esc(media.title_english)}</div>`:''}
          </div>
        </div>
      </div>

      <div class="media-meta">
        ${media.api_score?`<div class="meta-chip">${IC.star}<span style="color:var(--star)">${media.api_score.toFixed(1)}</span> MAL</div>`:''}
        ${isAnime&&media.episodes?`<div class="meta-chip">${IC.play} ${media.episodes} Folgen</div>`:''}
        ${!isAnime&&media.chapters?`<div class="meta-chip">${IC.book} ${media.chapters} Kapitel</div>`:''}
        ${!isAnime&&media.volumes?`<div class="meta-chip">📦 ${media.volumes} Bände</div>`:''}
        ${media.media_status?`<div class="meta-chip">${IC.info} ${esc(media.media_status)}</div>`:''}
        ${media.year?`<div class="meta-chip">${IC.calendar} ${media.year}</div>`:''}
      </div>

      ${media.genres&&media.genres.length?`
        <div class="genre-tags" style="margin-bottom:12px">
          ${media.genres.slice(0,8).map(g=>`<span class="genre-tag">${esc(g)}</span>`).join('')}
        </div>`:'' }

      ${synopsis?`
        <div style="margin-bottom:14px">
          <p class="synopsis-text" id="syn-text">${esc(synopsis)}</p>
          ${synopsis.length>220?`<button class="btn-synopsis" id="btn-expand">Mehr anzeigen</button>`:''}
        </div>`:''}

      <div class="divider"></div>
      <h3 style="font-size:.95rem;font-weight:700;margin-bottom:14px">Meine Liste</h3>

      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-input" id="track-status">
          ${statuses.map(s=>`<option value="${s.val}"${curStatus===s.val?' selected':''}>${s.label}</option>`).join('')}
        </select>
      </div>

      ${isAnime ? `
        <div class="form-group">
          <label class="form-label">Aktuelle Episode${media.episodes?' / '+media.episodes:''}</label>
          <div class="num-input-wrap">
            <button class="num-btn" id="ep-m">−</button>
            <input class="num-input" type="number" id="track-ep" min="0" max="${maxEp}" value="${entry.current_episode||0}"/>
            <button class="num-btn" id="ep-p">+</button>
          </div>
        </div>` : `
        <div class="form-group">
          <label class="form-label">Aktuelles Kapitel${media.chapters?' / '+media.chapters:''}</label>
          <div class="num-input-wrap">
            <button class="num-btn" id="ch-m">−</button>
            <input class="num-input" type="number" id="track-ch" min="0" max="${maxCh}" value="${entry.current_chapter||0}"/>
            <button class="num-btn" id="ch-p">+</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Aktuelle Seite</label>
          <div class="num-input-wrap">
            <button class="num-btn" id="pg-m">−</button>
            <input class="num-input" type="number" id="track-pg" min="0" value="${entry.current_page||0}"/>
            <button class="num-btn" id="pg-p">+</button>
          </div>
        </div>`}

      <div class="form-group">
        <label class="form-label">Meine Bewertung</label>
        <div class="stars" id="star-rating">
          ${Array.from({length:5},(_,i)=>`
            <button class="star-btn ${i<(entry.user_score||0)?'on':''}" data-star="${i+1}">${IC.star}</button>
          `).join('')}
        </div>
        <input type="hidden" id="track-score" value="${entry.user_score||0}"/>
      </div>

      <div class="form-group">
        <label class="form-label">Notizen (optional)</label>
        <textarea class="form-input" id="track-notes" rows="2" placeholder="Deine Gedanken…">${esc(entry.notes||'')}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Startdatum</label>
          <input class="form-input" type="date" id="track-start" value="${entry.started_at||''}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Enddatum</label>
          <input class="form-input" type="date" id="track-end" value="${entry.completed_at||''}"/>
        </div>
      </div>
    </div>

    <div class="modal-foot">
      ${existingEntry?`<button class="btn btn-danger btn-sm" id="btn-delete">${IC.trash} Entfernen</button>`:''}
      <div style="flex:1"></div>
      <button class="btn btn-secondary" id="modal-cancel">Abbrechen</button>
      <button class="btn btn-primary" id="btn-save">${IC.check} Speichern</button>
    </div>`;

  openModal(html, () => {
    $('#modal-close')?.addEventListener('click', closeModal);
    $('#modal-cancel')?.addEventListener('click', closeModal);

    // Synopsis expand
    $('#btn-expand')?.addEventListener('click', () => {
      const st = $('#syn-text');
      const exp = st.classList.toggle('expanded');
      $('#btn-expand').textContent = exp ? 'Weniger anzeigen' : 'Mehr anzeigen';
    });

    // Number inputs helper
    function bindNum(mId, pId, inputId, min=0, max=99999) {
      const inp = document.getElementById(inputId);
      if (!inp) return;
      document.getElementById(mId)?.addEventListener('click',()=>{ inp.value=Math.max(min,+inp.value-1); });
      document.getElementById(pId)?.addEventListener('click',()=>{ inp.value=Math.min(max,+inp.value+1); });
    }
    if (isAnime) bindNum('ep-m','ep-p','track-ep',0,maxEp);
    else { bindNum('ch-m','ch-p','track-ch',0,maxCh); bindNum('pg-m','pg-p','track-pg'); }

    // Auto-fill auf Maximum wenn Status → Abgeschlossen
    $('#track-status')?.addEventListener('change', () => {
      if ($('#track-status').value !== 'completed') return;
      if (isAnime && maxEp < 99999) {
        const epInp = $('#track-ep');
        if (epInp) epInp.value = maxEp;
      } else if (!isAnime && maxCh < 99999) {
        const chInp = $('#track-ch');
        if (chInp) chInp.value = maxCh;
      }
    });

    // Star rating
    const stars = $$('.star-btn', $('#star-rating'));
    const scoreInp = $('#track-score');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = +star.dataset.star;
        const cur = +scoreInp.value;
        const nv = cur===val ? 0 : val;
        scoreInp.value = nv;
        stars.forEach((s,j) => s.classList.toggle('on', j<nv));
      });
      star.addEventListener('mouseenter', () => {
        const val = +star.dataset.star;
        stars.forEach((s,j) => s.classList.toggle('on', j<val));
      });
    });
    document.getElementById('star-rating')?.addEventListener('mouseleave', () => {
      const cur = +scoreInp.value;
      stars.forEach((s,j) => s.classList.toggle('on', j<cur));
    });

    // Save
    $('#btn-save')?.addEventListener('click', async () => {
      const btn = $('#btn-save');
      btn.disabled = true; btn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px"></div>`;
      try {
        const listData = {
          listStatus: $('#track-status').value,
          currentEpisode: isAnime ? +($('#track-ep')?.value||0) : 0,
          currentChapter: !isAnime ? +($('#track-ch')?.value||0) : 0,
          currentPage: !isAnime ? +($('#track-pg')?.value||0) : 0,
          userScore: +($('#track-score').value)||null,
          notes: $('#track-notes').value.trim()||null,
          startedAt: $('#track-start').value||null,
          completedAt: $('#track-end').value||null,
        };
        if (existingEntry) {
          await API.list.update(existingEntry.id, listData);
          toast('Eintrag aktualisiert!', 'success');
        } else {
          await API.list.save(media, listData);
          toast(`„${media.title}" zur Liste hinzugefügt!`, 'success');
        }
        closeModal();
        await refreshAfterSave(media.type);
      } catch (e) {
        toast(e.message, 'error', 'Fehler beim Speichern');
        btn.disabled = false; btn.innerHTML = `${IC.check} Speichern`;
      }
    });

    // Delete
    $('#btn-delete')?.addEventListener('click', async () => {
      if (!confirm(`„${media.title}" aus der Liste entfernen?`)) return;
      try {
        await API.list.remove(existingEntry.id);
        toast('Aus der Liste entfernt', 'success');
        closeModal();
        await refreshAfterSave(media.type);
      } catch (e) { toast(e.message, 'error'); }
    });
  });
}

async function refreshAfterSave(type) {
  if (type === 'anime') S.animeList = await API.list.getAll('anime');
  else S.mangaList = await API.list.getAll('manga');
  S.stats = await API.list.getStats();
  if (S.view === 'home') { navigate('home'); return; }
  if (S.view === type) { navigate(type); return; }
  // Update add-buttons in search view
  $$('.btn-add-to-list').forEach(btn => {
    const card = btn.closest('.media-card');
    if (!card || !card.dataset.malId) return;
    const ctype = card.dataset.type;
    if (ctype === type) {
      const inList = (type==='anime'?S.animeList:S.mangaList).some(e=>String(e.mal_id)===card.dataset.malId);
      btn.classList.toggle('in-list', inList);
      btn.innerHTML = inList ? IC.check : IC.plus;
    }
  });
}

/* ================================================================
   MODAL: MANUAL ENTRY
   ================================================================ */
function showManualModal(type = 'anime') {
  let curType = type;

  const html = `
    <div class="modal-head">
      <h2>Manuell eintragen</h2>
      <button class="btn-modal-close" id="modal-close">${IC.x}</button>
    </div>
    <div class="modal-body">
      <div class="type-toggle" style="margin-bottom:16px">
        <button class="type-btn${type==='anime'?' active':''}" data-mtype="anime">🎬 Anime</button>
        <button class="type-btn${type==='manga'?' active':''}" data-mtype="manga">📚 Manga</button>
      </div>
      <div class="form-group">
        <label class="form-label">Titel *</label>
        <input class="form-input" id="m-title" type="text" placeholder="Originaltitel" required/>
      </div>
      <div class="form-group">
        <label class="form-label">Englischer Titel</label>
        <input class="form-input" id="m-title-en" type="text" placeholder="Englischer Titel (optional)"/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" id="m-count-label">${type==='anime'?'Episoden':'Kapitel'}</label>
          <input class="form-input" id="m-count" type="number" min="0" placeholder="?"/>
        </div>
        <div class="form-group">
          <label class="form-label" id="m-vol-label">${type==='anime'?'Staffeln':'Bände'}</label>
          <input class="form-input" id="m-vol" type="number" min="0" placeholder="?"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Medienstatus</label>
        <select class="form-input" id="m-status">
          <option value="">Unbekannt</option>
          <option>Currently Airing</option><option>Finished Airing</option><option>Not yet aired</option>
          <option>Publishing</option><option>Finished</option><option>On Hiatus</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Erscheinungsjahr</label>
        <input class="form-input" id="m-year" type="number" min="1950" max="2030" placeholder="z.B. 2024"/>
      </div>
      <div class="form-group">
        <label class="form-label">Cover-Bild URL (optional)</label>
        <input class="form-input" id="m-img" type="url" placeholder="https://…"/>
      </div>
      <div class="form-group">
        <label class="form-label">Beschreibung (optional)</label>
        <textarea class="form-input" id="m-synopsis" rows="3" placeholder="Kurze Zusammenfassung…"></textarea>
      </div>
      <div class="form-error" id="m-error"></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" id="modal-cancel">Abbrechen</button>
      <button class="btn btn-primary" id="btn-save-manual">${IC.plus} Hinzufügen</button>
    </div>`;

  openModal(html, () => {
    $('#modal-close')?.addEventListener('click', closeModal);
    $('#modal-cancel')?.addEventListener('click', closeModal);

    $$('[data-mtype]').forEach(btn => {
      btn.addEventListener('click', () => {
        curType = btn.dataset.mtype;
        $$('[data-mtype]').forEach(b => b.classList.toggle('active', b===btn));
        $('#m-count-label').textContent = curType==='anime' ? 'Episoden' : 'Kapitel';
        $('#m-vol-label').textContent = curType==='anime' ? 'Staffeln' : 'Bände';
      });
    });

    $('#btn-save-manual')?.addEventListener('click', async () => {
      const title = $('#m-title').value.trim();
      if (!title) {
        const err = $('#m-error');
        err.textContent = 'Titel ist erforderlich'; err.classList.add('show'); return;
      }
      const btn = $('#btn-save-manual');
      btn.disabled = true; btn.textContent = 'Speichern…';
      const mediaData = {
        is_manual: true, type: curType, title,
        title_english: $('#m-title-en').value.trim()||null,
        image_url: $('#m-img').value.trim()||null,
        synopsis: $('#m-synopsis').value.trim()||null,
        media_status: $('#m-status').value||null,
        episodes: curType==='anime' ? +$('#m-count').value||null : null,
        chapters: curType==='manga' ? +$('#m-count').value||null : null,
        volumes: +$('#m-vol').value||null,
        year: +$('#m-year').value||null,
        genres: [],
      };
      try {
        await API.list.save(mediaData, {
          listStatus: curType==='anime' ? 'plan_to_watch' : 'plan_to_read'
        });
        toast(`„${title}" manuell hinzugefügt!`, 'success');
        closeModal();
        await refreshAfterSave(curType);
      } catch (e) {
        const err = $('#m-error');
        err.textContent = e.message; err.classList.add('show');
        btn.disabled = false; btn.innerHTML = `${IC.plus} Hinzufügen`;
      }
    });
  });
}

/* ================================================================
   VIEW: ADMIN
   ================================================================ */
function renderAdminView() {
  const users = S.adminUsers;
  return `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-icon admin-icon">${IC.shield}</div>
        <div>
          <div class="page-title">Administration</div>
          <div class="page-sub">${users.length} registrierte Nutzer</div>
        </div>
      </div>
    </div>

    ${users.length ? `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Benutzer</th>
              <th>E-Mail</th>
              <th>Anime</th>
              <th>Manga</th>
              <th>Registriert</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr data-uid="${u.id}">
                <td>
                  <div class="admin-user-cell">
                    <div class="user-avatar" style="width:32px;height:32px;font-size:.75rem;flex-shrink:0">${u.username.substring(0,2).toUpperCase()}</div>
                    <span class="admin-username">${esc(u.username)}</span>
                  </div>
                </td>
                <td class="admin-email">${esc(u.email)}</td>
                <td class="admin-count">${u.animeCount}</td>
                <td class="admin-count">${u.mangaCount}</td>
                <td class="admin-date">${new Date(u.created_at).toLocaleDateString('de-DE')}</td>
                <td>
                  <div class="admin-actions">
                    <button class="btn btn-secondary btn-sm btn-admin-pw" data-uid="${u.id}" data-uname="${esc(u.username)}" title="Passwort ändern">
                      ${IC.key} Passwort
                    </button>
                    <button class="btn btn-danger btn-sm btn-admin-del" data-uid="${u.id}" data-uname="${esc(u.username)}" title="Löschen">
                      ${IC.trash}
                    </button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `
      <div class="empty-state">
        <div class="empty-state-emoji">👤</div>
        <h3>Keine Benutzer</h3>
        <p>Noch niemand hat sich registriert.</p>
      </div>`}`;
}

function bindAdminView() {
  $$('.btn-admin-pw').forEach(btn => {
    btn.addEventListener('click', () => showAdminPasswordModal(+btn.dataset.uid, btn.dataset.uname));
  });
  $$('.btn-admin-del').forEach(btn => {
    btn.addEventListener('click', () => confirmAdminDelete(+btn.dataset.uid, btn.dataset.uname));
  });
}

function showAdminPasswordModal(uid, username) {
  const html = `
    <div class="modal-head">
      <h2>Passwort ändern</h2>
      <button class="btn-modal-close" id="modal-close">${IC.x}</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text2);font-size:.9rem;margin-bottom:16px">
        Neues Passwort für <strong style="color:var(--text)">${esc(username)}</strong>:
      </p>
      <div class="form-group">
        <label class="form-label">Neues Passwort</label>
        <input class="form-input" type="password" id="new-password"
          placeholder="Mindestens 6 Zeichen" minlength="6" autocomplete="new-password"/>
      </div>
      <div class="form-group">
        <label class="form-label">Passwort bestätigen</label>
        <input class="form-input" type="password" id="confirm-password"
          placeholder="Passwort wiederholen" autocomplete="new-password"/>
      </div>
      <div class="form-error" id="pw-error"></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" id="modal-cancel">Abbrechen</button>
      <button class="btn btn-primary" id="btn-save-pw">${IC.key} Speichern</button>
    </div>`;

  openModal(html, () => {
    $('#modal-close')?.addEventListener('click', closeModal);
    $('#modal-cancel')?.addEventListener('click', closeModal);
    $('#new-password')?.focus();

    $('#btn-save-pw')?.addEventListener('click', async () => {
      const pw = $('#new-password').value;
      const confirm = $('#confirm-password').value;
      const errEl = $('#pw-error');
      errEl.classList.remove('show');

      if (pw.length < 6) {
        errEl.textContent = 'Mindestens 6 Zeichen erforderlich';
        errEl.classList.add('show'); return;
      }
      if (pw !== confirm) {
        errEl.textContent = 'Passwörter stimmen nicht überein';
        errEl.classList.add('show'); return;
      }

      const btn = $('#btn-save-pw');
      btn.disabled = true; btn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px"></div>`;
      try {
        await API.admin.changePassword(uid, pw);
        toast(`Passwort für „${username}" geändert`, 'success');
        closeModal();
      } catch (e) {
        errEl.textContent = e.message; errEl.classList.add('show');
        btn.disabled = false; btn.innerHTML = `${IC.key} Speichern`;
      }
    });
  });
}

async function confirmAdminDelete(uid, username) {
  if (!confirm(`Benutzer „${username}" wirklich löschen?\n\nDadurch werden auch alle Listen-Einträge und Follows unwiderruflich entfernt.`)) return;
  try {
    await API.admin.deleteUser(uid);
    S.adminUsers = S.adminUsers.filter(u => u.id !== uid);
    toast(`Benutzer „${username}" gelöscht`, 'success');
    const main = $('#main-content');
    if (main) { main.innerHTML = renderAdminView(); bindAdminView(); }
  } catch (e) { toast(e.message, 'error'); }
}

/* ================================================================
   VIEW: USERS (Nutzerliste & Follow)
   ================================================================ */
function renderUsersView() {
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
      <div class="empty-state">
        <div class="empty-state-emoji">👥</div>
        <h3>${S.userListFilter ? 'Kein Benutzer gefunden' : 'Noch keine anderen Nutzer'}</h3>
        <p>${S.userListFilter ? 'Probiere einen anderen Suchbegriff.' : 'Lade Freunde zu AniGa ein!'}</p>
      </div>`}`;
}

function renderUserCard(u) {
  return `
    <div class="user-card" data-user-id="${u.id}">
      <div class="user-avatar">${u.username.substring(0,2).toUpperCase()}</div>
      <div class="user-card-info">
        <div class="user-card-name">${esc(u.username)}</div>
        <div class="user-card-counts">${u.animeCount} Anime · ${u.mangaCount} Manga</div>
      </div>
      <button class="btn-follow${u.isFollowing?' following':''}" data-uid="${u.id}">
        ${u.isFollowing ? 'Entfolgen' : 'Folgen'}
      </button>
    </div>`;
}

function bindUsersView() {
  const input = $('#user-search');
  input?.addEventListener('input', debounce(() => {
    S.userListFilter = input.value;
    const filter = S.userListFilter.toLowerCase();
    const filtered = filter
      ? S.allUsers.filter(u => u.username.toLowerCase().includes(filter))
      : S.allUsers;
    const ul = $('.user-list');
    if (ul) {
      ul.innerHTML = filtered.map(u => renderUserCard(u)).join('');
      bindUserCards();
    } else {
      // empty → full re-render
      const main = $('#main-content');
      if (main) { main.innerHTML = renderUsersView(); bindUsersView(); }
    }
  }, 200));
  bindUserCards();
}

function bindUserCards() {
  $$('.user-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.btn-follow')) return;
      const uid = +card.dataset.userId;
      const user = S.allUsers.find(u => u.id === uid);
      if (user) showUserList(user);
    });
  });
  $$('.btn-follow').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const uid = +btn.dataset.uid;
      const wasFollowing = btn.classList.contains('following');
      btn.disabled = true;
      try {
        if (wasFollowing) {
          await API.users.unfollow(uid);
          btn.classList.remove('following');
          btn.textContent = 'Folgen';
          const u = S.allUsers.find(x => x.id === uid);
          if (u) u.isFollowing = false;
          toast('Nicht mehr gefolgt', 'info');
        } else {
          await API.users.follow(uid);
          btn.classList.add('following');
          btn.textContent = 'Entfolgen';
          const u = S.allUsers.find(x => x.id === uid);
          if (u) u.isFollowing = true;
          toast('Jetzt gefolgt! 🎉', 'success');
        }
      } catch (err) {
        toast(err.message, 'error');
      }
      btn.disabled = false;
    });
  });
}

async function showUserList(user) {
  S.viewingUser = user;
  S.userListType = 'anime';
  S.userListStatus = 'all';
  S.userListView = 'grid';
  const main = $('#main-content');
  main.innerHTML = '<div class="loader-wrap"><div class="spinner"></div></div>';
  try {
    S.viewingUserList = await API.users.getList(user.id, 'anime');
    main.innerHTML = renderUserListView();
    bindUserListView();
  } catch (e) {
    main.innerHTML = `<div class="empty-state">
      <div class="empty-state-emoji">⚠️</div>
      <h3>Fehler beim Laden</h3><p>${esc(e.message)}</p>
      <button class="btn btn-primary" onclick="navigate('users')">Zurück</button>
    </div>`;
  }
}

function renderUserListView() {
  const u = S.viewingUser;
  const list = S.viewingUserList;
  const type = S.userListType;
  const curStatus = S.userListStatus;
  const curView = S.userListView;
  const counts = {};
  list.forEach(e => { counts[e.list_status] = (counts[e.list_status]||0)+1; });
  const statuses = [{val:'all',label:'Alle'}, ...(type==='anime'?ANIME_STATUSES:MANGA_STATUSES)];
  const filtered = curStatus==='all' ? list : list.filter(e=>e.list_status===curStatus);

  return `
    <div class="user-list-header">
      <button class="btn btn-ghost btn-sm" id="btn-back-users">${IC.chevL} Zurück</button>
      <div class="user-avatar" style="width:40px;height:40px;font-size:1rem;flex-shrink:0">${u.username.substring(0,2).toUpperCase()}</div>
      <div class="user-list-header-info">
        <div class="user-list-header-name">${esc(u.username)}</div>
        <div class="user-list-header-sub">${u.animeCount} Anime · ${u.mangaCount} Manga</div>
      </div>
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

function renderUserListContent(filtered, curView) {
  if (!filtered.length) {
    return `<div class="empty-state">
      <div class="empty-state-emoji">${S.userListType==='anime'?'🎬':'📚'}</div>
      <h3>Keine Einträge</h3>
      <p>Dieser Nutzer hat noch nichts in dieser Kategorie.</p>
    </div>`;
  }
  return curView === 'grid'
    ? `<div class="media-grid">${filtered.map(e=>renderUserMediaCard(e)).join('')}</div>`
    : `<div class="list-grid">${filtered.map(e=>renderUserListCard(e)).join('')}</div>`;
}

function renderUserMediaCard(entry) {
  const pct = progressPct(entry);
  return `
    <div class="media-card user-entry-card" data-entry-id="${entry.id}">
      <div class="media-card-cover">
        ${coverImg(entry.image_url, entry.title)}
        ${entry.user_score?`<div class="media-card-score">${IC.star}${entry.user_score}.0</div>`:''}
        <div class="media-card-badge">
          <span class="status-badge ${STATUS_CSS[entry.list_status]}">${STATUS_LABELS[entry.list_status]||''}</span>
        </div>
        <div class="media-card-overlay">
          <div class="media-card-title">${esc(entry.title)}</div>
        </div>
      </div>
      <div class="media-card-footer">
        <span class="media-card-type">${progressText(entry)}</span>
      </div>
      ${pct>0?`<div class="progress-bar" style="margin:-1px 0 0;border-radius:0 0 var(--r) var(--r)"><div class="progress-fill" style="width:${pct}%"></div></div>`:''}
    </div>`;
}

function renderUserListCard(e) {
  const pct = progressPct(e);
  return `
    <div class="list-card user-entry-card" data-entry-id="${e.id}">
      <div class="list-card-cover">${coverImg(e.image_url,e.title)}</div>
      <div class="list-card-body">
        <div class="list-card-title" title="${esc(e.title)}">${esc(e.title)}</div>
        <div class="list-card-row">
          <span class="status-badge ${STATUS_CSS[e.list_status]}">${STATUS_LABELS[e.list_status]||''}</span>
          ${e.user_score?starsHtml(e.user_score,true):''}
        </div>
        <div class="list-card-progress">${progressText(e)}</div>
        ${pct>0?`<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`:''}
      </div>
    </div>`;
}

function bindUserListView() {
  $('#btn-back-users')?.addEventListener('click', () => navigate('users'));

  $$('.type-btn[data-utype]').forEach(b => {
    b.addEventListener('click', async () => {
      S.userListType = b.dataset.utype;
      S.userListStatus = 'all';
      const main = $('#main-content');
      main.innerHTML = '<div class="loader-wrap"><div class="spinner"></div></div>';
      try {
        S.viewingUserList = await API.users.getList(S.viewingUser.id, S.userListType);
        main.innerHTML = renderUserListView();
        bindUserListView();
      } catch (e) { toast(e.message, 'error'); }
    });
  });

  $$('.status-tab[data-ustatus]').forEach(t => {
    t.addEventListener('click', () => {
      S.userListStatus = t.dataset.ustatus;
      $$('.status-tab[data-ustatus]').forEach(x => x.classList.toggle('active', x===t));
      refreshUserListContent();
    });
  });

  $('#uvgrid')?.addEventListener('click', () => {
    S.userListView = 'grid';
    $('#uvgrid').classList.add('active');
    $('#uvlist').classList.remove('active');
    refreshUserListContent();
  });
  $('#uvlist')?.addEventListener('click', () => {
    S.userListView = 'list';
    $('#uvlist').classList.add('active');
    $('#uvgrid').classList.remove('active');
    refreshUserListContent();
  });

  bindUserEntryCards();
}

function refreshUserListContent() {
  const list = S.viewingUserList;
  const curStatus = S.userListStatus;
  const curView = S.userListView;
  const filtered = curStatus==='all' ? list : list.filter(e=>e.list_status===curStatus);
  const content = $('#user-list-content');
  if (content) {
    content.innerHTML = renderUserListContent(filtered, curView);
    bindUserEntryCards();
  }
}

function bindUserEntryCards() {
  $$('.user-entry-card').forEach(card => {
    card.addEventListener('click', () => {
      const entryId = +card.dataset.entryId;
      const entry = S.viewingUserList.find(e => e.id === entryId);
      if (entry) showUserInfoModal(entry);
    });
  });
}

function showUserInfoModal(entry) {
  const isAnime = entry.type === 'anime';
  const synopsis = entry.synopsis || '';

  const html = `
    <div class="modal-head">
      <h2>${esc(entry.title)}</h2>
      <button class="btn-modal-close" id="modal-close">${IC.x}</button>
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
        ${entry.api_score?`<div class="meta-chip">${IC.star}<span style="color:var(--star)">${Number(entry.api_score).toFixed(1)}</span> MAL</div>`:''}
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
        ${entry.user_score?starsHtml(entry.user_score):'<span style="color:var(--text3);font-size:.8rem">Keine Bewertung</span>'}
      </div>
      <div style="color:var(--text2);font-size:.88rem;margin-bottom:6px">${progressText(entry)}</div>
      ${entry.notes?`<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-sm);padding:10px 13px;font-size:.85rem;color:var(--text2);margin-top:10px;white-space:pre-wrap">${esc(entry.notes)}</div>`:''}
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" id="modal-cancel">Schließen</button>
    </div>`;

  openModal(html, () => {
    $('#modal-close')?.addEventListener('click', closeModal);
    $('#modal-cancel')?.addEventListener('click', closeModal);
    $('#btn-expand')?.addEventListener('click', () => {
      const st = $('#syn-text');
      const exp = st.classList.toggle('expanded');
      $('#btn-expand').textContent = exp ? 'Weniger anzeigen' : 'Mehr anzeigen';
    });
  });
}

/* ================================================================
   APP INIT & BOOT
   ================================================================ */
function initApp() {
  const app = document.getElementById('app');
  app.innerHTML = renderShell();

  // Global event delegation
  document.addEventListener('click', e => {
    // Nav buttons
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn && !navBtn.closest('.modal-overlay')) {
      navigate(navBtn.dataset.nav); return;
    }
    // Logout
    if (e.target.closest('#btn-logout') || e.target.closest('#btn-logout-profile')) {
      logout(); return;
    }
    // Mobile sidebar toggle
    if (e.target.closest('#btn-menu')) {
      $('#sidebar')?.classList.toggle('open');
      $('#sidebar-overlay')?.classList.toggle('open'); return;
    }
    // Close sidebar on overlay click
    if (e.target.id === 'sidebar-overlay') {
      closeSidebar(); return;
    }
  });

  navigate('home');
}

function logout() {
  localStorage.removeItem('aniga_token');
  S.token = null; S.user = null;
  S.animeList = []; S.mangaList = []; S.stats = null;
  S.topAnime = []; S.topManga = []; S.seasonal = [];
  S.allUsers = []; S.following = []; S.viewingUser = null; S.adminUsers = [];
  S.viewingUserList = []; S.userListFilter = '';
  bindAuth();
}

async function boot() {
  // PWA service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // PWA install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.innerHTML = `<span style="font-size:1.4rem">🌸</span>
      <p>AniGa als App installieren für das beste Erlebnis!</p>
      <button class="btn btn-primary btn-sm" id="btn-pwa-install">Installieren</button>
      <button class="btn btn-icon" id="btn-pwa-dismiss">${IC.x}</button>`;
    document.body.appendChild(banner);
    banner.querySelector('#btn-pwa-install')?.addEventListener('click', async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') toast('App installiert! 🎉', 'success');
      banner.remove();
    });
    banner.querySelector('#btn-pwa-dismiss')?.addEventListener('click', () => banner.remove());
  });

  // Auth check
  if (S.token) {
    try {
      S.user = await API.auth.me();
      initApp();
    } catch {
      localStorage.removeItem('aniga_token');
      S.token = null;
      bindAuth();
    }
  } else {
    bindAuth();
  }
}

window.addEventListener('DOMContentLoaded', boot);
