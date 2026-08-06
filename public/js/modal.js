/* =====================================================
   AniGa – modal.js
   Generisches Modal-Overlay (öffnen/schließen, ESC)
   ===================================================== */
let _modal = null;

export function openModal(html, afterRender)
{
  closeModal();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.id = 'modal-overlay';
  ov.innerHTML = `<div class="modal" id="modal-box">${html}</div>`;
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
}

export function closeModal()
{
  if (_modal)
  {
    _modal.remove();
    _modal = null;
  }
  document.removeEventListener('keydown', _modalKey);
}

function _modalKey(e)
{
  if (e.key === 'Escape')
  {
    closeModal();
  }
}
