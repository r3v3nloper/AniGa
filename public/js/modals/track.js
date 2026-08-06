/* =====================================================
   AniGa – modals/track.js
   Tracking-Modal (Hinzufügen/Bearbeiten) + Refresh nach Speichern
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, coverImg, toast } from '../dom.js';
import { openModal, closeModal } from '../modal.js';
import { API } from '../api.js';
import { statusesFor, getUserList, setUserList } from '../media.js';
import { navigate } from '../router.js';
import { refreshCollectionsAfterSave } from '../views/collections.js';

/* Fortschritts-Art pro Medientyp: Episoden (anime/tv), Kapitel+Seiten (manga), keine (movie) */
function kindOf(type)
{
  return {
    hasEpisodes: type === 'anime' || type === 'tv',
    isManga: type === 'manga',
    isMovie: type === 'movie',
  };
}

function renderTrackModalBody(media, existingEntry)
{
  const { hasEpisodes, isManga } = kindOf(media.type);
  const statuses = statusesFor(media.type);
  const entry = existingEntry || {};
  const curStatus = entry.list_status || (isManga ? 'reading' : 'watching');
  const synopsis = media.synopsis || '';
  const maxEp = media.episodes || 99999;
  const maxCh = media.chapters || 99999;

  return `
    <div class="modal-head">
      <h2>${existingEntry ? 'Eintrag bearbeiten' : 'Zur Liste hinzufügen'}</h2>
      <button class="btn-modal-close" id="modal-close" aria-label="Schließen">${IC.x}</button>
    </div>
    <div class="modal-body">
      <div class="media-detail-hero">
        ${media.image_url
          ? `<img class="media-detail-bg" src="${esc(media.image_url)}" alt=""/>`
          : '<div style="height:130px;background:var(--bg3)"></div>'}
        <div class="media-detail-info">
          <div class="media-detail-cover">${coverImg(media.image_url,media.title)}</div>
          <div class="media-detail-titles">
            <div class="media-detail-title">${esc(media.title)}</div>
            ${media.title_english&&media.title_english!==media.title
              ?`<div class="media-detail-title-alt">${esc(media.title_english)}</div>`:''}
          </div>
        </div>
      </div>

      <div class="media-meta">
        ${media.api_score
          ? `<div class="meta-chip">${IC.star}` +
            `<span style="color:var(--star)">${media.api_score.toFixed(1)}</span> ${media.source==='tmdb'?'TMDB':'MAL'}</div>`
          : ''}
        ${hasEpisodes&&media.episodes?`<div class="meta-chip">${IC.play} ${media.episodes} Folgen</div>`:''}
        ${media.type==='tv'&&media.volumes?`<div class="meta-chip">${IC.monitor} ${media.volumes} Staffeln</div>`:''}
        ${isManga&&media.chapters?`<div class="meta-chip">${IC.book} ${media.chapters} Kapitel</div>`:''}
        ${isManga&&media.volumes?`<div class="meta-chip">📦 ${media.volumes} Bände</div>`:''}
        ${media.media_status?`<div class="meta-chip">${IC.info} ${esc(media.media_status)}</div>`:''}
        ${media.year?`<div class="meta-chip">${IC.calendar} ${media.year}</div>`:''}
      </div>

      ${media.genres&&media.genres.length?`
        <div class="genre-tags" style="margin-bottom:12px">
          ${media.genres.slice(0,8).map(g=>`<span class="genre-tag">${esc(g)}</span>`).join('')}
        </div>`:'' }

      ${synopsis?`
        <div style="margin-bottom:14px">
          <p class="synopsis-text" id="syn-text">${esc(synopsis)}</p>
          ${synopsis.length>220?`<button class="btn-synopsis" id="btn-expand">Mehr anzeigen</button>`:''}
        </div>`:''}

      ${media.type === 'anime' && media.mal_id ? `
        <div id="streaming-section" style="margin-bottom:14px">
          <div class="streaming-loading">${IC.play} Streaming wird geladen…</div>
        </div>` : ''}

      <div class="divider"></div>
      <h3 style="font-size:.95rem;font-weight:700;margin-bottom:14px">Meine Liste</h3>

      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-input" id="track-status">
          ${statuses.map(s=>`<option value="${s.val}"${curStatus===s.val?' selected':''}>${s.label}</option>`).join('')}
        </select>
      </div>

      ${hasEpisodes ? `
        <div class="form-group">
          <label class="form-label">Aktuelle Episode${media.episodes?' / '+media.episodes:''}</label>
          <div class="num-input-wrap">
            <button class="num-btn" id="ep-m">−</button>
            <input class="num-input" type="number" id="track-ep"
              min="0" max="${maxEp}" value="${entry.current_episode||0}"/>
            <button class="num-btn" id="ep-p">+</button>
          </div>
        </div>` : ''}
      ${isManga ? `
        <div class="form-group">
          <label class="form-label">Aktuelles Kapitel${media.chapters?' / '+media.chapters:''}</label>
          <div class="num-input-wrap">
            <button class="num-btn" id="ch-m">−</button>
            <input class="num-input" type="number" id="track-ch"
              min="0" max="${maxCh}" value="${entry.current_chapter||0}"/>
            <button class="num-btn" id="ch-p">+</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Aktuelle Seite</label>
          <div class="num-input-wrap">
            <button class="num-btn" id="pg-m">−</button>
            <input class="num-input" type="number" id="track-pg" min="0" value="${entry.current_page||0}"/>
            <button class="num-btn" id="pg-p">+</button>
          </div>
        </div>` : ''}

      <div class="form-group">
        <label class="form-label">Meine Bewertung</label>
        <div class="stars" id="star-rating">
          ${Array.from({length:5},(_,i)=>`
            <button class="star-btn ${i<(entry.user_score||0)?'on':''}" data-star="${i+1}">${IC.star}</button>
          `).join('')}
        </div>
        <input type="hidden" id="track-score" value="${entry.user_score||0}"/>
      </div>

      <div class="form-group">
        <label class="form-label">Notizen (optional)</label>
        <textarea class="form-input" id="track-notes" rows="2"
          placeholder="Deine Gedanken…">${esc(entry.notes||'')}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label toggle-row" style="display:flex;align-items:center;gap:10px;cursor:pointer">
          <span>Physisch im Besitz</span>
          <span class="toggle-switch">
            <input type="checkbox" id="track-owned" ${entry.owned ? 'checked' : ''}/>
            <span class="toggle-slider"></span>
          </span>
        </label>
      </div>

      ${isManga ? `
      <div class="form-group" id="owned-volumes-group" style="display:${entry.owned?'block':'none'}">
        <label class="form-label">Bände im Besitz${media.volumes?' / '+media.volumes:''}</label>
        <div class="num-input-wrap">
          <button class="num-btn" id="ov-m">−</button>
          <input class="num-input" type="number" id="track-owned-vol"
            min="0" max="${media.volumes||99999}" value="${entry.owned_volumes||0}"/>
          <button class="num-btn" id="ov-p">+</button>
        </div>
      </div>` : ''}

      <div class="form-group">
        <label class="form-label">Collections</label>
        <div class="collection-chips" id="collection-chips">
          <span style="color:var(--text3);font-size:.8rem">Wird geladen…</span>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Startdatum</label>
          <input class="form-input" type="date" id="track-start" value="${entry.started_at||''}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Enddatum</label>
          <input class="form-input" type="date" id="track-end" value="${entry.completed_at||''}"/>
        </div>
      </div>
    </div>

    <div class="modal-foot">
      ${existingEntry
        ? `<button class="btn btn-danger btn-sm" id="btn-delete"
            title="Entfernen">${IC.trash}<span class="btn-label"> Entfernen</span>
          </button>`
        : ''}
      <div style="flex:1"></div>
      <button class="btn btn-secondary" id="modal-cancel"
        title="Abbrechen">${IC.x}<span class="btn-label"> Abbrechen</span>
      </button>
      <button class="btn btn-primary" id="btn-save"
        title="Speichern">${IC.check}<span class="btn-label"> Speichern</span>
      </button>
    </div>`;
}

