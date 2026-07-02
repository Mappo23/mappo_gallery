'use strict';

// Server-backed store (PHP + MySQL under /api).
//
// Reads are synchronous against an in-memory cache that is hydrated once at
// boot — so the rest of the app (gallery.js, trip.js, map.js) keeps calling
// getPhotos()/getTrip() exactly as before. Writes go to the server and update
// the cache; owner-only writes are enforced server-side (401) and also gated
// here for a friendlier UX.

const Storage = {
  API: '/api',

  _photos: [],
  _trip:   null,
  _owner:  false,
  ready:   false,

  // ── Boot: pull session + data once ──────────────────────────
  async hydrate() {
    const [me, photos, trip] = await Promise.allSettled([
      this._get('/me.php'),
      this._get('/photos.php'),
      this._get('/trip.php'),
    ]);
    this._owner  = me.status === 'fulfilled' && !!me.value?.owner;
    this._photos = photos.status === 'fulfilled' && Array.isArray(photos.value) ? photos.value : [];
    this._trip   = trip.status === 'fulfilled' && trip.value && Array.isArray(trip.value.stops) ? trip.value : null;

    if (photos.status === 'rejected') {
      console.warn('[storage] offline / no backend — running read-only with empty data');
    }
    this.ready = true;
    this._applyOwnerClass();
    return this;
  },

  // ── HTTP helpers ────────────────────────────────────────────
  async _get(path) {
    const r = await fetch(this.API + path, { credentials: 'same-origin' });
    if (!r.ok) throw Object.assign(new Error(r.status), { status: r.status });
    return r.json();
  },

  async _send(method, path, body) {
    const r = await fetch(this.API + path, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw Object.assign(new Error(r.status), { status: r.status });
    return r.json();
  },

  _warn(what, err) {
    console.warn('[storage]', what, 'failed', err);
    if (err && err.status === 401) {   // session expired → drop owner UI
      this._owner = false;
      this._applyOwnerClass();
      alert('Owner session expired — unlock again (triple-click the FILM OS logo).');
    }
  },

  // ── Auth ────────────────────────────────────────────────────
  isOwner() { return this._owner; },

  _applyOwnerClass() {
    document.body.classList.toggle('is-owner', this._owner);
  },

  async login(password) {
    await this._send('POST', '/login.php', { password });
    this._owner = true;
    this._applyOwnerClass();
    return true;
  },

  async logout() {
    try { await this._send('POST', '/logout.php'); } catch { /* ignore */ }
    this._owner = false;
    this._applyOwnerClass();
  },

  _requireOwner() {
    if (!this._owner) {
      alert('Owner only — unlock first (triple-click the FILM OS logo).');
      throw new Error('not owner');
    }
  },

  // ── Photos ──────────────────────────────────────────────────
  getPhotos() { return this._photos; },

  // async: called from Upload.loadOne (which already awaits)
  async addPhoto(photo) {
    this._requireOwner();
    const saved = await this._send('POST', '/photos.php', photo);
    this._photos.unshift(saved);
    return this._photos;
  },

  updatePhoto(id, updates) {
    const idx = this._photos.findIndex(p => p.id === id);
    if (idx !== -1) this._photos[idx] = { ...this._photos[idx], ...updates };
    this._send('PATCH', '/photos.php', { id, ...updates })
        .catch(err => this._warn('save photo', err));
    return this._photos;
  },

  deletePhoto(id) {
    this._photos = this._photos.filter(p => p.id !== id);
    this._send('DELETE', `/photos.php?id=${encodeURIComponent(id)}`)
        .catch(err => this._warn('delete photo', err));
    return this._photos;
  },

  // Manual map pin takes precedence over EXIF GPS (most film cameras lack GPS)
  setCoords(id, coords) {
    return this.updatePhoto(id, { coords });
  },

  // Returns {lat, lng} from a manual pin or EXIF GPS, or null
  getCoords(photo) {
    if (!photo) return null;
    if (photo.coords && typeof photo.coords.lat === 'number') return photo.coords;
    const e = photo.exif || {};
    if (typeof e.lat === 'number' && typeof e.lng === 'number') {
      return { lat: e.lat, lng: e.lng };
    }
    return null;
  },

  // Photos that have a location, sorted chronologically (for the trip line)
  getLocatedPhotos() {
    return this.getPhotos()
      .map(p => ({ photo: p, coords: this.getCoords(p) }))
      .filter(x => x.coords)
      .sort((a, b) => {
        const ka = a.photo.exif?.date || a.photo.addedAt || '';
        const kb = b.photo.exif?.date || b.photo.addedAt || '';
        return ka.localeCompare(kb);
      });
  },

  // ── Trip (planned itinerary + live progress) ────────────────
  getTrip() {
    if (this._trip) return this._trip;
    const seed = (typeof TRIP_SEED !== 'undefined')
      ? TRIP_SEED
      : { status: 'planning', currentStopId: null, stops: [] };
    return JSON.parse(JSON.stringify(seed));   // deep copy so seed stays pristine
  },

  saveTrip(trip) {
    this._trip = trip;
    this._send('PUT', '/trip.php', trip).catch(err => this._warn('save trip', err));
    return trip;
  },

  resetTrip() {
    const seed = (typeof TRIP_SEED !== 'undefined')
      ? JSON.parse(JSON.stringify(TRIP_SEED))
      : { status: 'planning', currentStopId: null, stops: [] };
    this._trip = seed;
    this._send('PUT', '/trip.php', seed).catch(err => this._warn('reset trip', err));
    return seed;
  },

  // ── Theme (stays per-device in localStorage) ────────────────
  THEME_KEY: 'filmOS_theme',
  getTheme()      { return localStorage.getItem(this.THEME_KEY) || 'dark'; },
  setTheme(theme) { localStorage.setItem(this.THEME_KEY, theme); },
};
