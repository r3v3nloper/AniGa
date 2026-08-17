/* =====================================================
   AniGa – views/admin.js
   Admin-Panel: Nutzerverwaltung
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, toast, renderEmptyState, renderMain } from '../dom.js';
import { openModal, closeModal, confirmModal } from '../modal.js';
import { API } from '../api.js';
import { MEDIA_TYPES, TYPE_META } from '../media.js';

export function renderAdminView()
{
  const users = S.adminUsers;
  return `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-icon admin-icon">${IC.shield}</div>
        <div>
          <div class="page-title">Administration</div>
          <div class="page-sub">${users.length} registrierte Nutzer</div>
        </div>
      </div>
    </div>

    ${users.length ? `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Benutzer</th>
              <th>E-Mail</th>
              ${MEDIA_TYPES.map(t => `<th title="${TYPE_META[t].plural}">${TYPE_META[t].short}</th>`).join('')}
              <th>Registriert</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr data-uid="${u.id}">
                <td>
                  <div class="admin-user-cell">
                    <div class="user-avatar"
                      style="width:32px;height:32px;font-size:.75rem;flex-shrink:0">
                      ${(u.username||'?').substring(0,2).toUpperCase()}
                    </div>
                    <span class="admin-username">${esc(u.username)}</span>
                  </div>
                </td>
                <td class="admin-email">${esc(u.email)}</td>
                ${MEDIA_TYPES.map(t => `<td class="admin-count">${u[`${t}Count`] || 0}</td>`).join('')}
                <td class="admin-date">${new Date(u.created_at).toLocaleDateString('de-DE')}</td>
                <td>
                  <div class="admin-actions">
                    <button class="btn btn-secondary btn-sm btn-admin-pw"
                      data-uid="${u.id}" data-uname="${esc(u.username)}"
                      title="Passwort ändern">
                      ${IC.key} Passwort
                    </button>
                    <button class="btn btn-danger btn-sm btn-admin-del"
                      data-uid="${u.id}" data-uname="${esc(u.username)}"
                      title="Löschen">
                      ${IC.trash}
                    </button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `
      ${renderEmptyState('👤', 'Keine Benutzer', 'Noch niemand hat sich registriert.')}`}`;
}

export function bindAdminView()
{
  $$('.btn-admin-pw').forEach(btn =>
  {
    btn.addEventListener('click', () =>
      showAdminPasswordModal(+btn.dataset.uid, btn.dataset.uname));
  });
  $$('.btn-admin-del').forEach(btn =>
  {
    btn.addEventListener('click', () =>
      confirmAdminDelete(+btn.dataset.uid, btn.dataset.uname));
  });
}

function showAdminPasswordModal(uid, username)
{
  const html = `
    <div class="modal-head">
      <h2>Passwort ändern</h2>
      <button class="btn-modal-close" id="modal-close" aria-label="Schließen">${IC.x}</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text2);font-size:.9rem;margin-bottom:16px">
        Neues Passwort für <strong style="color:var(--text)">${esc(username)}</strong>:
      </p>
      <div class="form-group">
        <label class="form-label">Neues Passwort</label>
        <input class="form-input" type="password" id="new-password"
          placeholder="Mindestens 6 Zeichen" minlength="6" autocomplete="new-password"/>
      </div>
      <div class="form-group">
        <label class="form-label">Passwort bestätigen</label>
        <input class="form-input" type="password" id="confirm-password"
          placeholder="Passwort wiederholen" autocomplete="new-password"/>
      </div>
      <div class="form-error" id="pw-error"></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" id="modal-cancel"
        title="Abbrechen">${IC.x}<span class="btn-label"> Abbrechen</span>
      </button>
      <button class="btn btn-primary" id="btn-save-pw"
        title="Speichern">${IC.key}<span class="btn-label"> Speichern</span>
      </button>
    </div>`;

  openModal(html, () =>
  {
    $('#modal-close')?.addEventListener('click', closeModal);
    $('#modal-cancel')?.addEventListener('click', closeModal);
    $('#new-password')?.focus();

    $('#btn-save-pw')?.addEventListener('click', async () =>
    {
      const pw = $('#new-password').value;
      const confirm = $('#confirm-password').value;
      const errEl = $('#pw-error');
      errEl.classList.remove('show');

      if (pw.length < 6)
      {
        errEl.textContent = 'Mindestens 6 Zeichen erforderlich';
        errEl.classList.add('show');
        return;
      }
      if (pw !== confirm)
      {
        errEl.textContent = 'Passwörter stimmen nicht überein';
        errEl.classList.add('show');
        return;
      }

      const btn = $('#btn-save-pw');
      btn.disabled = true;
      btn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px"></div>`;
      try
      {
        await API.admin.changePassword(uid, pw);
        toast(`Passwort für „${username}" geändert`, 'success');
        closeModal();
      }
      catch (e)
      {
        errEl.textContent = e.message;
        errEl.classList.add('show');
        btn.disabled = false;
        btn.innerHTML = `${IC.key}<span class="btn-label"> Speichern</span>`;
      }
    });
  });
}

async function confirmAdminDelete(uid, username)
{
  const ok = await confirmModal({
    title: 'Benutzer löschen',
    message: `Benutzer „${username}" wirklich löschen?\n\n`
      + 'Dadurch werden auch alle Listen-Einträge und Follows unwiderruflich entfernt.',
    confirmLabel: 'Löschen', danger: true,
  });
  if (!ok)
  {
    return;
  }
  try
  {
    await API.admin.deleteUser(uid);
    S.adminUsers = S.adminUsers.filter(u => u.id !== uid);
    toast(`Benutzer „${username}" gelöscht`, 'success');
    renderMain(renderAdminView(), bindAdminView);
  }
  catch (e)
  {
    toast(e.message, 'error');
  }
}