const STREAMING_COLORS = {
  'Crunchyroll': '#f47521',
  'Netflix':     '#e50914',
  'Amazon Prime Video': '#00a8e0',
  'Funimation':  '#410099',
  'HIDIVE':      '#00baff',
};

function bindTrackModalStreaming(media)
{
  if (media.type !== 'anime' || !media.mal_id)
  {
    return;
  }
  API.search.getStreaming(media.mal_id).then(services =>
  {
    const sec = $('#streaming-section');
    if (!sec)
    {
      return;
    }
    if (!services.length)
    {
      sec.remove();
      return;
    }
    sec.innerHTML = `
      <div class="streaming-label">${IC.play} Verfügbar auf</div>
      <div class="streaming-chips">
        ${services.map(s =>
        {
          const col = STREAMING_COLORS[s.name] || 'var(--accent)';
          return `<a class="streaming-chip" href="${esc(s.url)}" target="_blank" rel="noopener"
            style="--sc:#${col.startsWith('#') ? col.slice(1) : ''}; border-color:${col}; color:${col}">
            ${esc(s.name)}
          </a>`;
        }).join('')}
      </div>`;
  }).catch(() =>
  {
    $('#streaming-section')?.remove();
  });
}

function bindTrackModalNumbers(kind, maxEp, maxCh)
{
  const { hasEpisodes, isManga } = kind;
  function bindNum(mId, pId, inputId, min = 0, max = 99999)
  {
    const inp = document.getElementById(inputId);
    if (!inp)
    {
      return;
    }
    document.getElementById(mId)?.addEventListener('click', () =>
    {
      inp.value = Math.max(min, +inp.value - 1);
    });
    document.getElementById(pId)?.addEventListener('click', () =>
    {
      inp.value = Math.min(max, +inp.value + 1);
    });
  }

  if (hasEpisodes)
  {
    bindNum('ep-m', 'ep-p', 'track-ep', 0, maxEp);
  }
  if (isManga)
  {
    bindNum('ch-m', 'ch-p', 'track-ch', 0, maxCh);
    bindNum('pg-m', 'pg-p', 'track-pg');
  }

  // Ownership toggle & volumes
  const ownedCb = $('#track-owned');
  const volGroup = $('#owned-volumes-group');
  if (ownedCb)
  {
    ownedCb.addEventListener('change', () =>
    {
      if (volGroup)
      {
        volGroup.style.display = ownedCb.checked ? 'block' : 'none';
      }
    });
  }
  bindNum('ov-m', 'ov-p', 'track-owned-vol', 0, 99999);

  $('#track-status')?.addEventListener('change', () =>
  {
    if ($('#track-status').value !== 'completed')
    {
      return;
    }
    if (hasEpisodes && maxEp < 99999)
    {
      const el = $('#track-ep');
      if (el)
      {
        el.value = maxEp;
      }
    }
    else if (isManga && maxCh < 99999)
    {
      const el = $('#track-ch');
      if (el)
      {
        el.value = maxCh;
      }
    }
  });
}

