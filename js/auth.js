'use strict';

// Hidden owner unlock — no visible login box.
// Triple-click the FILM OS logo (taskbar, bottom-left) to unlock/lock.
// Visitors just see a clean, read-only desktop; owner-only controls
// (upload, save, delete, trip editing) appear once unlocked.

const Auth = {
  _toastTimer: null,

  init() {
    const logo = document.getElementById('taskbar-logo');
    if (!logo) return;

    let clicks = 0, timer = null;
    logo.addEventListener('click', () => {
      clicks += 1;
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 600);
      if (clicks >= 3) {
        clicks = 0;
        clearTimeout(timer);
        Auth.toggle();
      }
    });
  },

  async toggle() {
    if (Storage.isOwner()) {
      if (confirm('Lock owner mode (log out)?')) {
        await Storage.logout();
        Auth._toast('LOCKED');
      }
      return;
    }
    const pw = prompt('Owner password:');
    if (pw == null || pw === '') return;
    try {
      await Storage.login(pw);
      Auth._toast('UNLOCKED ✓');
    } catch (err) {
      Auth._toast(err.status === 401 ? 'WRONG PASSWORD' : 'LOGIN FAILED');
    }
  },

  _toast(msg) {
    let t = document.getElementById('auth-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'auth-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(Auth._toastTimer);
    Auth._toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  },
};
