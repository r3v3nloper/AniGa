/* =====================================================
   AniGa – dom.js
   DOM-Helfer, Formatierung, Toast
   ===================================================== */
import { IC } from './icons.js';

export const $ = (sel, ctx) => (ctx || document).querySelector(sel);
export const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

export function esc(str)
{
  if (!str)
  {
    return '';
  }
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

export function timeAgo(dateStr)
{
  if (!dateStr)
  {
    return '';
  }
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)
  {
    return 'Gerade eben';
  }
  if (diff < 3600)
  {
    return `vor ${Math.floor(diff/60)} Min.`;
  }
  if (diff < 86400)
  {
    return `vor ${Math.floor(diff/3600)} Std.`;
  }
  if (diff < 604800)
  {
    return `vor ${Math.floor(diff/86400)} Tagen`;
  }
  return new Date(dateStr).toLocaleDateString('de-DE');
}

export function debounce(fn, ms)
{
  let t;
  return (...a) =>
  {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

export function coverImg(url, title)
{
  const short = (title || '').substring(0, 12);
  if (url)
  {
    return `<img class="cover-img" src="${esc(url)}" alt="${esc(title||'')}"
      data-fb="${esc(short)}" loading="lazy"/>`;
  }
  return `<div class="no-cover"><span>🖼️</span><span>${esc(short)}</span></div>`;
}

/* Delegierter Fallback für kaputte Cover-Bilder — ersetzt Inline-onerror (XSS-sicher,
   da der Fallback-Text via textContent gesetzt wird statt als HTML interpretiert) */
document.addEventListener('error', e =>
{
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains('cover-img'))
  {
    return;
  }
  const fallback = document.createElement('div');
  fallback.className = 'no-cover';
  const icon = document.createElement('span');
  icon.textContent = '🖼️';
  const label = document.createElement('span');
  label.textContent = img.dataset.fb || '';
  fallback.append(icon, label);
  img.replaceWith(fallback);
}, true);

/* Rendert Markup in ein Element und hängt die zugehörigen Listener direkt an.
   Render und Bind gehören immer zusammen — als getrenntes Anweisungspaar liefen
   sie an 39 Stellen Gefahr, auseinanderzulaufen. */
export function renderInto(el, html, bind)
{
  if (!el)
  {
    return;
  }
  el.innerHTML = html;
  if (bind)
  {
    bind();
  }
}

/* Kurzform für den Haupt-Content-Bereich */
export function renderMain(html, bind)
{
  renderInto($('#main-content'), html, bind);
}

const SPINNER_HTML = '<div class="loader-wrap"><div class="spinner"></div></div>';

export function showSpinner(el = $('#main-content'))
{
  renderInto(el, SPINNER_HTML);
}

export function spinnerHtml()
{
  return SPINNER_HTML;
}

/* emoji/title/msg werden hier escapt — Aufrufer dürfen (und sollen) Fehlermeldungen
   und Nutzernamen roh übergeben. Nur `btn` ist bewusst rohes HTML. */
export function renderEmptyState(emoji, title, msg, btn = '', wrapStyle = '')
{
  return `<div class="empty-state"${wrapStyle ? ` style="${wrapStyle}"` : ''}>
    <div class="empty-state-emoji">${esc(emoji)}</div>
    ${title ? `<h3>${esc(title)}</h3>` : ''}
    ${msg ? `<p>${esc(msg)}</p>` : ''}
    ${btn}
  </div>`;
}

/* Macht ein nicht-interaktives Element (Karte, Listenzeile) wie einen Button bedienbar:
   per Maus, per Tab-Fokus und per Enter/Leertaste. Ohne das sind die Karten für
   Tastatur- und Screenreader-Nutzer unerreichbar. */
export function bindActivate(el, handler)
{
  if (!el)
  {
    return;
  }
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.addEventListener('click', handler);
  el.addEventListener('keydown', e =>
  {
    if (e.key === 'Enter' || e.key === ' ')
    {
      e.preventDefault();
      handler(e);
    }
  });
}

export function bindStatusTabs(selector, dataKey, onChange)
{
  $$(selector).forEach(t =>
  {
    t.addEventListener('click', () =>
    {
      $$(selector).forEach(x => x.classList.toggle('active', x === t));
      onChange(t.dataset[dataKey]);
    });
  });
}

export function bindViewToggle(gridId, listId, onChange)
{
  $(gridId)?.addEventListener('click', () =>
  {
    $(gridId).classList.add('active');
    $(listId).classList.remove('active');
    onChange('grid');
  });
  $(listId)?.addEventListener('click', () =>
  {
    $(listId).classList.add('active');
    $(gridId).classList.remove('active');
    onChange('list');
  });
}

export function toast(msg, type = 'info', title = '')
{
  const iconMap = { success: IC.check, error: IC.x, warning: IC.warn, info: IC.info };
  const t = document.createElement('div');
  t.className = `toast t-${type}`;
  t.innerHTML = `<div class="toast-icon">${iconMap[type]||IC.info}</div>
    <div class="toast-content">
      ${title?`<div class="toast-title">${esc(title)}</div>`:''}
      <div class="toast-msg">${esc(msg)}</div>
    </div>`;
  document.getElementById('toasts').prepend(t);
  setTimeout(() =>
  {
    t.style.opacity = '0';
    t.style.transform = 'translateX(120%)';
    t.style.transition = 'all .2s';
    setTimeout(() => t.remove(), 220);
  }, 3500);
}
