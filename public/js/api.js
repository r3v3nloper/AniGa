/* =====================================================
   AniGa – api.js
   All HTTP calls to the backend
   ===================================================== */

const API = (() => {
  const BASE = '/api';

  function getToken() {
    return localStorage.getItem('aniga_token');
  }

  async function req(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const token = getToken();
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
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
      getAll: (type, status) => {
        let p = '';
        if (type) p += `?type=${type}`;
        if (status) p += `${p ? '&' : '?'}status=${status}`;
        return req('GET', `/list${p}`);
      },
      getStats: () => req('GET', '/list/stats'),
      check: (malId, type) => req('GET', `/list/check?malId=${malId}&type=${type}`),
      save: (mediaData, listData) =>
        req('POST', '/list', { mediaData, ...listData }),
      update: (id, data) => req('PUT', `/list/${id}`, data),
      remove: (id) => req('DELETE', `/list/${id}`)
    },

    users: {
      getAll:      ()     => req('GET',    '/users'),
      getProfile:  (id)   => req('GET',    `/users/${id}/profile`),
      getList:     (id, type) => req('GET', `/users/${id}/list${type ? '?type=' + type : ''}`),
      follow:      (id)   => req('POST',   `/users/${id}/follow`),
      unfollow:    (id)   => req('DELETE', `/users/${id}/follow`),
      getFollowing: ()    => req('GET',    '/users/following'),
      compare:     (id, type) => req('GET', `/users/${id}/compare${type ? '?type=' + type : ''}`),
    },

    admin: {
      getUsers:       ()       => req('GET',    '/admin/users'),
      deleteUser:     (id)     => req('DELETE', `/admin/users/${id}`),
      changePassword: (id, pw) => req('PUT',    `/admin/users/${id}/password`, { password: pw }),
    },

    recommendations: {
      get: (type) => req('GET', `/recommendations${type ? '?type=' + type : ''}`)
    },

    search: {
      anime: (q, page) => req('GET', `/search/anime?q=${encodeURIComponent(q)}&page=${page || 1}`),
      manga: (q, page) => req('GET', `/search/manga?q=${encodeURIComponent(q)}&page=${page || 1}`),
      getAnime: (id) => req('GET', `/search/anime/${id}`),
      getStreaming: (id) => req('GET', `/search/anime/${id}/streaming`),
      getManga: (id) => req('GET', `/search/manga/${id}`),
      topAnime: () => req('GET', '/search/top/anime'),
      topManga: () => req('GET', '/search/top/manga'),
      seasonal: () => req('GET', '/search/seasonal')
    }
  };
})();
