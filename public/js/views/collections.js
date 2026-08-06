/* =====================================================
   AniGa – views/collections.js
   Eigene Collections: Übersicht, Detail, Verwaltung
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, coverImg, toast, renderEmptyState } from '../dom.js';
import { API } from '../api.js';
import { entryToMedia, renderMediaCardFromEntry } from '../media.js';
import { showTrackModal } from '../modals/track.js';

export function renderCollectionsView()
{
  return S.viewingCollection ? renderCollectionDetail() : renderOverview();
}

export function bindCollectionsView()
{
  if (S.viewingCollection)
  {
    bindCollectionDetail();
  }
  else
  {
    bindOverview();
  }
}

/* Nach Modal-Speichern aufgerufen (aus refreshAfterSave), um die
   aktive Collections-Ansicht mit frischen Daten neu zu rendern */
export async function refreshCollectionsAfterSave()
{
  const main = $('#main-content');
  if (!main)
  {
    return;
  }
  S.collections = await API.collections.getAll();
  if (S.viewingCollection)
  {
    try
    {
      S.viewingCollection = await API.collections.get(S.viewingCollection.id);
    }
    catch
    {
      S.viewingCollection = null;
    }
  }
  main.innerHTML = renderCollectionsView();
  bindCollectionsView();
}

/* ---- ÜBERSICHT ---- */
function renderOverview()
{
  return `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-icon">${IC.folder}</div>
        <div>
          <div class="page-title">Collections</div>
          <div class="page-sub">${S.collections.length} eigene Sammlungen</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-new-collection">${IC.plus} Neue Collection</button>
    </div>

    ${S.collections.length ? `
      <div class="media-grid">
        ${S.collections.map(c => renderCollectionCard(c)).join('')}
      </div>` : renderEmptyState('📂', 'Noch keine Collections',
        'Erstelle Sammlungen wie „ReWatch" oder „Favoriten" und ordne deine Einträge frei zu — ein Titel kann in beliebig vielen Collections sein.',
        `<button class="btn btn-primary" id="btn-new-collection-empty">${IC.plus} Erste Collection erstellen</button>`)}`;
}

function renderCollectionCard(c)
{
  const covers = (c.covers || []).slice(0, 4);
  return `
    <div class="media-card collection-card" data-collection-id="${c.id}">
      <div class="media-card-cover">
        <div class="collection-mosaic covers-${covers.length}">
          ${covers.length
            ? covers.map(u => `<img src="${esc(u)}" alt="" loading="lazy"/>`).join('')
            : `<div class="collection-mosaic-placeholder">${IC.folder}</div>`}
        </div>
        <div class="media-card-overlay">
          <div class="media-card-title">${c.emoji ? esc(c.emoji) + ' ' : ''}${esc(c.name)}</div>
        </div>
      </div>
      <div class="media-card-footer">
        <span class="media-card-type">${c.itemCount} ${c.itemCount === 1 ? 'Eintrag' : 'Einträge'}</span>
        <span class="collection-open-hint">${IC.chevR}</span>
      </div>
    </div>`;
}

function bindOverview()
{
  // Im Leerzustand existieren beide Buttons (Header + Empty-State) — beide binden
  $('#btn-new-collection')?.addEventListener('click', createCollectionPrompt);
  $('#btn-new-collection-empty')?.addEventListener('click', createCollectionPrompt);

  $$('.collection-card').forEach(card =>
  {
    card.addEventListener('click', () => showCollection(+card.dataset.collectionId));
  });
}

async function createCollectionPrompt()
{
  const name = prompt('Name der neuen Collection (z.B. "ReWatch"):');
  if (!name || !name.trim())
  {
    return;
  }
  try
  {
    const created = await API.collections.create(name.trim());
    S.collections.push(created);
    S.collections.sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
    toast(`Collection „${created.name}" erstellt`, 'success');
    const main = $('#main-content');
    main.innerHTML = renderOverview();
    bindOverview();
  }
  catch (e)
  {
    toast(e.message, 'error');
  }
}

