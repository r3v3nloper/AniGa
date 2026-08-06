/* =====================================================
   AniGa – main.js
   Einstiegspunkt: Boot, App-Shell, Logout, PWA-Install
   ===================================================== */
import { IC } from './icons.js';
import { S } from './state.js';
import { $, toast } from './dom.js';
import { API } from './api.js';
import { renderShell, closeSidebar } from './shell.js';
import { navigate } from './router.js';
import { bindAuth } from './views/auth.js';

export function initApp()
{
  const app = document.getElementById('app');
  app.innerHTML = renderShell();

  document.addEventListener('click', e =>
  {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn && !navBtn.closest('.modal-overlay'))
    {
      navigate(navBtn.dataset.nav);
      return;
    }
    if (e.target.closest('#btn-logout')
      || e.target.closest('#btn-logout-profile'))
    {
      logout();
      return;
    }
    if (e.target.closest('#btn-menu'))
    {
      $('#sidebar')?.classList.toggle('open');
      $('#sidebar-overlay')?.classList.toggle('open');
      return;
    }
    if (e.target.id === 'sidebar-overlay')
    {
      closeSidebar();
      return;
    }
  });

  navigate('home');
}

export function logout()
{
  localStorage.removeItem('aniga_token');
  S.token = null;
  S.user = null;
  S.animeList = [];
  S.mangaList = [];
  S.stats = null;
  S.topAnime = [];
  S.topManga = [];
  S.seasonal = [];
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
