/* =====================================================
   AniGa – modals/track.js
   Tracking-Modal (Hinzufügen/Bearbeiten) + Refresh nach Speichern
   ===================================================== */
import { IC } from '../icons.js';
import { S } from '../state.js';
import { $, $$, esc, toast } from '../dom.js';
import { openModal, closeModal } from '../modal.js';
import { API } from '../api.js';
import { statusesFor, defaultStatusFor, getUserList, setUserList, TYPE_META, playtimeText,
  mediaHeroHtml, mediaMetaChipsHtml, genreTagsHtml, synopsisHtml, bindSynopsisToggle } from '../media.js';
import { navigate } from '../router.js';
import { refreshCollectionsAfterSave, createCollection } from '../views/collections.js';

/* Fortschritts-Art pro Medientyp — steuert, welche Eingabefelder das Modal zeigt.
   Ohne Zähler (Filme, Spiele) bleiben Episoden-/Kapitel-Felder komplett weg. */
function kindOf(type)
{
  const meta = TYPE_META[type] || {};
  return {
    hasEpisodes: meta.progress === 'episodes',
    isTv: type === 'tv',
    isManga: meta.progress === 'chapters',
  };
}

/* Episodenzahl einer bestimmten Staffel (aus TMDB seasons_data) */
function episodesOfSeason(seasons, seasonNum)
{
  return seasons?.find(s => s.season === +seasonNum)?.episodes || null;
}

/* Zerlegt eine absolute Episodennummer in Staffel + Episode-in-Staffel
   (Migration alter Serien-Einträge, die noch absolut gezählt haben) */
function splitAbsoluteEpisode(abs, seasons)
{
  let rest = abs;
  for (const s of seasons)
  {
    if (rest <= s.episodes)
    {
      return { season: s.season, episode: rest };
    }
    rest -= s.episodes;
  }
  const last = seasons[seasons.length - 1];
  return { season: last.season, episode: last.episodes };
}

/* Ausgangswerte für Serien: Staffel + Episode-in-Staffel.
   Alte Einträge mit absoluter Zählung werden dabei einmalig umgerechnet. */
function seasonState(media, entry, isTv)
{
  const seasons = isTv && Array.isArray(media.seasons_data) ? media.seasons_data : null;
  let season = entry.current_season || 1;
  let episode = entry.current_episode || 0;
  if (isTv && !entry.current_season && episode > 0 && seasons)
  {
    ({ season, episode } = splitAbsoluteEpisode(episode, seasons));
  }
  return {
    seasons, season, episode,
    maxSeason: seasons ? seasons[seasons.length - 1].season : (media.volumes || 99999),
    maxEpisode: isTv
      ? (episodesOfSeason(seasons, season) || 99999)
      : (media.episodes || 99999),
  };
}

/* Zähler-Eingabefeld mit −/+-Buttons */
function numFieldHtml({ label, labelId, id, min = 0, max = 99999, value = 0, minusId, plusId })
{
  return `
    <div class="form-group">
      <label class="form-label"${labelId ? ` id="${labelId}"` : ''} for="${id}">${label}</label>
      <div class="num-input-wrap">
        <button class="num-btn" id="${minusId}" type="button" aria-label="Weniger">−</button>
        <input class="num-input" type="number" id="${id}" min="${min}" max="${max}" value="${value}"/>
        <button class="num-btn" id="${plusId}" type="button" aria-label="Mehr">+</button>
      </div>
    </div>`;
}

