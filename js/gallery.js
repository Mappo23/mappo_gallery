'use strict';

// ── Gallery ──────────────────────────────────────────────────────────────────

const Gallery = {
  currentId: null,

  open() {
    const existing = WindowManager.findByType('gallery');
    if (existing) {
      existing.minimized ? WindowManager.restore(existing.id) : WindowManager.focus(existing.id);
      Gallery._render(existing.el);
      return;
    }
    const { el } = WindowManager.create('gallery', { width: 860, height: 560, x: 60, y: 50 });
    Gallery._render(el);
  },

  _render(winEl) {
    const grid   = winEl.querySelector('.gallery-grid');
    const photos = Storage.getPhotos();

    if (!photos.length) {
      grid.innerHTML = `
        <div class="gallery-empty">
          <div class="gallery-empty-icon">░░░░░░░<br>░     ░<br>░░░░░░░</div>
          <p>NO FRAMES LOADED</p>
          <p class="gallery-empty-sub">open a [ POST ] and tap [ + FILM ] to add photos</p>
        </div>`;
      return;
    }

    grid.innerHTML = photos.map((p, i) => `
      <div class="gallery-cell" data-id="${p.id}">
        <div class="gallery-frame-num">#${String(i + 1).padStart(3, '0')}</div>
        <div class="gallery-thumb-wrap">
          <img class="gallery-thumb" src="${p.thumbnail}" alt="${p.filename}" loading="lazy">
          <div class="gallery-thumb-overlay">OPEN</div>
        </div>
        <div class="gallery-cell-meta">
          <span class="gallery-cell-date">${p.exif?.date || '—'}</span>
          <span class="gallery-cell-loc">${Storage.getCoords(p) ? '◉ ' : ''}${p.location || ''}</span>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.gallery-cell').forEach(cell => {
      cell.addEventListener('click', () => Gallery.openPhoto(cell.dataset.id));
    });
  },

  refresh() {
    const gal = WindowManager.findByType('gallery');
    if (gal) Gallery._render(gal.el);
  },

  openPhoto(photoId) {
    const photos = Storage.getPhotos();
    const photo  = photos.find(p => p.id === photoId);
    if (!photo) return;

    this.currentId = photoId;
    const existing = WindowManager.findByType('photo');

    let winEl, winId;
    if (existing) {
      winEl = existing.el;
      winId = existing.id;
      existing.minimized ? WindowManager.restore(winId) : WindowManager.focus(winId);
    } else {
      const result = WindowManager.create('photo', { width: 1020, height: 620, x: 100, y: 70 });
      winEl = result.el;
      winId = result.id;
      Gallery._bindPhotoNav(winEl);
    }

    Gallery._populate(winEl, winId, photo);
  },

  _populate(winEl, winId, photo) {
    const e = photo.exif || {};

    winEl.querySelector('.win-photo-title').textContent =
      `▒ FRAME — ${photo.filename}`;

    const img = winEl.querySelector('.photo-img');
    img.src = photo.dataUrl;
    img.alt = photo.filename;

    winEl.querySelector('.meta-filename').textContent  = photo.filename;
    winEl.querySelector('.meta-date').textContent      = e.date        || '—';
    winEl.querySelector('.meta-camera').textContent    = e.camera      || '—';
    winEl.querySelector('.meta-focal').textContent     = e.focalLength ? `${e.focalLength}mm` : '—';
    winEl.querySelector('.meta-aperture').textContent  = e.aperture    || '—';
    winEl.querySelector('.meta-shutter').textContent   = e.shutter     || '—';
    winEl.querySelector('.meta-iso').textContent       = e.iso         || '—';
    winEl.querySelector('.meta-location').value        = photo.location || '';
    winEl.querySelector('.meta-caption').value         = photo.caption  || '';

    Gallery._renderCoords(winEl, photo);
    winEl.querySelector('.meta-pin').onclick = () => LocationPicker.open(photo.id);

    winEl.querySelector('.meta-save').onclick = () => {
      Storage.updatePhoto(photo.id, {
        location: winEl.querySelector('.meta-location').value.trim(),
        caption:  winEl.querySelector('.meta-caption').value.trim(),
      });
      Gallery.refresh();
      Gallery._flashSave(winEl);
    };

    winEl.querySelector('.meta-delete').onclick = () => {
      if (!confirm(`Delete "${photo.filename}"?`)) return;
      Storage.deletePhoto(photo.id);
      WindowManager.close(winId);
      Gallery.refresh();
    };
  },

  _renderCoords(winEl, photo) {
    const c  = Storage.getCoords(photo);
    const el = winEl.querySelector('.meta-coords');
    if (c) {
      el.textContent = `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`;
      el.classList.remove('unset');
    } else {
      el.textContent = 'not set';
      el.classList.add('unset');
    }
    const pinBtn = winEl.querySelector('.meta-pin');
    if (pinBtn) pinBtn.textContent = c ? '[ EDIT PIN ]' : '[ PIN ON MAP ]';
  },

  // Called by LocationPicker after a pin is saved/cleared
  updateCoordsDisplay(photoId) {
    if (Gallery.currentId !== photoId) return;
    const win = WindowManager.findByType('photo');
    if (!win) return;
    const photo = Storage.getPhotos().find(p => p.id === photoId);
    if (photo) Gallery._renderCoords(win.el, photo);
  },

  _bindPhotoNav(winEl) {
    winEl.querySelector('.photo-prev').addEventListener('click', () => {
      const photos = Storage.getPhotos();
      const idx    = photos.findIndex(p => p.id === Gallery.currentId);
      if (idx > 0) Gallery.openPhoto(photos[idx - 1].id);
    });
    winEl.querySelector('.photo-next').addEventListener('click', () => {
      const photos = Storage.getPhotos();
      const idx    = photos.findIndex(p => p.id === Gallery.currentId);
      if (idx < photos.length - 1) Gallery.openPhoto(photos[idx + 1].id);
    });
  },

  _flashSave(winEl) {
    const btn = winEl.querySelector('.meta-save');
    const orig = btn.textContent;
    btn.textContent = '[ SAVED ✓ ]';
    setTimeout(() => { btn.textContent = orig; }, 1200);
  },
};

// ── Film loader ──────────────────────────────────────────────────────────────
// Headless image-processing helper. Loading now happens inline from the POST
// window (LINKED PHOTO → [ + FILM ]); there is no standalone upload window.

const Upload = {
  // Process a single file, store it, and return the new photo record.
  async loadOne(file) {
    if (!file || !file.type.startsWith('image/')) throw new Error('not an image');
    const photo = await Upload._build(file);
    await Storage.addPhoto(photo);   // uploads to the server, updates the cache
    Gallery.refresh();
    return photo;
  },

  // Builds the upload payload: EXIF + two resized JPEGs. The server writes the
  // images to /uploads and returns the stored record (with real image URLs).
  async _build(file) {
    const [exifData, fullDataUrl, thumbDataUrl] = await Promise.all([
      ExifHandler.extract(file),
      Upload._resize(file, 1100, 0.82),
      Upload._resize(file, 320,  0.68),
    ]);

    return {
      id:           `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      filename:     file.name,
      fullDataUrl,                 // → /uploads/<id>.jpg
      thumbDataUrl,                // → /uploads/<id>_thumb.jpg
      addedAt:      new Date().toISOString(),
      exif:         exifData,
      location:     '',
      caption:      '',
    };
  },

  _resize(file, maxW, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload  = ({ target }) => {
        const img    = new Image();
        img.onerror  = reject;
        img.onload   = () => {
          const scale  = Math.min(1, maxW / img.width);
          const canvas = document.createElement('canvas');
          canvas.width  = Math.round(img.width  * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = target.result;
      };
      reader.readAsDataURL(file);
    });
  },

};
