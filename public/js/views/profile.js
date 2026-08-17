/* =====================================================
   AniGa – views/profile.js
   Profil-Ansicht + Profil-bearbeiten-Modal
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, esc, toast } from '../dom.js';
import { openModal, closeModal } from '../modal.js';
import { API } from '../api.js';
import { navigate } from '../router.js';
import { logout } from '../main.js';
import { MEDIA_TYPES, TYPE_META, statusesFor, statusLabel } from '../media.js';

/* Farbcode je Listen-Status (typ-übergreifend, die Werte sind für alle Typen gleich) */
const STATUS_COLORS = {
  watching: '#00e5ff', reading: '#00e5ff',
  completed: '#4caf50',
  plan_to_watch: '#7c4dff', plan_to_read: '#7c4dff',
  on_hold: '#ff9800', dropped: '#ef5350',
};

/* Zeigt nur Typen, zu denen es auch Einträge gibt — sonst als Startpunkt Anime & Manga */
function typesToShow()
{
  const tracked = MEDIA_TYPES.filter(t => (S.stats?.[t]?.total || 0) > 0);
  return tracked.length ? tracked : ['anime', 'manga'];
}

function statCardsFor(type)
{
  const s = S.stats?.[type] || {};
  const meta = TYPE_META[type];
  const cards = [{ num: s.total || 0, label: 'Gesamt' }];
  if (meta.progress === 'episodes')
  {
    cards.push({ num: s.total_episodes || 0, label: 'Episoden' });
  }
  if (meta.progress === 'chapters')
  {
    cards.push({ num: s.total_chapters || 0, label: 'Kapitel' });
  }
  cards.push({ num: s.completed || 0, label: statusLabel('completed', type) });
  return cards;
}

