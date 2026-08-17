/* =====================================================
   AniGa – modal.js
   Generisches Modal-Overlay (öffnen/schließen, ESC, Fokus-Verwaltung)
   ===================================================== */
import { IC } from './icons.js';
import { $, esc } from './dom.js';

let _modal = null;
let _lastFocused = null;
/* Wird aufgerufen, wenn das Modal ohne explizite Entscheidung schließt
   (ESC, Klick aufs Overlay, Schließen-Kreuz) — nötig für die Promise-Dialoge unten. */
let _onDismiss = null;

const FOCUSABLE = [
  'button:not([disabled])', '[href]', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function focusableItems()
{
  // offsetParent === null filtert ausgeblendete Felder (z.B. Bände-Zähler)
  return [..._modal.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
}

export function openModal(html, afterRender, onDismiss = null)
{
  closeModal();
  _onDismiss = onDismiss;
  _lastFocused = document.activeElement;

  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.id = 'modal-overlay';
  ov.innerHTML = `<div class="modal" id="modal-box" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
  document.body.appendChild(ov);
  _modal = ov;

  ov.addEventListener('click', e =>
  {
    if (e.target === ov)
    {
      closeModal();
    }
  });
  document.addEventListener('keydown', _modalKey);

  if (afterRender)
  {
    afterRender();
  }

  const box = ov.querySelector('#modal-box');
  // Überschrift als Label verknüpfen — Screenreader kündigen den Dialog damit benannt an
  const heading = box.querySelector('h2');
  if (heading)
  {
    heading.id = heading.id || 'modal-title';
    box.setAttribute('aria-labelledby', heading.id);
  }
  (focusableItems()[0] || box).focus();
}

export function closeModal()
{
  // Erst leeren, dann aufrufen — sonst ruft sich der Dismiss-Pfad rekursiv auf
  const dismiss = _onDismiss;
  _onDismiss = null;

  if (_modal)
  {
    _modal.remove();
    _modal = null;
  }
  document.removeEventListener('keydown', _modalKey);
  // Fokus zurück auf das auslösende Element, statt ihn an den Seitenanfang zu verlieren
  if (_lastFocused && document.body.contains(_lastFocused))
  {
    _lastFocused.focus();
  }
  _lastFocused = null;

  if (dismiss)
  {
    dismiss();
  }
}

function _modalKey(e)
{
  if (e.key === 'Escape')
  {
    closeModal();
    return;
  }
  if (e.key !== 'Tab' || !_modal)
  {
    return;
  }

  // Fokus-Falle: Tab darf den Dialog nicht verlassen, solange er offen ist
  const items = focusableItems();
  if (!items.length)
  {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first)
  {
    e.preventDefault();
    last.focus();
  }
  else if (!e.shiftKey && document.activeElement === last)
  {
    e.preventDefault();
    first.focus();
  }
}

/* ---- DIALOGE STATT NATIVER prompt()/confirm() ----
   Native Dialoge sind unstyled, in installierten PWAs teils unterdrückt und
   blockieren den Thread. Beide Helfer liefern ein Promise.
   ACHTUNG: Modals stapeln sich nicht — nicht aus einem offenen Modal heraus aufrufen. */

export function confirmModal({ title, message, confirmLabel = 'OK',
  cancelLabel = 'Abbrechen', danger = false })
{
  return new Promise(resolve =>
  {
    let done = false;
    const finish = (value) =>
    {
      if (done)
      {
        return;
      }
      done = true;
      closeModal();
      resolve(value);
    };

    openModal(`
      <div class="modal-head">
        <h2>${esc(title)}</h2>
        <button class="btn-modal-close" id="cm-close" aria-label="Schließen">${IC.x}</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text2);font-size:.9rem;white-space:pre-line">${esc(message)}</p>
      </div>
      <div class="modal-foot">
        <div style="flex:1"></div>
        <button class="btn btn-secondary" id="cm-cancel">${esc(cancelLabel)}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="cm-ok">${esc(confirmLabel)}</button>
      </div>`, () =>
    {
      $('#cm-close')?.addEventListener('click', () => finish(false));
      $('#cm-cancel')?.addEventListener('click', () => finish(false));
      $('#cm-ok')?.addEventListener('click', () => finish(true));
    },
    // ESC oder Klick aufs Overlay zählt als Abbruch
    () => finish(false));
  });
}

export function promptModal({ title, label, value = '', placeholder = '',
  confirmLabel = 'Speichern', maxLength = 50 })
{
  return new Promise(resolve =>
  {
    let done = false;
    const finish = (result) =>
    {
      if (done)
      {
        return;
      }
      done = true;
      closeModal();
      resolve(result);
    };

    openModal(`
      <div class="modal-head">
        <h2>${esc(title)}</h2>
        <button class="btn-modal-close" id="pm-close" aria-label="Schließen">${IC.x}</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label" for="pm-input">${esc(label)}</label>
          <input class="form-input" id="pm-input" type="text" maxlength="${maxLength}"
            value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"/>
        </div>
      </div>
      <div class="modal-foot">
        <div style="flex:1"></div>
        <button class="btn btn-secondary" id="pm-cancel">Abbrechen</button>
        <button class="btn btn-primary" id="pm-ok">${esc(confirmLabel)}</button>
      </div>`, () =>
    {
      const input = $('#pm-input');
      const submit = () =>
      {
        const v = input.value.trim();
        finish(v || null);
      };
      $('#pm-close')?.addEventListener('click', () => finish(null));
      $('#pm-cancel')?.addEventListener('click', () => finish(null));
      $('#pm-ok')?.addEventListener('click', submit);
      input?.addEventListener('keydown', e =>
      {
        if (e.key === 'Enter')
        {
          submit();
        }
      });
      // Texteingabe fokussieren statt des Schließen-Buttons
      setTimeout(() => input?.select(), 0);
    },
    () => finish(null));
  });
}
