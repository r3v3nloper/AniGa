/* =====================================================
   AniGa – router.js
   View-Navigation und zentrales Daten-Laden pro View
   ===================================================== */
import { S } from './state.js';
import { $, esc, renderEmptyState } from './dom.js';
import { API } from './api.js';
import { updateNav, closeSidebar } from './shell.js';
import { renderHome, bindHome, loadRecommendations } from './views/home.js';
import { renderSearch, bindSearch, loadTopContent } from './views/search.js';
import { renderList, bindList } from './views/lists.js';
import { renderProfile, bindProfile } from './views/profile.js';
import { renderAdminView, bindAdminView } from './views/admin.js';
import { renderUsersView, bindUsersView } from './views/users.js';
import { renderCollectionsView, bindCollectionsView } from './views/collections.js';

export async function navigate(view)
{
  S.view = view;
  updateNav();
  closeSidebar();
  const main = $('#main-content');
  if (!main)
  {
    return;
  }
  main.innerHTML = '<div class="loader-wrap"><div class="spinner"></div></div>';

  try
  {
    switch (view)
    {
      case 'home':
        await Promise.all([loadAllLists(), loadStats()]);
        main.innerHTML = renderHome();
        bindHome();
        if (!S.recommendations)
        {
          loadRecommendations();
        }
        break;
      case 'search':
        main.innerHTML = renderSearch();
        bindSearch();
        if (!S.topAnime.length)
        {
          loadTopContent();
        }
        break;
      case 'anime':
        [S.animeList, S.collections] = await Promise.all([
          API.list.getAll('anime'),
          API.collections.getAll()
        ]);
        main.innerHTML = renderList('anime');
        bindList('anime');
        break;
      case 'manga':
        [S.mangaList, S.collections] = await Promise.all([
          API.list.getAll('manga'),
          API.collections.getAll()
        ]);
        main.innerHTML = renderList('manga');
        bindList('manga');
        break;
      case 'profile':
        S.stats = await API.list.getStats();
        main.innerHTML = renderProfile();
        bindProfile();
        break;
      case 'admin':
        if (!S.user?.is_admin)
        {
          navigate('home');
          return;
        }
        S.adminUsers = await API.admin.getUsers();
        main.innerHTML = renderAdminView();
        bindAdminView();
        break;
      case 'collections':
        S.collections = await API.collections.getAll();
        S.viewingCollection = null;
        main.innerHTML = renderCollectionsView();
        bindCollectionsView();
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
  }
  catch (e)
  {
    main.innerHTML = renderEmptyState(
      '⚠️', 'Fehler beim Laden', esc(e.message),
      `<button class="btn btn-primary" data-nav="${view}">Nochmal versuchen</button>`
    );
  }
}

async function loadAllLists()
{
  const [a, m] = await Promise.all([
    API.list.getAll('anime'),
    API.list.getAll('manga')
  ]);
  S.animeList = a;
  S.mangaList = m;
}

async function loadStats()
{
  S.stats = await API.list.getStats();
}
