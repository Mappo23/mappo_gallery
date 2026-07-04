'use strict';

// ── Seed itinerary ───────────────────────────────────────────────────────────
// Real planned trip: Chicago → LA (Route 66) → Big Sur detour → home, 02–15 Jul 2026.
// `plan` is a pre-trip note shown until the owner posts real thoughts for that stop;
// `lodging` is where the night is booked. Live state (reached / current / posts) is
// stored separately, so editing this seed only affects a fresh trip ([ RESET ] to re-seed).
const TRIP_SEED = {
  status: 'planning',          // 'planning' | 'live' | 'done'
  currentStopId: null,
  stops: [
    { id: 'trip-01', name: 'Chicago, IL',
      lat: 41.8781, lng: -87.6298, order: 0, reached: false,
      date: '2026-07-02', photoIds: [], thoughts: '',
      plan: "Trip kickoff — Route 66's eastern start.",
      lodging: 'Antonio Inn' },

    { id: 'trip-01b', name: 'St. Louis, MO — Broadway Oyster Bar',
      lat: 38.6119, lng: -90.1919, order: 0.5, reached: false,
      date: '2026-07-03', photoIds: [], thoughts: '',
      plan: 'Lunch stop on I-44 through St. Louis, right by the Gateway Arch.',
      lodging: 'Broadway Oyster Bar — 736 S. Broadway, St. Louis, MO' },

    { id: 'trip-02', name: 'Joplin, MO',
      lat: 37.0842, lng: -94.5133, order: 1, reached: false,
      date: '2026-07-03', photoIds: [], thoughts: '',
      plan: '900 km via I-55 through Springfield, then I-44 from St. Louis.',
      lodging: 'Days Inn by Wyndham' },

    { id: 'trip-02b', name: 'Galena, KS',
      lat: 37.0745, lng: -94.6371, order: 1.3, reached: false,
      date: '2026-07-04', photoIds: [], thoughts: '',
      plan: 'A few miles past Joplin — the old Kan-O-Tex station here (4th & Main) inspired Radiator Springs in Pixar\'s Cars.',
      lodging: '' },

    { id: 'trip-02c', name: 'Clinton, OK — Route 66 Museum',
      lat: 35.5153, lng: -98.9773, order: 1.6, reached: false,
      date: '2026-07-04', photoIds: [], thoughts: '',
      plan: 'Oklahoma Route 66 Museum, right on I-40 — worth the stop for the history of the road you\'re driving.',
      lodging: '' },

    { id: 'trip-03', name: 'Amarillo, TX',
      lat: 35.2220, lng: -101.8313, order: 2, reached: false,
      date: '2026-07-04', photoIds: [], thoughts: '',
      plan: '770 km via I-44 through Tulsa, then I-40 from Oklahoma City — Cadillac Ranch.',
      lodging: 'Motel 6' },

    { id: 'trip-04', name: 'Albuquerque, NM',
      lat: 35.2941, lng: -106.5583, order: 3, reached: false,
      date: '2026-07-05', photoIds: [], thoughts: '',
      plan: '460 km on I-40 through Tucumcari & Santa Rosa (Blue Hole). Based in Bernalillo.',
      lodging: 'Motel 6 — 210 North Hill Road, Bernalillo, NM' },

    { id: 'trip-05', name: 'Santa Fe & Taos loop',
      lat: 35.2941, lng: -106.5583, order: 4, reached: false,
      date: '2026-07-06', photoIds: [], thoughts: '',
      plan: '400 km day loop from Bernalillo: High Road (RD 76) to Taos Pueblo via Chimayó & Córdova, Low Road (RD 68) back along the Rio Grande gorge.',
      lodging: 'Motel 6 — 210 North Hill Road, Bernalillo, NM' },

    { id: 'trip-06', name: 'Monument Valley',
      lat: 36.9840, lng: -110.0972, order: 5, reached: false,
      date: '2026-07-07', photoIds: [], thoughts: '',
      plan: '800 km via I-40 through Chambers, Canyon de Chelly & Kayenta, then Scenic Byway 163. Overnight in Bluff, UT.',
      lodging: 'Bluff Gardens — 550 East Main, Bluff, UT 84512' },

    { id: 'trip-07', name: 'Grand Canyon Village',
      lat: 36.0544, lng: -112.1401, order: 6, reached: false,
      date: '2026-07-08', photoIds: [], thoughts: '',
      plan: '300–490 km, optional detour to Page for Horseshoe Bend / Antelope Canyon (guided tour — book ahead).',
      lodging: 'Bright Angel Lodge — 9 Village Loop Drive, Grand Canyon, AZ' },

    { id: 'trip-08', name: 'Grand Canyon — South Rim',
      lat: 36.0544, lng: -112.1401, order: 7, reached: false,
      date: '2026-07-09', photoIds: [], thoughts: '',
      plan: 'Full day on the South Rim — morning walk down the South Kaibab Trail.',
      lodging: 'Bright Angel Lodge — 9 Village Loop Drive, Grand Canyon, AZ' },

    { id: 'trip-09', name: 'Phoenix / Scottsdale',
      lat: 33.4942, lng: -111.9261, order: 8, reached: false,
      date: '2026-07-10', photoIds: [], thoughts: '',
      plan: '370 km via Sedona, Arcosanti, and Taliesin West (9–12pm, booking required).',
      lodging: 'Motel 6 — 1612 North Scottsdale Road, Tempe, AZ' },

    { id: 'trip-10', name: 'Joshua Tree (29 Palms)',
      lat: 34.1355, lng: -116.0542, order: 9, reached: false,
      date: '2026-07-11', photoIds: [], thoughts: '',
      plan: '530 km crossing the desert via Indio/Coachella & Palm Springs — Frey House II, Palm Springs Art Museum.',
      lodging: '29 Palms Inn — 73950 Inn Avenue, Twentynine Palms, CA' },

    { id: 'trip-11', name: 'Santa Monica — Route 66 ends',
      lat: 34.0094, lng: -118.4973, order: 10, reached: false,
      date: '2026-07-12', photoIds: [], thoughts: '',
      plan: '300 km into LA: Griffith Observatory, Hollyhock House (F.L. Wright), Getty Center, then the Santa Monica Pier — the end of Route 66.',
      lodging: 'Motel 6 — 1516 Newbury Rd, Thousand Oaks, CA 91320' },

    { id: 'trip-12', name: 'Big Sur',
      lat: 36.2704, lng: -121.8081, order: 11, reached: false,
      date: '2026-07-13', photoIds: [], thoughts: '',
      plan: 'Up the Ventura Highway to Pfeiffer Beach — Bixby Creek Bridge, McWay Falls.',
      lodging: 'Lucia Lodge — 62400 Hwy 1, Big Sur, CA 93920' },

    { id: 'trip-13', name: 'Thousand Oaks',
      lat: 34.1706, lng: -118.8376, order: 12, reached: false,
      date: '2026-07-14', photoIds: [], thoughts: '',
      plan: '380 km back down the coast via Morro Bay & Santa Barbara.',
      lodging: 'Motel 6 — 1516 Newbury Rd, Thousand Oaks, CA 91320' },

    // Day 15 (flight LAX → Chicago) and day 16 (home) are travel logistics, not
    // photographable trip stops — omitted so the map's planned route doesn't
    // draw a straight "drive" line for what's actually a flight.
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
    const cover = Trip.stopPhotos(stop)[0];
    if (cover) {
      const c = Storage.getCoords(cover);
      if (c) return c;
    }
    return null;
  },

  // All photos linked to a stop, in the order they were selected.
  stopPhotos(stop) {
    if (!stop.photoIds || !stop.photoIds.length) return [];
    const photos = Storage.getPhotos();
    return stop.photoIds.map(id => photos.find(p => p.id === id)).filter(Boolean);
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
      // Post bits (photo/note) once the owner has written something for this
      // stop; until then, fall back to the pre-trip plan blurb as a preview.
      const photoCount = s.photoIds?.length || 0;
      const postBits = [
        photoCount ? (photoCount > 1 ? `${photoCount} photos` : 'photo') : null,
        s.thoughts ? 'note' : null,
      ].filter(Boolean);
      const sub = postBits.length
        ? [s.date || null, ...postBits].filter(Boolean).join(' · ')
        : [s.date || null, s.plan || 'no post yet'].filter(Boolean).join(' — ');
      return `
        <div class="${cls}" data-id="${s.id}">
          <span class="trip-stop-glyph">${glyph}</span>
          <span class="trip-stop-idx">${String(i + 1).padStart(2, '0')}</span>
          <div class="trip-stop-body">
            <div class="trip-stop-name">${s.name}</div>
            <div class="trip-stop-sub">${sub}</div>
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

    const photos = Trip.stopPhotos(stop);   // cover = photos[0]

    winEl.querySelector('.win-title').textContent = `▒ POST — ${stop.name}`;
    winEl.classList.remove('editing');

    // Card (read view) — first linked photo is the cover; a badge shows the rest.
    const img   = winEl.querySelector('.post-img');
    const noimg = winEl.querySelector('.post-noimg');
    const countEl = winEl.querySelector('.post-photo-count');
    if (photos.length) {
      img.src = photos[0].dataUrl; img.hidden = false; noimg.hidden = true;
    } else {
      img.removeAttribute('src'); img.hidden = true; noimg.hidden = false;
    }
    if (countEl) {
      countEl.textContent = `+${photos.length - 1}`;
      countEl.hidden = photos.length < 2;
    }
    winEl.querySelector('.post-loc').textContent      = stop.name;
    winEl.querySelector('.post-date').textContent     = stop.date || '';

    const lodgingEl = winEl.querySelector('.post-lodging');
    lodgingEl.textContent = stop.lodging ? `STAY — ${stop.lodging}` : '';
    lodgingEl.hidden = !stop.lodging;

    // Real diary thoughts once written; otherwise preview the pre-trip plan.
    const thoughtsEl = winEl.querySelector('.post-thoughts');
    thoughtsEl.classList.toggle('is-plan', !stop.thoughts);
    thoughtsEl.textContent = stop.thoughts || stop.plan || '“no thoughts yet — tap EDIT”';
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
    const allPhotos = Storage.getPhotos();
    const linked = new Set(stop.photoIds || []);
    sel.innerHTML = allPhotos
      .map(p => `<option value="${p.id}" ${linked.has(p.id) ? 'selected' : ''}>${p.filename}</option>`)
      .join('');
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
        // Keep whatever was already selected, and add the newly loaded photo.
        const keep = new Set([...sel.selectedOptions].map(o => o.value));
        keep.add(photo.id);
        const allPhotos = Storage.getPhotos();
        sel.innerHTML = allPhotos
          .map(p => `<option value="${p.id}" ${keep.has(p.id) ? 'selected' : ''}>${p.filename}</option>`)
          .join('');
      } catch (err) {
        alert(`Could not load film: ${err.message}`);
      } finally {
        loadBtn.disabled = false;
        loadBtn.textContent = orig;
      }
    });

    winEl.querySelector('.post-cancel').addEventListener('click', () => { winEl.classList.remove('editing'); Trip._renderPost(winEl, Trip.postStopId); });
    winEl.querySelector('.post-save').addEventListener('click', () => {
      const sel = winEl.querySelector('.post-edit-photo');
      Trip.savePost(Trip.postStopId, {
        date:      winEl.querySelector('.post-edit-date').value,
        thoughts:  winEl.querySelector('.post-edit-thoughts').value.trim(),
        photoIds:  [...sel.selectedOptions].map(o => o.value),
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
