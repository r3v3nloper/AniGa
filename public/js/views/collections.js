/* =====================================================
   AniGa – views/collections.js
   Eigene Collections: Übersicht, Detail, Verwaltung
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, toast, renderEmptyState, renderMain, showSpinner,
  bindActivate } from '../dom.js';
import { confirmModal, promptModal } from '../modal.js';
import { API } from '../api.js';
import { renderMediaCardFromEntry, openEntryTrackModal } from '../media.js';

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

/* Die beiden Ansichten dieser View immer über diese Helfer neu zeichnen —
   so bleiben Markup und Listener zwangsläufig zusammen. */
function showOverview()
{
  renderMain(renderOverview(), bindOverview);
}

function showDetail()
{
  renderMain(renderCollectionDetail(), bindCollectionDetail);
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
  renderMain(renderCollectionsView(), bindCollectionsView);
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
    bindActivate(card, () => showCollection(+card.dataset.collectionId));
  });
}

/* Legt eine Collection an und pflegt sie sortiert in den State ein.
   Einzige Stelle dafür — das Track-Modal nutzt sie ebenfalls (vorher dupliziert).
   Liefert die neue Collection oder null (bei Fehler wird bereits ein Toast gezeigt). */
export async function createCollection(name)
{
  try
  {
    const created = await API.collections.create(name.trim());
    S.collections.push(created);
    S.collections.sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
    return created;
  }
  catch (e)
  {
    toast(e.message, 'error');
    return null;
  }
}

async function createCollectionPrompt()
{
  const name = await promptModal({
    title: 'Neue Collection',
    label: 'Name',
    placeholder: 'z.B. ReWatch',
    confirmLabel: 'Erstellen',
  });
  if (!name)
  {
    return;
  }
  const created = await createCollection(name);
  if (created)
  {
    toast(`Collection „${created.name}" erstellt`, 'success');
    showOverview();
  }
}

async function showCollection(id)
{
  showSpinner();
  try
  {
    S.viewingCollection = await API.collections.get(id);
    showDetail();
  }
  catch (e)
  {
    toast(e.message, 'error');
    S.viewingCollection = null;
    showOverview();
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
    showOverview();
  });

  $('#btn-rename-collection')?.addEventListener('click', async () =>
  {
    const c = S.viewingCollection;
    const name = await promptModal({
      title: 'Collection umbenennen', label: 'Name', value: c.name,
    });
    if (!name || name === c.name)
    {
      return;
    }
    try
    {
      await API.collections.rename(c.id, name, c.emoji);
      c.name = name;
      toast('Collection umbenannt', 'success');
      showDetail();
    }
    catch (e)
    {
      toast(e.message, 'error');
    }
  });

  $('#btn-delete-collection')?.addEventListener('click', async () =>
  {
    const c = S.viewingCollection;
    const ok = await confirmModal({
      title: 'Collection löschen',
      message: `Collection „${c.name}" wirklich löschen?\n\nDie Einträge selbst bleiben in deinen Listen erhalten.`,
      confirmLabel: 'Löschen', danger: true,
    });
    if (!ok)
    {
      return;
    }
    try
    {
      await API.collections.remove(c.id);
      toast(`Collection „${c.name}" gelöscht`, 'success');
      S.viewingCollection = null;
      S.collections = await API.collections.getAll();
      showOverview();
    }
    catch (e)
    {
      toast(e.message, 'error');
    }
  });

  // Karte öffnet das Track-Modal des eigenen Eintrags
  $$('.collection-item-wrap .media-card').forEach(card =>
  {
    bindActivate(card, () =>
    {
      const entryId = +card.dataset.entryId;
      const entry = S.viewingCollection.items.find(e => e.id === entryId);
      if (entry)
      {
        openEntryTrackModal(entry);
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
        showDetail();
      }
      catch (err)
      {
        toast(err.message, 'error');
      }
    });
  });
}