/* Ein Block je Medientyp: Kennzahlen + Aufschlüsselung nach Status */
function typeStatsBlock(type)
{
  const s = S.stats?.[type] || {};
  const meta = TYPE_META[type];
  return `
    <div class="section">
      <div class="section-head">
        <div class="section-title">${IC[meta.icon]} ${meta.plural}</div>
      </div>
      <div class="stats-grid" style="margin-bottom:12px">
        ${statCardsFor(type).map(c => `
          <div class="stat-card">
            <div class="stat-num">${c.num}</div>
            <div class="stat-label">${c.label}</div>
          </div>`).join('')}
      </div>
      <div class="stats-detail">
        <div class="stats-row">
          ${statusesFor(type).map(st => `
            <div class="stats-item">
              <span class="stats-item-label">
                <span class="stats-dot" style="background:${STATUS_COLORS[st.val] || 'var(--accent)'}"></span>${st.label}
              </span>
              <span class="stats-item-val">${s[st.val] || 0}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

export function renderProfile()
{
  const u = S.user || {};
  const joined = u.created_at
    ? new Date(u.created_at).toLocaleDateString('de-DE', {
        day:'2-digit', month:'2-digit', year:'numeric'
      })
    : '';

  return `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-icon">${IC.user}</div>
        <div><div class="page-title">Profil</div><div class="page-sub">Deine Statistiken &amp; Konto</div></div>
      </div>
    </div>

    <div class="profile-hero">
      <div class="profile-avatar">${(u.username||'?').substring(0,2).toUpperCase()}</div>
      <div>
        <div class="profile-name">${esc(u.username||'')}</div>
        <div class="profile-email">${esc(u.email||'')}</div>
        ${joined?`<div class="profile-joined">Mitglied seit ${joined}</div>`:''}
      </div>
    </div>

    ${typesToShow().map(typeStatsBlock).join('')}

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px">
      <button class="btn btn-primary" id="btn-edit-profile">${IC.edit} Profil bearbeiten</button>
      <button class="btn btn-danger" id="btn-logout-profile">${IC.logout} Abmelden</button>
    </div>`;
}

export function bindProfile()
{
  $('#btn-logout-profile')?.addEventListener('click', logout);
  $('#btn-edit-profile')?.addEventListener('click', showProfileEditModal);
}

function showProfileEditModal()
{
  const u = S.user || {};
  openModal(`
    <div class="modal-head">
      <h2>${IC.edit} Profil bearbeiten</h2>
      <button class="btn-modal-close" id="modal-close-btn" aria-label="Schließen">${IC.x}</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Benutzername</label>
        <input class="form-input" id="pe-username" type="text" value="${esc(u.username||'')}" autocomplete="username"/>
      </div>
      <div class="form-group">
        <label class="form-label">E-Mail</label>
        <input class="form-input" id="pe-email" type="email" value="${esc(u.email||'')}" autocomplete="email"/>
      </div>
      <hr style="border-color:var(--border);margin:16px 0"/>
      <p style="font-size:.82rem;color:var(--text2);margin-bottom:12px">
        Passwort ändern (optional — nur ausfüllen wenn gewünscht)
      </p>
      <div class="form-group">
        <label class="form-label">Aktuelles Passwort</label>
        <input class="form-input" id="pe-current-pw" type="password"
          autocomplete="current-password"
          placeholder="Aktuelles Passwort"/>
      </div>
      <div class="form-group">
        <label class="form-label">Neues Passwort</label>
        <input class="form-input" id="pe-new-pw" type="password"
          autocomplete="new-password"
          placeholder="Mindestens 6 Zeichen"/>
      </div>
      <div class="form-group">
        <label class="form-label">Neues Passwort bestätigen</label>
        <input class="form-input" id="pe-confirm-pw" type="password"
          autocomplete="new-password" placeholder="Wiederholen"/>
      </div>
      <div id="pe-error" style="color:#ef5350;font-size:.85rem;margin-bottom:8px;display:none"></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" id="modal-cancel-btn"
        title="Abbrechen">${IC.x}<span class="btn-label"> Abbrechen</span>
      </button>
      <button class="btn btn-primary" id="pe-save-btn"
        title="Speichern">${IC.check}<span class="btn-label"> Speichern</span>
      </button>
    </div>
  `);

  $('#modal-close-btn')?.addEventListener('click', closeModal);
  $('#modal-cancel-btn')?.addEventListener('click', closeModal);

  $('#pe-save-btn')?.addEventListener('click', async () =>
  {
    const username = $('#pe-username').value.trim();
    const email = $('#pe-email').value.trim();
    const currentPassword = $('#pe-current-pw').value;
    const newPassword = $('#pe-new-pw').value;
    const confirmPassword = $('#pe-confirm-pw').value;

    const errEl = $('#pe-error');
    const showErr = msg =>
    {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    };
    errEl.style.display = 'none';

    if (newPassword && newPassword !== confirmPassword)
    {
      return showErr('Die neuen Passwörter stimmen nicht überein.');
    }

    const saveBtn = $('#pe-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Speichert…';

    try
    {
      const body = { username, email };
      if (newPassword)
      {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      const { user, token } = await API.auth.updateProfile(body);
      if (token)
      {
        // Passwortänderung invalidiert alte Tokens — frischen Token übernehmen
        localStorage.setItem('aniga_token', token);
        S.token = token;
      }
      S.user = { ...S.user, ...user };
      closeModal();
      const initials = (user.username || '?').substring(0, 2).toUpperCase();
      document.querySelectorAll('.user-avatar')
        .forEach(el => el.textContent = initials);
      const nameEl = document.querySelector('.user-name');
      if (nameEl)
      {
        nameEl.textContent = user.username || '';
      }
      const emailEl = document.querySelector('.user-email');
      if (emailEl)
      {
        emailEl.textContent = user.email || '';
      }
      navigate('profile');
      toast('Profil gespeichert', 'success');
    }
    catch (err)
    {
      showErr(err.message);
      saveBtn.disabled = false;
      saveBtn.innerHTML = `${IC.check}<span class="btn-label"> Speichern</span>`;
    }
  });
}
