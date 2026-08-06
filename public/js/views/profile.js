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

export function renderProfile()
{
  const u = S.user || {};
  const a = S.stats?.anime || {};
  const m = S.stats?.manga || {};
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

    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-num">${a.total||0}</div>
        <div class="stat-label">Anime gesamt</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${a.total_episodes||0}</div>
        <div class="stat-label">Episoden gesehen</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${a.completed||0}</div>
        <div class="stat-label">Anime abgeschlossen</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${m.total||0}</div>
        <div class="stat-label">Manga gesamt</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${m.total_chapters||0}</div>
        <div class="stat-label">Kapitel gelesen</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${m.completed||0}</div>
        <div class="stat-label">Manga abgeschlossen</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px">
      <div class="stats-detail">
        <h3>${IC.tv} Anime</h3>
        <div class="stats-row">
          ${[['Schaut gerade',a.watching||0,'#00e5ff'],['Abgeschlossen',a.completed||0,'#4caf50'],
             ['Geplant',a.plan_to_watch||0,'#7c4dff'],['Pausiert',a.on_hold||0,'#ff9800'],
             ['Abgebrochen',a.dropped||0,'#ef5350']].map(([l,v,c])=>`
            <div class="stats-item">
              <span class="stats-item-label"><span class="stats-dot" style="background:${c}"></span>${l}</span>
              <span class="stats-item-val">${v}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="stats-detail">
        <h3>${IC.book} Manga</h3>
        <div class="stats-row">
          ${[['Liest gerade',m.reading||0,'#00e5ff'],['Abgeschlossen',m.completed||0,'#4caf50'],
             ['Geplant',m.plan_to_read||0,'#7c4dff'],['Pausiert',m.on_hold||0,'#ff9800'],
             ['Abgebrochen',m.dropped||0,'#ef5350']].map(([l,v,c])=>`
            <div class="stats-item">
              <span class="stats-item-label"><span class="stats-dot" style="background:${c}"></span>${l}</span>
              <span class="stats-item-val">${v}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap">
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