/* Collection-Chips: Zugehörigkeiten togglen, neue Collection direkt anlegen.
   Änderungen werden erst beim Speichern übernommen (colState-Diff). */
async function bindTrackModalCollections(existingEntry, colState)
{
  const wrap = $('#collection-chips');
  if (!wrap)
  {
    return;
  }
  try
  {
    if (!S.collections.length)
    {
      S.collections = await API.collections.getAll();
    }
  }
  catch
  {
    wrap.closest('.form-group')?.remove();
    return;
  }

  (existingEntry?.collections || []).forEach(c =>
  {
    colState.initial.add(c.id);
    colState.selected.add(c.id);
  });

  function renderChips()
  {
    if (!document.body.contains(wrap))
    {
      return;
    }
    wrap.innerHTML = S.collections.map(c => `
      <button type="button" class="collection-chip${colState.selected.has(c.id) ? ' on' : ''}" data-cid="${c.id}">
        ${c.emoji ? esc(c.emoji) + ' ' : ''}${esc(c.name)}
      </button>`).join('')
      + `<button type="button" class="collection-chip chip-new" id="chip-new-collection">＋ Neu</button>`;

    $$('.collection-chip[data-cid]', wrap).forEach(chip =>
    {
      chip.addEventListener('click', () =>
      {
        const cid = +chip.dataset.cid;
        if (colState.selected.has(cid))
        {
          colState.selected.delete(cid);
        }
        else
        {
          colState.selected.add(cid);
        }
        chip.classList.toggle('on', colState.selected.has(cid));
      });
    });

    $('#chip-new-collection', wrap)?.addEventListener('click', async () =>
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
        colState.selected.add(created.id);
        renderChips();
      }
      catch (e)
      {
        toast(e.message, 'error');
      }
    });
  }

  renderChips();
}

/* Wendet die im Modal getroffene Chip-Auswahl auf den gespeicherten Eintrag an */
async function syncCollections(entryId, colState)
{
  if (!entryId)
  {
    return;
  }
  const adds = [...colState.selected].filter(id => !colState.initial.has(id));
  const removes = [...colState.initial].filter(id => !colState.selected.has(id));
  if (!adds.length && !removes.length)
  {
    return;
  }
  try
  {
    await Promise.all([
      ...adds.map(id => API.collections.addItem(id, entryId)),
      ...removes.map(id => API.collections.removeItem(id, entryId)),
    ]);
  }
  catch
  {
    toast('Collections konnten nicht vollständig aktualisiert werden', 'warning');
  }
}

