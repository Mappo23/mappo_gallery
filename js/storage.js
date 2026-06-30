'use strict';

const Storage = {
  PHOTOS_KEY: 'filmOS_photos',

  getPhotos() {
    try {
      return JSON.parse(localStorage.getItem(this.PHOTOS_KEY)) || [];
    } catch {
      return [];
    }
  },

  _save(photos) {
    try {
      localStorage.setItem(this.PHOTOS_KEY, JSON.stringify(photos));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        throw new Error('Storage full — remove some photos first');
      }
      throw e;
    }
  },

  addPhoto(photo) {
    const photos = this.getPhotos();
    photos.unshift(photo);
    this._save(photos);
    return photos;
  },

  updatePhoto(id, updates) {
    const photos = this.getPhotos();
    const idx = photos.findIndex(p => p.id === id);
    if (idx !== -1) {
      photos[idx] = { ...photos[idx], ...updates };
      this._save(photos);
    }
    return photos;
  },

  deletePhoto(id) {
    const photos = this.getPhotos().filter(p => p.id !== id);
    this._save(photos);
    return photos;
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
  TRIP_KEY: 'filmOS_trip',

  getTrip() {
    try {
      const t = JSON.parse(localStorage.getItem(this.TRIP_KEY));
      if (t && Array.isArray(t.stops)) return t;
    } catch { /* fall through to seed */ }
    const seed = (typeof TRIP_SEED !== 'undefined')
      ? TRIP_SEED
      : { status: 'planning', currentStopId: null, stops: [] };
    return JSON.parse(JSON.stringify(seed));   // deep copy so seed stays pristine
  },

  saveTrip(trip) {
    try {
      localStorage.setItem(this.TRIP_KEY, JSON.stringify(trip));
    } catch (e) {
      if (e.name === 'QuotaExceededError') throw new Error('Storage full');
      throw e;
    }
    return trip;
  },

  resetTrip() {
    localStorage.removeItem(this.TRIP_KEY);
    return this.getTrip();
  },

  THEME_KEY: 'filmOS_theme',

  getTheme() {
    return localStorage.getItem(this.THEME_KEY) || 'dark';
  },

  setTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme);
  },
};
