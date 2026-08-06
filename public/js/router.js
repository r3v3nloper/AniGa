/* =====================================================
   AniGa – router.js
   View-Navigation und zentrales Daten-Laden pro View
   ===================================================== */
import { S } from './state.js';
import { $, esc, renderEmptyState } from './dom.js';
import { API } from './api.js';
import { AREAS, setUserList } from './media.js';
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
      case 'search': {
        main.innerHTML = renderSearch();
        bindSearch();
        const topCache = S.area === 'screen' ? S.topMovie : S.topAnime;
        if (!topCache.length)
        {
          loadTopContent();
        }
        break;
      }
      case 'anime':
      case 'manga':
      case 'movie':
      case 'tv': {
        const [list, collections] = await Promise.all([
          API.list.getAll(view),
          API.collections.getAll()
        ]);
        setUserList(view, list);
        S.collections = collections;
        main.innerHTML = renderList(view);
        bindList(view);
        break;
      }
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
  // Lädt die Listen des aktiven Bereichs (Anime/Manga bzw. Filme/Serien)
  const types = AREAS[S.area].types;
  const lists = await Promise.all(types.map(t => API.list.getAll(t)));
  types.forEach((t, i) => setUserList(t, lists[i]));
}

async function loadStats()
{
  S.stats = await API.list.getStats();
}