function bindTrackModalStars()
{
  const stars = $$('.star-btn', $('#star-rating'));
  const scoreInp = $('#track-score');
  stars.forEach(star =>
  {
    const val = +star.dataset.star;
    star.addEventListener('click', () =>
    {
      const cur = +scoreInp.value;
      const nv = cur === val ? 0 : val;
      scoreInp.value = nv;
      stars.forEach((s, j) => s.classList.toggle('on', j < nv));
    });
    star.addEventListener('mouseenter', () =>
    {
      stars.forEach((s, j) => s.classList.toggle('on', j < val));
    });
    star.setAttribute('aria-label', `${val} von 5 Sternen`);
  });
  document.getElementById('star-rating')?.addEventListener('mouseleave', () =>
  {
    const cur = +scoreInp.value;
    stars.forEach((s, j) => s.classList.toggle('on', j < cur));
  });
}

function bindTrackModalSave(media, existingEntry, kind, colState)
{
  const { hasEpisodes, isManga } = kind;
  $('#btn-save')?.addEventListener('click', async () =>
  {
    const btn = $('#btn-save');
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px"></div>`;
    try
    {
      const listData = {
        listStatus: $('#track-status').value,
        currentEpisode: hasEpisodes ? +($('#track-ep')?.value || 0) : 0,
        currentChapter: isManga ? +($('#track-ch')?.value || 0) : 0,
        currentPage: isManga ? +($('#track-pg')?.value || 0) : 0,
        userScore: +($('#track-score').value) || null,
        notes: $('#track-notes').value.trim() || null,
        startedAt: $('#track-start').value || null,
        completedAt: $('#track-end').value || null,
        owned: $('#track-owned')?.checked || false,
        ownedVolumes: isManga ? +($('#track-owned-vol')?.value || 0) : 0,
      };
      let entryId = existingEntry?.id;
      if (existingEntry && (media.is_manual || !media.mal_id))
      {
        // Manuelle Einträge nur per PUT — POST würde eine neue media-Zeile anlegen
        await API.list.update(existingEntry.id, listData);
        toast('Eintrag aktualisiert!', 'success');
      }
      else
      {
        // POST-Upsert refresht nebenbei die Media-Metadaten (Episoden, Status, …)
        const saved = await API.list.save(media, listData);
        entryId = saved.entryId;
        toast(existingEntry ? 'Eintrag aktualisiert!' : `„${media.title}" zur Liste hinzugefügt!`, 'success');
      }
      await syncCollections(entryId, colState);
      closeModal();
      await refreshAfterSave(media.type);
    }
    catch (e)
    {
      toast(e.message, 'error', 'Fehler beim Speichern');
      btn.disabled = false;
      btn.innerHTML = `${IC.check}<span class="btn-label"> Speichern</span>`;
    }
  });

  $('#btn-delete')?.addEventListener('click', async () =>
  {
    if (!confirm(`„${media.title}" aus der Liste entfernen?`))
    {
      return;
    }
    try
    {
      await API.list.remove(existingEntry.id);
      toast('Aus der Liste entfernt', 'success');
      closeModal();
      await refreshAfterSave(media.type);
    }
    catch (e)
    {
      toast(e.message, 'error');
    }
  });
}

export function showTrackModal(media, existingEntry)
{
  const kind = kindOf(media.type);
  const maxEp = media.episodes || 99999;
  const maxCh = media.chapters || 99999;

  const colState = { initial: new Set(), selected: new Set() };

  openModal(renderTrackModalBody(media, existingEntry), () =>
  {
    $('#modal-close')?.addEventListener('click', closeModal);
    $('#modal-cancel')?.addEventListener('click', closeModal);

    bindTrackModalStreaming(media);
    bindTrackModalCollections(existingEntry, colState);

    $('#btn-expand')?.addEventListener('click', () =>
    {
      const st = $('#syn-text');
      const exp = st.classList.toggle('expanded');
      $('#btn-expand').textContent = exp ? 'Weniger anzeigen' : 'Mehr anzeigen';
    });

    bindTrackModalNumbers(kind, maxEp, maxCh);
    bindTrackModalStars();
    bindTrackModalSave(media, existingEntry, kind, colState);
  });
}

export async function refreshAfterSave(type)
{
  setUserList(type, await API.list.getAll(type));
  S.stats = await API.list.getStats();
  if (S.view === 'home')
  {
    S.recommendations = null;
    navigate('home');
    return;
  }
  if (S.view === type)
  {
    navigate(type);
    return;
  }
  if (S.view === 'collections')
  {
    await refreshCollectionsAfterSave();
    return;
  }
  $$('.btn-add-to-list').forEach(btn =>
  {
    const card = btn.closest('.media-card');
    if (!card || !card.dataset.malId)
    {
      return;
    }
    const ctype = card.dataset.type;
    if (ctype === type)
    {
      const inList = getUserList(type)
        .some(e=>String(e.mal_id)===card.dataset.malId);
      btn.classList.toggle('in-list', inList);
      btn.innerHTML = inList ? IC.check : IC.plus;
    }
  });
}
