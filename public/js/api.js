/* =====================================================
   AniGa – api.js
   All HTTP calls to the backend (ES module)
   ===================================================== */

export const API = (() =>
{
  const BASE = '/api';

  function getToken()
  {
    return localStorage.getItem('aniga_token');
  }

  async function req(method, path, body)
  {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const token = getToken();
    if (token)
    {
      opts.headers['Authorization'] = `Bearer ${token}`;
    }
    if (body !== undefined)
    {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(BASE + path, opts);
    const data = await res.json();
    if (!res.ok)
    {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  }

  return {
    auth: {
      register: (username, email, password) =>
        req('POST', '/auth/register', { username, email, password }),
      login: (email, password) =>
        req('POST', '/auth/login', { email, password }),
      me: () => req('GET', '/auth/me'),
      updateProfile: (data) => req('PUT', '/auth/profile', data)
    },

    list: {
      getAll: (type, status) =>
      {
        let p = '';
        if (type)
        {
          p += `?type=${type}`;
        }
        if (status)
        {
          p += `${p ? '&' : '?'}status=${status}`;
        }
        return req('GET', `/list${p}`);
      },
      getStats: () => req('GET', '/list/stats'),
      check: (malId, type) =>
        req('GET', `/list/check?malId=${malId}&type=${type}`),
      save: (mediaData, listData) =>
        req('POST', '/list', { mediaData, ...listData }),
      update: (id, data) => req('PUT', `/list/${id}`, data),
      remove: (id) => req('DELETE', `/list/${id}`)
    },

    users: {
      getAll: () => req('GET', '/users'),
      getProfile: (id) => req('GET', `/users/${id}/profile`),
      getList: (id, type) =>
        req('GET', `/users/${id}/list${type ? '?type=' + type : ''}`),
      follow: (id) => req('POST', `/users/${id}/follow`),
      unfollow: (id) => req('DELETE', `/users/${id}/follow`),
      getFollowing: () => req('GET', '/users/following'),
      compare: (id, type) =>
        req('GET', `/users/${id}/compare${type ? '?type=' + type : ''}`),
    },

    admin: {
      getUsers: () => req('GET', '/admin/users'),
      deleteUser: (id) => req('DELETE', `/admin/users/${id}`),
      changePassword: (id, pw) =>
        req('PUT', `/admin/users/${id}/password`, { password: pw }),
    },

    recommendations: {
      get: (type, page = 1) =>
        req('GET', `/recommendations?type=${type || 'anime'}&page=${page}`)
    },

    collections: {
      getAll: () => req('GET', '/collections'),
      get: (id) => req('GET', `/collections/${id}`),
      create: (name, emoji) => req('POST', '/collections', { name, emoji }),
      rename: (id, name, emoji) => req('PUT', `/collections/${id}`, { name, emoji }),
      remove: (id) => req('DELETE', `/collections/${id}`),
      addItem: (id, listEntryId) =>
        req('POST', `/collections/${id}/items`, { listEntryId }),
      removeItem: (id, listEntryId) =>
        req('DELETE', `/collections/${id}/items/${listEntryId}`),
    },

    search: {
      /* type: anime | manga | movie | tv — Backend wählt den passenden Provider */
      query: (type, q, page) =>
        req('GET', `/search/${type}?q=${encodeURIComponent(q)}&page=${page || 1}`),
      getDetail: (type, id) => req('GET', `/search/${type}/${id}`),
      top: (type) => req('GET', `/search/top/${type}`),
      getStreaming: (id) => req('GET', `/search/anime/${id}/streaming`),
      seasonal: () => req('GET', '/search/seasonal'),
      trending: (type) => req('GET', `/search/trending?type=${type || 'movie'}`)
    }
  };
})();
