/* =====================================================
   AniGa – router.js
   View-Navigation und zentrales Daten-Laden pro View
   ===================================================== */
import { S } from './state.js';
import { $, renderEmptyState, renderInto, showSpinner } from './dom.js';
import { API } from './api.js';
import { AREAS, TYPE_META, setUserList } from './media.js';
import { updateNav } from './shell.js';
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
  const main = $('#main-content');
  if (!main)
  {
    return;
  }
  showSpinner(main);

  try
  {
    // Listen-Views heißen wie ihr Medientyp — generisch, damit neue Typen nichts brauchen
    if (TYPE_META[view])
    {
      await showTypeListView(view, main);
      return;
    }
    switch (view)
    {
      case 'home':
        await Promise.all([loadAllLists(), loadStats()]);
        renderInto(main, renderHome(), bindHome);
        if (!S.recommendations)
        {
          loadRecommendations();
        }
        break;
      case 'search': {
        renderInto(main, renderSearch(), bindSearch);
        const loaded = AREAS[S.area].types.some(t => S.top[t].length);
        if (!loaded)
        {
          loadTopContent();
        }
        break;
      }
      case 'profile':
        S.stats = await API.list.getStats();
        renderInto(main, renderProfile(), bindProfile);
        break;
      case 'admin':
        if (!S.user?.is_admin)
        {
          navigate('home');
          return;
        }
        S.adminUsers = await API.admin.getUsers();
        renderInto(main, renderAdminView(), bindAdminView);
        break;
      case 'collections':
        S.collections = await API.collections.getAll();
        S.viewingCollection = null;
        renderInto(main, renderCollectionsView(), bindCollectionsView);
        break;
      case 'users':
        [S.allUsers, S.following] = await Promise.all([
          API.users.getAll(),
          API.users.getFollowing()
        ]);
        S.viewingUser = null;
        S.userListFilter = '';
        renderInto(main, renderUsersView(), bindUsersView);
        break;
    }
  }
  catch (e)
  {
    renderInto(main, renderEmptyState(
      '⚠️', 'Fehler beim Laden', e.message,
      `<button class="btn btn-primary" data-nav="${view}">Nochmal versuchen</button>`
    ));
  }
}

/* Eigene Liste eines Medientyps (anime/manga/movie/tv/game) */
async function showTypeListView(type, main)
{
  const [list, collections] = await Promise.all([
    API.list.getAll(type),
    API.collections.getAll()
  ]);
  setUserList(type, list);
  S.collections = collections;
  renderInto(main, renderList(type), () => bindList(type));
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