/* Fortschrittsfelder je Medientyp — Filme und Spiele bekommen gar keine */
function progressFieldsHtml(media, kind, entry, se)
{
  const { hasEpisodes, isTv, isManga } = kind;

  if (isTv)
  {
    return `
      <div class="form-row">
        ${numFieldHtml({ label: `Staffel${se.maxSeason < 99999 ? ' / ' + se.maxSeason : ''}`,
          id: 'track-season', min: 1, max: se.maxSeason, value: se.season,
          minusId: 'se-m', plusId: 'se-p' })}
        ${numFieldHtml({ label: `Episode${se.maxEpisode < 99999 ? ' / ' + se.maxEpisode : ''}`,
          labelId: 'track-ep-label', id: 'track-ep', max: se.maxEpisode, value: se.episode,
          minusId: 'ep-m', plusId: 'ep-p' })}
      </div>
      <p style="font-size:.75rem;color:var(--text3);margin:-8px 0 14px">
        Episode innerhalb der Staffel — wie bei deinem Streaming-Dienst angezeigt
      </p>`;
  }
  if (hasEpisodes)
  {
    return numFieldHtml({
      label: `Aktuelle Episode${media.episodes ? ' / ' + media.episodes : ''}`,
      id: 'track-ep', max: media.episodes || 99999, value: entry.current_episode || 0,
      minusId: 'ep-m', plusId: 'ep-p',
    });
  }
  if (isManga)
  {
    return numFieldHtml({
      label: `Aktuelles Kapitel${media.chapters ? ' / ' + media.chapters : ''}`,
      id: 'track-ch', max: media.chapters || 99999, value: entry.current_chapter || 0,
      minusId: 'ch-m', plusId: 'ch-p',
    }) + numFieldHtml({
      label: 'Aktuelle Seite', id: 'track-pg', value: entry.current_page || 0,
      minusId: 'pg-m', plusId: 'pg-p',
    });
  }
  return '';
}

/* Eigene Spielzeit — Eingabe in Stunden, gespeichert werden Minuten.
   Nur für Typen mit TYPE_META.playtime (aktuell Spiele). */
function playtimeFieldHtml(media, entry)
{
  if (!TYPE_META[media.type]?.playtime)
  {
    return '';
  }
  const hours = entry.play_minutes
    ? String(Math.round((entry.play_minutes / 60) * 10) / 10)
    : '';
  const hint = media.avg_play_minutes
    ? `<p style="font-size:.75rem;color:var(--text3);margin:-8px 0 14px">
        Andere brauchen im Schnitt ${playtimeText(media.avg_play_minutes)} zum Durchspielen
       </p>`
    : '';

  return `
    <div class="form-group">
      <label class="form-label" for="track-playtime">Meine Spielzeit (Stunden)</label>
      <input class="form-input" type="number" id="track-playtime"
        min="0" max="10000" step="0.5" value="${hours}" placeholder="z.B. 42.5"/>
    </div>
    ${hint}`;
}

function ratingHtml(entry)
{
  return `
    <div class="form-group">
      <label class="form-label">Meine Bewertung</label>
      <div class="stars" id="star-rating">
        ${Array.from({ length: 5 }, (_, i) => `
          <button class="star-btn ${i < (entry.user_score || 0) ? 'on' : ''}" data-star="${i + 1}">${IC.star}</button>
        `).join('')}
      </div>
      <input type="hidden" id="track-score" value="${entry.user_score || 0}"/>
    </div>`;
}

function ownershipHtml(media, kind, entry)
{
  const volumes = kind.isManga
    ? `
      <div class="form-group" id="owned-volumes-group" style="display:${entry.owned ? 'block' : 'none'}">
        ${numFieldHtml({ label: `Bände im Besitz${media.volumes ? ' / ' + media.volumes : ''}`,
          id: 'track-owned-vol', max: media.volumes || 99999, value: entry.owned_volumes || 0,
          minusId: 'ov-m', plusId: 'ov-p' })}
      </div>`
    : '';

  return `
    <div class="form-group">
      <label class="form-label toggle-row" style="display:flex;align-items:center;gap:10px;cursor:pointer">
        <span>Physisch im Besitz</span>
        <span class="toggle-switch">
          <input type="checkbox" id="track-owned" ${entry.owned ? 'checked' : ''}/>
          <span class="toggle-slider"></span>
        </span>
      </label>
    </div>
    ${volumes}`;
}

