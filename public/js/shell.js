/* =====================================================
   AniGa – shell.js
   App-Gerüst: Sidebar, Mobile-Header, Bottom-Navigation
   ===================================================== */
import { IC } from './icons.js';
import { S } from './state.js';
import { $, $$, esc } from './dom.js';
import { AREAS, TYPE_META } from './media.js';

/* Views, die mobil hinter dem „Mehr"-Sheet liegen (Bottom-Nav max. 5 Items) */
const MORE_VIEWS = ['collections', 'users', 'profile', 'admin'];

function allNavItems()
{
  const areaTypes = AREAS[S.area].types;
  return [
    { id:'home',    icon:IC.home,   label:'Übersicht', short:'Start' },
    { id:'search',  icon:IC.search, label:'Suche', short:'Suche' },
    ...areaTypes.map(t =>
    {
      const m = TYPE_META[t];
      return { id: m.view, icon: IC[m.icon], label: m.label, short: m.short };
    }),
    { id:'collections', icon:IC.folder, label:'Collections' },
    { id:'users',   icon:IC.users,  label:'Nutzer' },
    { id:'profile', icon:IC.user,   label:'Profil' },
    ...(S.user?.is_admin ? [{ id:'admin', icon:IC.shield, label:'Admin', admin:true }] : []),
  ];
}

function areaSwitcherHtml()
{
  return `
    <div class="area-switcher">
      ${Object.entries(AREAS).map(([id, a]) => `
        <button class="area-btn${S.area===id?' active':''}" data-area="${id}">${a.label}</button>
      `).join('')}
    </div>`;
}

export function renderShell()
{
  const v = S.view;
  const u = S.user || {};
  const initials = (u.username || '?').substring(0, 2).toUpperCase();
  const navItems = allNavItems();
  const primary = navItems.filter(n => !MORE_VIEWS.includes(n.id));

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <img src="/icons/logo.jpeg" class="logo-img" alt="AniGa Logo"/>
        <span class="logo-text">AniGa</span>
      </div>
      ${areaSwitcherHtml()}
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
    <main class="main-content" id="main-content"></main>
    <nav class="bottom-nav">
      <div class="bottom-nav-inner">
        ${primary.map(n=>`
          <button class="bottom-nav-item${v===n.id?' active':''}" data-nav="${n.id}">
            ${n.icon}<span>${n.short||n.label}</span>
          </button>`).join('')}
        <button class="bottom-nav-item${MORE_VIEWS.includes(v)?' active':''}" id="btn-more-nav">
          ${IC.more}<span>Mehr</span>
        </button>
      </div>
    </nav>`;
}

export function updateNav()
{
  $$('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === S.view));
  $('#btn-more-nav')?.classList.toggle('active', MORE_VIEWS.includes(S.view));
}

/* Bottom-Sheet mit den restlichen Navigationspunkten (mobil) */
export function openMoreSheet()
{
  closeMoreSheet();
  const items = allNavItems().filter(n => MORE_VIEWS.includes(n.id));
  const overlay = document.createElement('div');
  overlay.className = 'more-sheet-overlay';
  overlay.id = 'more-sheet-overlay';
  overlay.innerHTML = `
    <div class="more-sheet">
      <div class="more-sheet-handle"></div>
      ${areaSwitcherHtml()}
      ${items.map(n => `
        <button class="more-sheet-item${S.view===n.id?' active':''}" data-nav="${n.id}">
          ${n.icon}<span>${n.label}</span>
        </button>`).join('')}
    </div>`;
  document.body.appendChild(overlay);

  // Schließt bei Overlay-Tipp, Navigation und Bereichswechsel (globale Delegation übernimmt die Aktion)
  overlay.addEventListener('click', e =>
  {
    if (e.target === overlay || e.target.closest('[data-nav]') || e.target.closest('[data-area]'))
    {
      closeMoreSheet();
    }
  });
}

export function closeMoreSheet()
{
  document.getElementById('more-sheet-overlay')?.remove();
}
