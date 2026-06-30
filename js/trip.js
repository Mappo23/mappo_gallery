'use strict';

// ── Seed itinerary ───────────────────────────────────────────────────────────
// SAMPLE Route 66 plan — replace names/coords with the real landmarks later.
// Live state (reached / current / posts) is stored separately in localStorage,
// so editing this seed only affects a fresh trip (use [ RESET ] to re-seed).
const TRIP_SEED = {
  status: 'planning',          // 'planning' | 'live' | 'done'
  currentStopId: null,
  stops: [
    { id: 'seed-1', name: 'Chicago, IL',      lat: 41.8781,  lng: -87.6298,  order: 0, reached: false, date: '', photoId: null, thoughts: '' },
    { id: 'seed-2', name: 'St. Louis, MO',    lat: 38.6270,  lng: -90.1994,  order: 1, reached: false, date: '', photoId: null, thoughts: '' },
    { id: 'seed-3', name: 'Tulsa, OK',        lat: 36.1540,  lng: -95.9928,  order: 2, reached: false, date: '', photoId: null, thoughts: '' },
    { id: 'seed-4', name: 'Amarillo, TX',     lat: 35.2220,  lng: -101.8313, order: 3, reached: false, date: '', photoId: null, thoughts: '' },
    { id: 'seed-5', name: 'Santa Fe, NM',     lat: 35.6870,  lng: -105.9378, order: 4, reached: false, date: '', photoId: null, thoughts: '' },
    { id: 'seed-6', name: 'Flagstaff, AZ',    lat: 35.1983,  lng: -111.6513, order: 5, reached: false, date: '', photoId: null, thoughts: '' },
    { id: 'seed-7', name: 'Santa Monica, CA', lat: 34.0195,  lng: -118.4912, order: 6, reached: false, date: '', photoId: null, thoughts: '' },
  ],
};

