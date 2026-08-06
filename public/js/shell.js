/* =====================================================
   AniGa – shell.js
   App-Gerüst: Sidebar, Mobile-Header, Bottom-Navigation
   ===================================================== */
import { IC } from './icons.js';
import { S } from './state.js';
import { $, $$, esc } from './dom.js';

export function renderShell()
{
  const v = S.view;
  const u = S.user || {};
  const initials = (u.username || '?').substring(0, 2).toUpperCase();
  const navItems = [
    { id:'home',    icon:IC.home,   label:'Übersicht' },
    { id:'search',  icon:IC.search, label:'Suche' },
    { id:'anime',   icon:IC.tv,     label:'Anime-Liste' },
    { id:'manga',   icon:IC.book,   label:'Manga-Liste' },
    { id:'collections', icon:IC.folder, label:'Collections' },
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
        <img src="/icons/logo.jpeg" class="logo-img logo-img-sm" alt="AniGa Logo"/>
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

export function updateNav()
{
  $$('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === S.view));
}

export function closeSidebar()
{
  $('#sidebar')?.classList.remove('open');
  $('#sidebar-overlay')?.classList.remove('open');
}
