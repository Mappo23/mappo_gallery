'use strict';

// ── Shared map helpers ───────────────────────────────────────────────────────

const MapUtil = {
  tileTheme(theme) {
    return theme === 'light' ? 'light_all' : 'dark_all';
  },

  makeTiles(theme) {
    return L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${this.tileTheme(theme)}/{z}/{x}/{y}{r}.png`,
      {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      }
    );
  },

  photoIcon(active = false) {
    return L.divIcon({
      className: `pin-photo${active ? ' pin-photo-active' : ''}`,
      html: '<div class="pin-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  },

  landmarkIcon() {
    return L.divIcon({
      className: 'pin-landmark',
      html: '★',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  },

  // Trip itinerary stop: filled gold ★ when reached, hollow ☆ when planned
  tripStarIcon(reached) {
    return L.divIcon({
      className: `pin-trip ${reached ? 'pin-trip-on' : 'pin-trip-off'}`,
      html: reached ? '★' : '☆',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  },

  // Animated pulse marking the live/current stop
  liveIcon() {
    return L.divIcon({
      className: 'pin-live',
      html: '<span class="live-pulse"></span><span class="live-dot"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  },

  planLineColor() {
    return Storage.getTheme() === 'light' ? 'rgba(40,40,40,0.45)' : 'rgba(220,220,220,0.5)';
  },

  // Observe a window body so Leaflet recalculates size on resize / restore
  watchResize(map, winEl) {
    const body = winEl.querySelector('.win-body');
    const obs = new ResizeObserver(() => map.invalidateSize());
    obs.observe(body);
    return obs;
  },
};

// ── Route Map window ─────────────────────────────────────────────────────────

const RouteMap = {
  map:            null,
  winId:          null,
  tileLayer:      null,
  routeLayer:     null,
  tripPlanLayer:  null,
  tripDoneLayer:  null,
  tripLayer:      null,
  tripStopLayer:  null,
  photoLayer:     null,
  liveLayer:      null,
  resizeObs:      null,
  showRoute66:    true,
  showTripLine:   true,

  open() {
    const existing = WindowManager.findByType('map');
    if (existing) {
      existing.minimized ? WindowManager.restore(existing.id) : WindowManager.focus(existing.id);
      this.refresh();
      return;
    }
    const { el, id } = WindowManager.create('map', { width: 820, height: 560, x: 90, y: 60 });
    this.winId = id;
    this._init(el);
  },

  _init(winEl) {
    const canvas = winEl.querySelector('.map-canvas');

    this.map = L.map(canvas, { zoomControl: true, attributionControl: true })
      .setView([36.5, -98], 5);   // centered over Route 66 country

    this.tileLayer      = MapUtil.makeTiles(Storage.getTheme()).addTo(this.map);
    this.routeLayer     = L.layerGroup().addTo(this.map);   // historic Route 66
    this.tripPlanLayer  = L.layerGroup().addTo(this.map);   // planned outline route
    this.tripDoneLayer  = L.layerGroup().addTo(this.map);   // solid red reached route
    this.tripLayer      = L.layerGroup().addTo(this.map);   // chronological photo line
    this.tripStopLayer  = L.layerGroup().addTo(this.map);   // itinerary stop stars
    this.photoLayer     = L.layerGroup().addTo(this.map);   // photo pins
    this.liveLayer      = L.layerGroup().addTo(this.map);   // pulsing live marker

    this._drawRoute66();
    this.refresh();

    // Toolbar
    winEl.querySelector('.map-fit').addEventListener('click', () => this._fit());
    winEl.querySelector('.map-toggle-route').addEventListener('click', e => {
      this.showRoute66 = !this.showRoute66;
      e.currentTarget.classList.toggle('toggled-off', !this.showRoute66);
      this._drawRoute66();
    });
    winEl.querySelector('.map-toggle-trip').addEventListener('click', e => {
      this.showTripLine = !this.showTripLine;
      e.currentTarget.classList.toggle('toggled-off', !this.showTripLine);
      this.refresh();
    });

    this.resizeObs = MapUtil.watchResize(this.map, winEl);
    setTimeout(() => this.map.invalidateSize(), 60);
  },

  _drawRoute66() {
    this.routeLayer.clearLayers();
    if (!this.showRoute66) return;

    L.polyline(ROUTE_66.path, {
      color: '#c8432e',
      weight: 3,
      opacity: 0.85,
      dashArray: '1,0',
    }).addTo(this.routeLayer);

    ROUTE_66.landmarks.forEach(lm => {
      L.marker([lm.lat, lm.lng], { icon: MapUtil.landmarkIcon() })
        .bindPopup(
          `<span class="pop-name">★ ${lm.name}</span>` +
          `<span class="pop-city">${lm.city}</span>` +
          `<span class="pop-note">${lm.note}</span>`
        )
        .addTo(this.routeLayer);
    });
  },

  refresh() {
    if (!this.map) return;
    this.photoLayer.clearLayers();
    this.tripLayer.clearLayers();

    const located = Storage.getLocatedPhotos();   // [{photo, coords}], chronological
    this._updateStatus(located.length);
    this._toggleEmptyHint(located.length === 0);

    // Chronological trip line
    if (this.showTripLine && located.length > 1) {
      L.polyline(located.map(x => [x.coords.lat, x.coords.lng]), {
        color: getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#e87a3e',
        weight: 2,
        opacity: 0.7,
        dashArray: '6,5',
      }).addTo(this.tripLayer);
    }

    // Photo markers
    located.forEach(({ photo, coords }) => {
      const marker = L.marker([coords.lat, coords.lng], { icon: MapUtil.photoIcon() })
        .addTo(this.photoLayer);
      marker.bindTooltip(
        `<div class="map-tip">` +
          `<img src="${photo.thumbnail}" alt="">` +
          `<div class="map-tip-cap">${photo.exif?.date || photo.filename}</div>` +
        `</div>`,
        { direction: 'top', className: 'map-tooltip', offset: [0, -8], opacity: 1 }
      );
      marker.on('click', () => Gallery.openPhoto(photo.id));
    });

    this.drawTrip();
  },

  // ── Trip itinerary: planned outline → live red route + stars ──
  drawTrip() {
    if (!this.map) return;
    this.tripPlanLayer.clearLayers();
    this.tripDoneLayer.clearLayers();
    this.tripStopLayer.clearLayers();
    this.liveLayer.clearLayers();

    const trip = Storage.getTrip();
    const stops = Trip._sorted(trip)
      .map(s => ({ s, c: Trip.stopCoords(s) }))
      .filter(x => x.c);
    if (!stops.length) return;

    // Planned route — faint dashed outline through the whole itinerary
    if (stops.length > 1) {
      L.polyline(stops.map(x => [x.c.lat, x.c.lng]), {
        color: MapUtil.planLineColor(), weight: 2, opacity: 1, dashArray: '3,7',
      }).addTo(this.tripPlanLayer);
    }

    // Traversed route — solid red through reached stops + the live frontier
    const done = stops.filter(x => x.s.reached).map(x => [x.c.lat, x.c.lng]);
    if (trip.status === 'live' && trip.currentStopId) {
      const cur = stops.find(x => x.s.id === trip.currentStopId);
      if (cur) done.push([cur.c.lat, cur.c.lng]);
    }
    if (done.length > 1) {
      L.polyline(done, { color: '#c8432e', weight: 4, opacity: 0.95 }).addTo(this.tripDoneLayer);
    }

    // Stop markers (hollow ☆ planned → gold ★ reached) + live pulse
    stops.forEach(({ s, c }) => {
      const isCurrent = trip.status === 'live' && s.id === trip.currentStopId;
      L.marker([c.lat, c.lng], { icon: MapUtil.tripStarIcon(s.reached) })
        .bindTooltip(s.name, { direction: 'top', className: 'map-tooltip', offset: [0, -11], opacity: 1 })
        .on('click', () => Trip.openPost(s.id))
        .addTo(this.tripStopLayer);

      if (isCurrent) {
        L.marker([c.lat, c.lng], { icon: MapUtil.liveIcon(), interactive: false })
          .addTo(this.liveLayer);
      }
    });
  },

  flyToStop(id) {
    if (!this.map) return;
    const trip = Storage.getTrip();
    const stop = trip.stops.find(s => s.id === id);
    if (!stop) return;
    const c = Trip.stopCoords(stop);
    if (c) this.map.flyTo([c.lat, c.lng], Math.max(this.map.getZoom(), 6), { duration: 0.8 });
  },

  _fit() {
    if (!this.map) return;
    const pts = [
      ...Storage.getLocatedPhotos().map(x => [x.coords.lat, x.coords.lng]),
      ...Trip._sorted(Storage.getTrip()).map(s => Trip.stopCoords(s)).filter(Boolean).map(c => [c.lat, c.lng]),
    ];
    if (pts.length) {
      this.map.fitBounds(L.latLngBounds(pts).pad(0.2));
    } else {
      this.map.fitBounds(L.latLngBounds(ROUTE_66.path).pad(0.1));
    }
  },

  _updateStatus(n) {
    const win = WindowManager.findByType('map');
    if (!win) return;
    const el = win.el.querySelector('.map-status');
    if (el) el.textContent = `${n} pinned`;
  },

  _toggleEmptyHint(show) {
    const win = WindowManager.findByType('map');
    if (!win) return;
    const hint = win.el.querySelector('.map-empty');
    if (hint) hint.hidden = !show;
  },

  applyTheme(theme) {
    if (!this.map || !this.tileLayer) return;
    this.map.removeLayer(this.tileLayer);
    this.tileLayer = MapUtil.makeTiles(theme).addTo(this.map);
    this.tileLayer.bringToBack();
    this.refresh();   // trip line colour follows the theme accent
  },
};

// ── Location Picker window ───────────────────────────────────────────────────

const LocationPicker = {
  map:        null,
  winId:      null,
  marker:     null,
  photoId:    null,
  resizeObs:  null,
  searchTimer: null,

  open(photoId) {
    this.photoId = photoId;
    const existing = WindowManager.findByType('locpicker');
    if (existing) {
      existing.minimized ? WindowManager.restore(existing.id) : WindowManager.focus(existing.id);
      this._load(existing.el, photoId);
      return;
    }
    const { el, id } = WindowManager.create('locpicker', { width: 460, height: 480, x: 220, y: 110 });
    this.winId = id;
    this._init(el);
    this._load(el, photoId);
  },

  _init(winEl) {
    const canvas = winEl.querySelector('.picker-canvas');
    this.map = L.map(canvas, { zoomControl: true }).setView([36.5, -98], 4);
    MapUtil.makeTiles(Storage.getTheme()).addTo(this.map);

    this.map.on('click', e => this._place(e.latlng));

    winEl.querySelector('.picker-save').addEventListener('click',  () => this._save(winEl));
    winEl.querySelector('.picker-clear').addEventListener('click', () => this._clear(winEl));

    const input = winEl.querySelector('.picker-search-input');
    winEl.querySelector('.picker-search-btn').addEventListener('click', () => this._search(winEl, input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this._search(winEl, input.value); }
    });

    this.resizeObs = MapUtil.watchResize(this.map, winEl);
    setTimeout(() => this.map.invalidateSize(), 60);
  },

  _load(winEl, photoId) {
    const photo = Storage.getPhotos().find(p => p.id === photoId);
    const title = winEl.querySelector('.win-title');
    if (title && photo) title.textContent = `▒ SET LOCATION — ${photo.filename}`;

    const coords = Storage.getCoords(photo);
    if (this.marker) { this.map.removeLayer(this.marker); this.marker = null; }

    if (coords) {
      this._place(L.latLng(coords.lat, coords.lng));
      this.map.setView([coords.lat, coords.lng], 9);
    } else {
      this._setCoordLabel(winEl, null);
      this.map.setView([36.5, -98], 4);
    }
  },

  _place(latlng) {
    if (this.marker) {
      this.marker.setLatLng(latlng);
    } else {
      this.marker = L.marker(latlng, { icon: MapUtil.photoIcon(true), draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => this._setCoordLabel(this._winEl(), this.marker.getLatLng()));
    }
    this._setCoordLabel(this._winEl(), latlng);
  },

  _setCoordLabel(winEl, latlng) {
    if (!winEl) return;
    const el = winEl.querySelector('.picker-coords');
    el.textContent = latlng
      ? `PIN: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`
      : 'click map to drop pin';
  },

  _clear(winEl) {
    if (this.marker) { this.map.removeLayer(this.marker); this.marker = null; }
    Storage.setCoords(this.photoId, null);
    this._setCoordLabel(winEl, null);
    Gallery.updateCoordsDisplay(this.photoId);
    Gallery.refresh();
    if (RouteMap.map) RouteMap.refresh();
  },

  _save(winEl) {
    if (!this.marker) { this._flash(winEl, '.picker-save', '[ DROP A PIN FIRST ]'); return; }
    const { lat, lng } = this.marker.getLatLng();
    Storage.setCoords(this.photoId, { lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
    Gallery.updateCoordsDisplay(this.photoId);
    Gallery.refresh();
    if (RouteMap.map) RouteMap.refresh();
    this._flash(winEl, '.picker-save', '[ SAVED ✓ ]');
  },

  // ── Geocoding search (OpenStreetMap Nominatim, no key) ──────
  async _search(winEl, query) {
    query = (query || '').trim();
    const results = winEl.querySelector('.picker-results');
    if (!query) { results.classList.remove('show'); return; }

    results.innerHTML = '<div class="picker-result muted">searching...</div>';
    results.classList.add('show');

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!res.ok) throw new Error('search failed');
      const data = await res.json();

      if (!data.length) {
        results.innerHTML = '<div class="picker-result muted">no places found</div>';
        return;
      }

      results.innerHTML = '';
      data.forEach(place => {
        const row = document.createElement('div');
        row.className = 'picker-result';
        row.textContent = place.display_name;
        row.title = place.display_name;
        row.addEventListener('click', () => {
          const latlng = L.latLng(parseFloat(place.lat), parseFloat(place.lon));
          this._place(latlng);
          this.map.setView(latlng, 10);
          results.classList.remove('show');
        });
        results.appendChild(row);
      });
    } catch {
      results.innerHTML = '<div class="picker-result muted">search unavailable — click the map instead</div>';
    }
  },

  _winEl() {
    const win = WindowManager.findByType('locpicker');
    return win ? win.el : null;
  },

  _flash(winEl, sel, msg) {
    const btn = winEl.querySelector(sel);
    const orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(() => { btn.textContent = orig; }, 1300);
  },
};
