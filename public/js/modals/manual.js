/* =====================================================
   AniGa – modals/manual.js
   Modal für manuelle Einträge (ohne MAL-Verknüpfung)
   ===================================================== */
import { IC } from '../icons.js';
import { $, $$, toast } from '../dom.js';
import { openModal, closeModal } from '../modal.js';
import { API } from '../api.js';
import { refreshAfterSave } from './track.js';

export function showManualModal(type = 'anime')
{
  let curType = type;

  const html = `
    <div class="modal-head">
      <h2>Manuell eintragen</h2>
      <button class="btn-modal-close" id="modal-close" aria-label="Schließen">${IC.x}</button>
    </div>
    <div class="modal-body">
      <div class="type-toggle" style="margin-bottom:16px">
        <button class="type-btn${type==='anime'?' active':''}" data-mtype="anime">🎬 Anime</button>
        <button class="type-btn${type==='manga'?' active':''}" data-mtype="manga">📚 Manga</button>
      </div>
      <div class="form-group">
        <label class="form-label">Titel *</label>
        <input class="form-input" id="m-title" type="text" placeholder="Originaltitel" required/>
      </div>
      <div class="form-group">
        <label class="form-label">Englischer Titel</label>
        <input class="form-input" id="m-title-en" type="text" placeholder="Englischer Titel (optional)"/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" id="m-count-label">${type==='anime'?'Episoden':'Kapitel'}</label>
          <input class="form-input" id="m-count" type="number" min="0" placeholder="?"/>
        </div>
        <div class="form-group">
          <label class="form-label" id="m-vol-label">${type==='anime'?'Staffeln':'Bände'}</label>
          <input class="form-input" id="m-vol" type="number" min="0" placeholder="?"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Medienstatus</label>
        <select class="form-input" id="m-status">
          <option value="">Unbekannt</option>
          <option>Currently Airing</option><option>Finished Airing</option><option>Not yet aired</option>
          <option>Publishing</option><option>Finished</option><option>On Hiatus</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Erscheinungsjahr</label>
        <input class="form-input" id="m-year" type="number" min="1950" max="2030" placeholder="z.B. 2024"/>
      </div>
      <div class="form-group">
        <label class="form-label">Cover-Bild URL (optional)</label>
        <input class="form-input" id="m-img" type="url" placeholder="https://…"/>
      </div>
      <div class="form-group">
        <label class="form-label">Beschreibung (optional)</label>
        <textarea class="form-input" id="m-synopsis" rows="3" placeholder="Kurze Zusammenfassung…"></textarea>
      </div>
      <div class="form-error" id="m-error"></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" id="modal-cancel"
        title="Abbrechen">${IC.x}<span class="btn-label"> Abbrechen</span>
      </button>
      <button class="btn btn-primary" id="btn-save-manual"
        title="Hinzufügen">${IC.plus}<span class="btn-label"> Hinzufügen</span>
      </button>
    </div>`;

  openModal(html, () =>
  {
    $('#modal-close')?.addEventListener('click', closeModal);
    $('#modal-cancel')?.addEventListener('click', closeModal);

    $$('[data-mtype]').forEach(btn =>
    {
      btn.addEventListener('click', () =>
      {
        curType = btn.dataset.mtype;
        $$('[data-mtype]').forEach(b => b.classList.toggle('active', b===btn));
        $('#m-count-label').textContent = curType==='anime'
          ? 'Episoden' : 'Kapitel';
        $('#m-vol-label').textContent = curType==='anime'
          ? 'Staffeln' : 'Bände';
      });
    });

    $('#btn-save-manual')?.addEventListener('click', async () =>
    {
      const title = $('#m-title').value.trim();
      if (!title)
      {
        const err = $('#m-error');
        err.textContent = 'Titel ist erforderlich';
        err.classList.add('show');
        return;
      }
      const btn = $('#btn-save-manual');
      btn.disabled = true;
      btn.textContent = 'Speichern…';
      const mediaData = {
        is_manual: true, type: curType, title,
        title_english: $('#m-title-en').value.trim()||null,
        image_url: $('#m-img').value.trim()||null,
        synopsis: $('#m-synopsis').value.trim()||null,
        media_status: $('#m-status').value||null,
        episodes: curType==='anime' ? +$('#m-count').value||null : null,
        chapters: curType==='manga' ? +$('#m-count').value||null : null,
        volumes: +$('#m-vol').value||null,
        year: +$('#m-year').value||null,
        genres: [],
      };
      try
      {
        await API.list.save(mediaData, {
          listStatus: curType==='anime' ? 'plan_to_watch' : 'plan_to_read'
        });
        toast(`„${title}" manuell hinzugefügt!`, 'success');
        closeModal();
        await refreshAfterSave(curType);
      }
      catch (e)
      {
        const err = $('#m-error');
        err.textContent = e.message;
        err.classList.add('show');
        btn.disabled = false;
        btn.innerHTML = `${IC.plus} Hinzufügen`;
      }
    });
  });
}
