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

export function renderEmptyState(emoji, title, msg, btn = '', wrapStyle = '')
{
  return `<div class="empty-state"${wrapStyle ? ` style="${wrapStyle}"` : ''}>
    <div class="empty-state-emoji">${emoji}</div>
    ${title ? `<h3>${title}</h3>` : ''}
    ${msg ? `<p>${msg}</p>` : ''}
    ${btn}
  </div>`;
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