async function showCollection(id)
{
  const main = $('#main-content');
  main.innerHTML = '<div class="loader-wrap"><div class="spinner"></div></div>';
  try
  {
    S.viewingCollection = await API.collections.get(id);
    main.innerHTML = renderCollectionDetail();
    bindCollectionDetail();
  }
  catch (e)
  {
    toast(e.message, 'error');
    S.viewingCollection = null;
    main.innerHTML = renderOverview();
    bindOverview();
  }
}

/* ---- DETAIL ---- */
function renderCollectionDetail()
{
  const c = S.viewingCollection;
  return `
    <div class="user-list-header">
      <button class="btn btn-ghost btn-sm" id="btn-back-collections">${IC.chevL} Zurück</button>
      <div class="user-list-header-info">
        <div class="user-list-header-name">${c.emoji ? esc(c.emoji) + ' ' : ''}${esc(c.name)}</div>
        <div class="user-list-header-sub">${c.items.length} ${c.items.length === 1 ? 'Eintrag' : 'Einträge'}</div>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;flex-shrink:0">
        <button class="btn btn-secondary btn-sm" id="btn-rename-collection" title="Umbenennen">${IC.edit}</button>
        <button class="btn btn-danger btn-sm" id="btn-delete-collection" title="Löschen">${IC.trash}</button>
      </div>
    </div>

    ${c.items.length ? `
      <div class="media-grid">
        ${c.items.map(e => `
          <div class="collection-item-wrap" data-entry-id="${e.id}">
            ${renderMediaCardFromEntry(e)}
            <button class="btn-remove-from-collection" data-entry-id="${e.id}"
              title="Aus Collection entfernen">${IC.x}</button>
          </div>`).join('')}
      </div>` : renderEmptyState('📂', 'Noch leer',
        'Füge Einträge über das Bearbeiten-Modal hinzu — dort findest du die Collection-Chips.')}`;
}

function bindCollectionDetail()
{
  $('#btn-back-collections')?.addEventListener('click', () =>
  {
    S.viewingCollection = null;
    const main = $('#main-content');
    main.innerHTML = renderOverview();
    bindOverview();
  });

  $('#btn-rename-collection')?.addEventListener('click', async () =>
  {
    const c = S.viewingCollection;
    const name = prompt('Neuer Name:', c.name);
    if (!name || !name.trim() || name.trim() === c.name)
    {
      return;
    }
    try
    {
      await API.collections.rename(c.id, name.trim(), c.emoji);
      c.name = name.trim();
      toast('Collection umbenannt', 'success');
      const main = $('#main-content');
      main.innerHTML = renderCollectionDetail();
      bindCollectionDetail();
    }
    catch (e)
    {
      toast(e.message, 'error');
    }
  });

  $('#btn-delete-collection')?.addEventListener('click', async () =>
  {
    const c = S.viewingCollection;
    if (!confirm(`Collection „${c.name}" löschen?\n\nDie Einträge selbst bleiben in deinen Listen erhalten.`))
    {
      return;
    }
    try
    {
      await API.collections.remove(c.id);
      toast(`Collection „${c.name}" gelöscht`, 'success');
      S.viewingCollection = null;
      S.collections = await API.collections.getAll();
      const main = $('#main-content');
      main.innerHTML = renderOverview();
      bindOverview();
    }
    catch (e)
    {
      toast(e.message, 'error');
    }
  });

  // Karte öffnet das Track-Modal des eigenen Eintrags
  $$('.collection-item-wrap .media-card').forEach(card =>
  {
    card.addEventListener('click', () =>
    {
      const entryId = +card.dataset.entryId;
      const entry = S.viewingCollection.items.find(e => e.id === entryId);
      if (entry)
      {
        showTrackModal(entryToMedia(entry), entry);
      }
    });
  });

  // Schnell-Entfernen ohne Modal
  $$('.btn-remove-from-collection').forEach(btn =>
  {
    btn.addEventListener('click', async e =>
    {
      e.stopPropagation();
      const entryId = +btn.dataset.entryId;
      try
      {
        await API.collections.removeItem(S.viewingCollection.id, entryId);
        S.viewingCollection.items = S.viewingCollection.items.filter(i => i.id !== entryId);
        toast('Aus Collection entfernt', 'success');
        const main = $('#main-content');
        main.innerHTML = renderCollectionDetail();
        bindCollectionDetail();
      }
      catch (err)
      {
        toast(err.message, 'error');
      }
    });
  });
}
