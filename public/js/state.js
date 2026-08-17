/* =====================================================
   AniGa – state.js
   Zentraler, veränderlicher App-State (Single Source of Truth)
   ===================================================== */
import { AREAS, MEDIA_TYPES } from './types.js';

/* Ein Eintrag pro Medientyp — der Factory-Aufruf verhindert geteilte Referenzen */
function perType(factory)
{
  return Object.fromEntries(MEDIA_TYPES.map(t => [t, factory()]));
}

const storedArea = localStorage.getItem('aniga_area');
const area = AREAS[storedArea] ? storedArea : 'otaku';
const firstType = AREAS[area].types[0];

export const S = {
  user: null,
  token: localStorage.getItem('aniga_token'),
  view: 'home',
  area,
  lists: perType(() => []),
  stats: null,
  searchType: firstType,
  searchQ: '',
  searchPage: 1,
  searchResults: [],
  searchPagination: null,
  /* Entdecken-Sektionen der Suche: top = „Beliebte/Top",
     highlight = optionale Sektion darüber (Seasonal bzw. Trending) */
  top: perType(() => []),
  highlight: perType(() => []),
  topError: null,
  listStatus: perType(() => 'all'),
  listView: perType(() => 'grid'),
  listFilter: perType(() => ''),
  listCollection: perType(() => 'all'),
  collections: [],
  viewingCollection: null,
  allUsers: [],
  following: [],
  adminUsers: [],
  viewingUser: null,
  viewingUserList: [],
  userListFilter: '',
  userListType: 'anime',
  userListStatus: 'all',
  userListView: 'grid',
  compareData: null,
  compareType: 'anime',
  compareTab: 'both',
  recommendations: null,
  recommendType: firstType,
  recommendPage: 1,
};