function datesHtml(entry)
{
  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="track-start">Startdatum</label>
        <input class="form-input" type="date" id="track-start" value="${entry.started_at || ''}"/>
      </div>
      <div class="form-group">
        <label class="form-label" for="track-end">Enddatum</label>
        <input class="form-input" type="date" id="track-end" value="${entry.completed_at || ''}"/>
      </div>
    </div>`;
}

function footHtml(existingEntry)
{
  return `
    <div class="modal-foot" id="track-foot">
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

function renderTrackModalBody(media, existingEntry)
{
  const kind = kindOf(media.type);
  const entry = existingEntry || {};
  const curStatus = entry.list_status || defaultStatusFor(media.type);
  const se = seasonState(media, entry, kind.isTv);

  return `
    <div class="modal-head">
      <h2>${existingEntry ? 'Eintrag bearbeiten' : 'Zur Liste hinzufügen'}</h2>
      <button class="btn-modal-close" id="modal-close" aria-label="Schließen">${IC.x}</button>
    </div>
    <div class="modal-body">
      ${mediaHeroHtml(media)}
      ${mediaMetaChipsHtml(media)}
      ${genreTagsHtml(media.genres)}
      ${synopsisHtml(media.synopsis)}

      ${media.type === 'anime' && media.mal_id ? `
        <div id="streaming-section" style="margin-bottom:14px">
          <div class="streaming-loading">${IC.play} Streaming wird geladen…</div>
        </div>` : ''}

      <div class="divider"></div>
      <h3 style="font-size:.95rem;font-weight:700;margin-bottom:14px">Meine Liste</h3>

      <div class="form-group">
        <label class="form-label" for="track-status">Status</label>
        <select class="form-input" id="track-status">
          ${statusesFor(media.type)
            .map(s => `<option value="${s.val}"${curStatus === s.val ? ' selected' : ''}>${s.label}</option>`)
            .join('')}
        </select>
      </div>

      ${progressFieldsHtml(media, kind, entry, se)}
      ${playtimeFieldHtml(media, entry)}
      ${ratingHtml(entry)}

      <div class="form-group">
        <label class="form-label" for="track-notes">Notizen (optional)</label>
        <textarea class="form-input" id="track-notes" rows="2"
          placeholder="Deine Gedanken…">${esc(entry.notes || '')}</textarea>
      </div>

      ${ownershipHtml(media, kind, entry)}

      <div class="form-group">
        <label class="form-label">Collections</label>
        <div class="collection-chips" id="collection-chips">
          <span style="color:var(--text3);font-size:.8rem">Wird geladen…</span>
        </div>
      </div>

      ${datesHtml(entry)}
    </div>
    ${footHtml(existingEntry)}`;
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

function bindTrackModalNumbers(kind, media)
{
  const { hasEpisodes, isTv, isManga } = kind;

  /* Grenzen kommen aus den min/max-Attributen des Inputs (können dynamisch wechseln) */
  function bindNum(mId, pId, inputId)
  {
    const inp = document.getElementById(inputId);
    if (!inp)
    {
      return;
    }
    const min = () => inp.min !== '' ? +inp.min : 0;
    const max = () => inp.max !== '' ? +inp.max : 99999;
    document.getElementById(mId)?.addEventListener('click', () =>
    {
      inp.value = Math.max(min(), +inp.value - 1);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    document.getElementById(pId)?.addEventListener('click', () =>
    {
      inp.value = Math.min(max(), +inp.value + 1);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  if (hasEpisodes)
  {
    bindNum('ep-m', 'ep-p', 'track-ep');
  }

  const seasons = isTv && Array.isArray(media.seasons_data) ? media.seasons_data : null;
  if (isTv)
  {
    bindNum('se-m', 'se-p', 'track-season');
    const seasonInp = $('#track-season');
    const epInp = $('#track-ep');
    seasonInp?.addEventListener('input', () =>
    {
      const eps = episodesOfSeason(seasons, seasonInp.value);
      const label = $('#track-ep-label');
      if (eps)
      {
        epInp.max = eps;
        if (+epInp.value > eps)
        {
          epInp.value = eps;
        }
        if (label)
        {
          label.textContent = `Episode / ${eps}`;
        }
      }
      else if (label)
      {
        label.textContent = 'Episode';
      }
    });
  }

  if (isManga)
  {
    bindNum('ch-m', 'ch-p', 'track-ch');
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
  bindNum('ov-m', 'ov-p', 'track-owned-vol');

  $('#track-status')?.addEventListener('change', () =>
  {
    if ($('#track-status').value !== 'completed')
    {
      return;
    }
    if (isTv && seasons)
    {
      // Komplett gesehen: letzte Staffel, letzte Episode
      const last = seasons[seasons.length - 1];
      const seasonInp = $('#track-season');
      const epInp = $('#track-ep');
      if (seasonInp && epInp)
      {
        seasonInp.value = last.season;
        seasonInp.dispatchEvent(new Event('input', { bubbles: true }));
        epInp.value = last.episodes;
      }
      return;
    }
    if (hasEpisodes && media.episodes)
    {
      const el = $('#track-ep');
      if (el)
      {
        el.value = media.episodes;
      }
    }
    else if (isManga && media.chapters)
    {
      const el = $('#track-ch');
      if (el)
      {
        el.value = media.chapters;
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

    // Inline-Eingabe statt eines zweiten Modals — Modals stapeln sich nicht
    $('#chip-new-collection', wrap)?.addEventListener('click', showNewCollectionInput);
  }

  function showNewCollectionInput()
  {
    wrap.insertAdjacentHTML('beforeend', `
      <span class="collection-new-inline">
        <input class="form-input" id="new-collection-name" type="text" maxlength="50"
          placeholder="Name der Collection" autocomplete="off"/>
        <button class="btn btn-primary btn-sm" id="new-collection-ok" type="button">${IC.check}</button>
        <button class="btn btn-secondary btn-sm" id="new-collection-cancel" type="button">${IC.x}</button>
      </span>`);
    $('#chip-new-collection', wrap)?.remove();

    const input = $('#new-collection-name', wrap);
    const submit = async () =>
    {
      const name = input.value.trim();
      if (!name)
      {
        renderChips();
        return;
      }
      const created = await createCollection(name);
      if (created)
      {
        colState.selected.add(created.id);
      }
      renderChips();
    };

    $('#new-collection-ok', wrap)?.addEventListener('click', submit);
    $('#new-collection-cancel', wrap)?.addEventListener('click', renderChips);
    input?.addEventListener('keydown', e =>
    {
      if (e.key === 'Enter')
      {
        e.preventDefault();
        submit();
      }
      if (e.key === 'Escape')
      {
        // ESC darf hier nur die Eingabe abbrechen, nicht das ganze Modal schließen
        e.stopPropagation();
        renderChips();
      }
    });
    input?.focus();
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

/* Liefert die eingetragene Spielzeit in Minuten — null, wenn das Feld fehlt oder leer ist
   (bei PUT bedeutet null „unverändert lassen", bei POST „keine Angabe"). */
function playMinutesFromInput()
{
  const input = $('#track-playtime');
  if (!input || input.value === '')
  {
    return null;
  }
  const hours = Math.max(0, +input.value || 0);
  return Math.round(hours * 60) || null;
}

function bindTrackModalSave(media, existingEntry, kind, colState)
{
  const { hasEpisodes, isTv, isManga } = kind;
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
        currentSeason: isTv ? +($('#track-season')?.value || 1) : undefined,
        userScore: +($('#track-score').value) || null,
        notes: $('#track-notes').value.trim() || null,
        startedAt: $('#track-start').value || null,
        completedAt: $('#track-end').value || null,
        owned: $('#track-owned')?.checked || false,
        ownedVolumes: isManga ? +($('#track-owned-vol')?.value || 0) : 0,
        // Eingabe in Stunden, gespeichert in Minuten
        playMinutes: playMinutesFromInput(),
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

  const deleteBtn = $('#btn-delete');
  deleteBtn?.addEventListener('click', () => showDeleteConfirm(deleteBtn, async () =>
  {
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
  }));
}

/* Löschbestätigung inline im Modal-Footer — ein zweites Modal würde das
   Track-Modal verdrängen (Modals stapeln sich bewusst nicht).
   Der Button-Knoten wird nur ausgetauscht, seine Listener bleiben dadurch erhalten. */
function showDeleteConfirm(deleteBtn, onConfirm)
{
  const holder = document.createElement('span');
  holder.className = 'inline-confirm';
  holder.innerHTML = `
    <span class="inline-confirm-text">Wirklich entfernen?</span>
    <button class="btn btn-danger btn-sm" id="del-ok" type="button">Ja</button>
    <button class="btn btn-secondary btn-sm" id="del-cancel" type="button">Nein</button>`;
  deleteBtn.replaceWith(holder);

  holder.querySelector('#del-ok').addEventListener('click', onConfirm);
  holder.querySelector('#del-cancel').addEventListener('click', () => holder.replaceWith(deleteBtn));
  holder.querySelector('#del-ok').focus();
}

export function showTrackModal(media, existingEntry)
{
  const kind = kindOf(media.type);
  const colState = { initial: new Set(), selected: new Set() };

  openModal(renderTrackModalBody(media, existingEntry), () =>
  {
    $('#modal-close')?.addEventListener('click', closeModal);
    $('#modal-cancel')?.addEventListener('click', closeModal);

    bindTrackModalStreaming(media);
    bindTrackModalCollections(existingEntry, colState);
    bindSynopsisToggle();
    bindTrackModalNumbers(kind, media);
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
