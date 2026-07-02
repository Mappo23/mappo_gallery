'use strict';

// Front door of the site — a full-screen splash shown before the desktop OS.
// The desktop boots underneath it regardless (see app.js); [ ENTER ] just
// reveals what's already there.

const Landing = {
  init() {
    const overlay = document.getElementById('landing');
    if (!overlay) return;

    this._renderStats(overlay);

    const enter = () => this.enter();
    overlay.querySelector('#landing-enter').addEventListener('click', enter);
    document.addEventListener('keydown', e => {
      if (overlay.hidden) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); }
    });
  },

  _renderStats(overlay) {
    const trip  = Storage.getTrip();
    const stops = Trip._sorted(trip);

    if (stops.length) {
      overlay.querySelector('#landing-stat-stops').textContent = stops.length;
      const first = stops[0].date, last = stops[stops.length - 1].date;
      if (first && last) {
        const days = Math.round((new Date(last) - new Date(first)) / 86400000) + 1;
        if (Number.isFinite(days) && days > 0) {
          overlay.querySelector('#landing-stat-days').textContent = days;
        }
      }
    }

    const status = overlay.querySelector('#landing-status');
    if (trip.status === 'live') {
      status.textContent = '● LIVE ON THE ROAD';
      status.classList.add('is-live');
    } else if (trip.status === 'done') {
      status.textContent = '✓ TRIP COMPLETE';
      status.classList.add('is-done');
    }
  },

  enter() {
    const overlay = document.getElementById('landing');
    if (!overlay || overlay.hidden) return;
    overlay.classList.add('landing-hiding');
    setTimeout(() => { overlay.hidden = true; }, 420);
  },
};