// ── Trip controller ──────────────────────────────────────────────────────────
const Trip = {
  postStopId: null,

  open() {
    const existing = WindowManager.findByType('trip');
    if (existing) {
      existing.minimized ? WindowManager.restore(existing.id) : WindowManager.focus(existing.id);
      Trip._render(existing.el);
      return;
    }
    const { el } = WindowManager.create('trip', { width: 360, height: 520, x: 70, y: 60 });
    Trip._render(el);
  },

  // ── Data helpers ──────────────────────────────────────────
  _sorted(trip) {
    return trip.stops.slice().sort((a, b) => a.order - b.order);
  },

  stopCoords(stop) {
    if (typeof stop.lat === 'number' && typeof stop.lng === 'number') {
      return { lat: stop.lat, lng: stop.lng };
    }
    if (stop.photoId) {
      const p = Storage.getPhotos().find(x => x.id === stop.photoId);
      const c = Storage.getCoords(p);
      if (c) return c;
    }
    return null;
  },

  stopPhoto(stop) {
    return stop.photoId ? Storage.getPhotos().find(p => p.id === stop.photoId) : null;
  },

  // ── Trip progression ──────────────────────────────────────
  start() {
    const trip = Storage.getTrip();
    const stops = Trip._sorted(trip);
    if (!stops.length) return;
    trip.status = 'live';
    trip.currentStopId = stops[0].id;
    Storage.saveTrip(trip);
    Trip._sync();
    RouteMap.open();
    setTimeout(() => RouteMap.flyToStop(stops[0].id), 120);
  },

  advance() {
    const trip = Storage.getTrip();
    const stops = Trip._sorted(trip);
    const idx = stops.findIndex(s => s.id === trip.currentStopId);
    if (idx === -1) return;

    stops[idx].reached = true;                       // mark current as reached
    if (idx < stops.length - 1) {
      trip.currentStopId = stops[idx + 1].id;        // advance the live frontier
      Storage.saveTrip(trip);
      Trip._sync();
      RouteMap.flyToStop(trip.currentStopId);
    } else {
      trip.status = 'done';                           // reached the end
      trip.currentStopId = null;
      Storage.saveTrip(trip);
      Trip._sync();
    }
  },

  reset() {
    if (!confirm('Reset the trip back to the planned itinerary? (posts & progress are cleared)')) return;
    Storage.resetTrip();
    Trip._sync();
  },

  setCurrent(id) {
    const trip = Storage.getTrip();
    trip.status = 'live';
    trip.currentStopId = id;
    Storage.saveTrip(trip);
    Trip._sync();
    RouteMap.flyToStop(id);
  },

  toggleReached(id) {
    const trip = Storage.getTrip();
    const stop = trip.stops.find(s => s.id === id);
    if (!stop) return;
    stop.reached = !stop.reached;
    Storage.saveTrip(trip);
    Trip._sync();
  },

  savePost(id, data) {
    const trip = Storage.getTrip();
    const stop = trip.stops.find(s => s.id === id);
    if (!stop) return;
    Object.assign(stop, data);
    Storage.saveTrip(trip);
    Trip._sync();
  },

  // ── Trip window ───────────────────────────────────────────
  _render(winEl) {
    const trip  = Storage.getTrip();
    const stops = Trip._sorted(trip);
    const reached = stops.filter(s => s.reached).length;

    const statusLabel = { planning: 'PLANNING', live: '● LIVE', done: 'COMPLETE' }[trip.status] || 'PLANNING';

    winEl.querySelector('.trip-status').textContent   = statusLabel;
    winEl.querySelector('.trip-status').className      = `trip-status trip-status-${trip.status}`;
    winEl.querySelector('.trip-progress').textContent = `${reached}/${stops.length} stops`;

    // Controls
    const ctrl = winEl.querySelector('.trip-controls');
    ctrl.innerHTML =
      (trip.status === 'planning' ? '<button class="pixel-btn trip-start">[ ▶ START TRIP ]</button>' : '') +
      (trip.status === 'live'     ? '<button class="pixel-btn trip-advance">[ ADVANCE ▶ ]</button>'  : '') +
      '<button class="pixel-btn trip-reset">[ RESET ]</button>';

    ctrl.querySelector('.trip-start')  ?.addEventListener('click', () => Trip.start());
    ctrl.querySelector('.trip-advance')?.addEventListener('click', () => Trip.advance());
    ctrl.querySelector('.trip-reset')  ?.addEventListener('click', () => Trip.reset());

    // Stop list
    const list = winEl.querySelector('.trip-list');
    if (!stops.length) {
      list.innerHTML = '<div class="trip-empty">no stops in the itinerary</div>';
      return;
    }

    list.innerHTML = stops.map((s, i) => {
      const isCurrent = trip.status === 'live' && s.id === trip.currentStopId;
      const glyph = s.reached ? '★' : (isCurrent ? '◉' : '☆');
      const cls   = `trip-stop${s.reached ? ' is-reached' : ''}${isCurrent ? ' is-current' : ''}`;
      const bits  = [s.date || null, s.photoId ? 'photo' : null, s.thoughts ? 'note' : null].filter(Boolean);
      return `
        <div class="${cls}" data-id="${s.id}">
          <span class="trip-stop-glyph">${glyph}</span>
          <span class="trip-stop-idx">${String(i + 1).padStart(2, '0')}</span>
          <div class="trip-stop-body">
            <div class="trip-stop-name">${s.name}</div>
            <div class="trip-stop-sub">${bits.join(' · ') || 'no post yet'}</div>
          </div>
          <button class="pixel-btn trip-stop-post" data-id="${s.id}">[ POST ]</button>
        </div>`;
    }).join('');

    list.querySelectorAll('.trip-stop-post').forEach(btn =>
      btn.addEventListener('click', e => { e.stopPropagation(); Trip.openPost(btn.dataset.id); }));
    list.querySelectorAll('.trip-stop').forEach(row =>
      row.addEventListener('click', () => Trip.openPost(row.dataset.id)));
  },

  // ── Post / stop card ──────────────────────────────────────
  openPost(id) {
    Trip.postStopId = id;
    const existing = WindowManager.findByType('post');
    let winEl;
    if (existing) {
      winEl = existing.el;
      existing.minimized ? WindowManager.restore(existing.id) : WindowManager.focus(existing.id);
    } else {
      const { el } = WindowManager.create('post', { width: 380, height: 560, x: 200, y: 80 });
      winEl = el;
      Trip._bindPost(winEl);
    }
    Trip._renderPost(winEl, id);
  },

  _renderPost(winEl, id) {
    const trip  = Storage.getTrip();
    const stops = Trip._sorted(trip);
    const idx   = stops.findIndex(s => s.id === id);
    const stop  = stops[idx];
    if (!stop) return;

    const photo = Trip.stopPhoto(stop);

    winEl.querySelector('.win-title').textContent = `▒ POST — ${stop.name}`;
    winEl.classList.remove('editing');

    // Card (read view)
    const img   = winEl.querySelector('.post-img');
    const noimg = winEl.querySelector('.post-noimg');
    if (photo) {
      img.src = photo.dataUrl; img.hidden = false; noimg.hidden = true;
    } else {
      img.removeAttribute('src'); img.hidden = true; noimg.hidden = false;
    }
    winEl.querySelector('.post-loc').textContent      = stop.name;
    winEl.querySelector('.post-date').textContent     = stop.date || '';
    winEl.querySelector('.post-thoughts').textContent = stop.thoughts || '“no thoughts yet — tap EDIT”';
    winEl.querySelector('.post-footer').innerHTML =
      `<span class="pf-brand">▓ FILM&nbsp;OS</span>` +
      `<span class="pf-route">ROUTE 66</span>` +
      `<span class="pf-stop">STOP ${idx + 1}/${stops.length}</span>`;

    const stateBadge = winEl.querySelector('.post-state');
    const isCurrent  = trip.status === 'live' && stop.id === trip.currentStopId;
    stateBadge.textContent = stop.reached ? '★ REACHED' : (isCurrent ? '◉ LIVE NOW' : '☆ PLANNED');
    stateBadge.className = `post-state ${stop.reached ? 'st-reached' : isCurrent ? 'st-live' : 'st-planned'}`;

    // Toolbar buttons
    winEl.querySelector('.post-reached').textContent = stop.reached ? '[ ✓ REACHED ]' : '[ MARK REACHED ]';
    winEl.querySelector('.post-reached').onclick = () => { Trip.toggleReached(id); Trip._renderPost(winEl, id); };
    winEl.querySelector('.post-current').onclick = () => { Trip.setCurrent(id); Trip._renderPost(winEl, id); };

    // Editor fields
    winEl.querySelector('.post-edit-date').value     = stop.date || '';
    winEl.querySelector('.post-edit-thoughts').value = stop.thoughts || '';

    const sel = winEl.querySelector('.post-edit-photo');
    const photos = Storage.getPhotos();
    sel.innerHTML = '<option value="">— no photo —</option>' +
      photos.map(p => `<option value="${p.id}" ${p.id === stop.photoId ? 'selected' : ''}>${p.filename}</option>`).join('');
  },

  _bindPost(winEl) {
    winEl.querySelector('.post-edit').addEventListener('click', () => winEl.classList.toggle('editing'));

    // Inline film loader — same entry point as LINKED PHOTO.
    const loadBtn   = winEl.querySelector('.post-load');
    const loadInput = winEl.querySelector('.post-load-input');
    loadBtn.addEventListener('click', () => loadInput.click());
    loadInput.addEventListener('change', async () => {
      const file = loadInput.files[0];
      loadInput.value = '';
      if (!file) return;
      const orig = loadBtn.textContent;
      loadBtn.disabled = true;
      loadBtn.textContent = '[ … ]';
      try {
        const photo = await Upload.loadOne(file);
        const sel = winEl.querySelector('.post-edit-photo');
        const photos = Storage.getPhotos();
        sel.innerHTML = '<option value="">— no photo —</option>' +
          photos.map(p => `<option value="${p.id}" ${p.id === photo.id ? 'selected' : ''}>${p.filename}</option>`).join('');
      } catch (err) {
        alert(`Could not load film: ${err.message}`);
      } finally {
        loadBtn.disabled = false;
        loadBtn.textContent = orig;
      }
    });

    winEl.querySelector('.post-cancel').addEventListener('click', () => { winEl.classList.remove('editing'); Trip._renderPost(winEl, Trip.postStopId); });
    winEl.querySelector('.post-save').addEventListener('click', () => {
      Trip.savePost(Trip.postStopId, {
        date:     winEl.querySelector('.post-edit-date').value,
        thoughts: winEl.querySelector('.post-edit-thoughts').value.trim(),
        photoId:  winEl.querySelector('.post-edit-photo').value || null,
      });
      winEl.classList.remove('editing');
      Trip._renderPost(winEl, Trip.postStopId);
    });
  },

  // ── Refresh open views + map ──────────────────────────────
  _sync() {
    const w = WindowManager.findByType('trip');
    if (w) Trip._render(w.el);
    const pw = WindowManager.findByType('post');
    if (pw && Trip.postStopId) Trip._renderPost(pw.el, Trip.postStopId);
    if (RouteMap.map) RouteMap.drawTrip();
  },
};
