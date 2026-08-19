/* =====================================================
   AniGa – main.js
   Einstiegspunkt: Boot, App-Shell, Logout, PWA-Install
   ===================================================== */
import { IC } from './icons.js';
import { S } from './state.js';
import { $, toast } from './dom.js';
import { API } from './api.js';
import { renderShell, openMoreSheet } from './shell.js';
import { AREAS } from './media.js';
import { navigate } from './router.js';
import { bindAuth } from './views/auth.js';

/* Bereich wechseln: Nav-Slots tauschen, Such-/Empfehlungs-State zurücksetzen */
export function switchArea(area)
{
  if (!AREAS[area] || S.area === area)
  {
    return;
  }
  S.area = area;
  localStorage.setItem('aniga_area', area);
  const firstType = AREAS[area].types[0];
  S.searchType = firstType;
  S.searchQ = '';
  S.searchResults = [];
  S.searchPage = 1;
  S.recommendType = firstType;
  S.recommendations = null;
  S.recommendPage = 1;
  S.topError = null;
  document.getElementById('app').innerHTML = renderShell();
  navigate('home');
}

/* Einmalige globale Klick-Delegation — darf bei Logout/Login-Zyklen nicht stapeln */
let delegationBound = false;

function bindGlobalDelegation()
{
  if (delegationBound)
  {
    return;
  }
  delegationBound = true;

  document.addEventListener('click', e =>
  {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn && !navBtn.closest('.modal-overlay'))
    {
      navigate(navBtn.dataset.nav);
      return;
    }
    const areaBtn = e.target.closest('[data-area]');
    if (areaBtn)
    {
      switchArea(areaBtn.dataset.area);
      return;
    }
    if (e.target.closest('#btn-logout')
      || e.target.closest('#btn-logout-profile'))
    {
      logout();
      return;
    }
    if (e.target.closest('#btn-more-nav'))
    {
      openMoreSheet();
      return;
    }
  });
}

export function initApp()
{
  const app = document.getElementById('app');
  app.innerHTML = renderShell();
  bindGlobalDelegation();
  navigate('home');
}

export function logout()
{
  localStorage.removeItem('aniga_token');
  S.token = null;
  S.user = null;
  Object.keys(S.lists).forEach(type =>
  {
    S.lists[type] = [];
    S.top[type] = [];
    S.highlight[type] = [];
  });
  S.stats = null;
  S.allUsers = [];
  S.following = [];
  S.viewingUser = null;
  S.adminUsers = [];
  S.viewingUserList = [];
  S.userListFilter = '';
  bindAuth();
}

async function boot()
{
  if ('serviceWorker' in navigator)
  {
    navigator.serviceWorker.register('/sw.js').catch(() =>
    {
      // Registration failed silently
    });
  }

  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e =>
  {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.innerHTML = `<span style="font-size:1.4rem">🌸</span>
      <p>AniGa als App installieren für das beste Erlebnis!</p>
      <button class="btn btn-primary btn-sm" id="btn-pwa-install">Installieren</button>
      <button class="btn btn-icon" id="btn-pwa-dismiss">${IC.x}</button>`;
    document.body.appendChild(banner);
    banner.querySelector('#btn-pwa-install')?.addEventListener('click', async () =>
    {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted')
      {
        toast('App installiert! 🎉', 'success');
      }
      banner.remove();
    });
    banner.querySelector('#btn-pwa-dismiss')?.addEventListener('click',
      () => banner.remove());
  });

  if (S.token)
  {
    try
    {
      S.user = await API.auth.me();
      initApp();
    }
    catch
    {
      localStorage.removeItem('aniga_token');
      S.token = null;
      bindAuth();
    }
  }
  else
  {
    bindAuth();
  }
}

window.addEventListener('DOMContentLoaded', boot);
