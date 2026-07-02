'use strict';

window.addEventListener('DOMContentLoaded', async () => {

  // ── Init ──────────────────────────────────────────────────
  WindowManager.init();
  Auth.init();

  // Pull session + data from the server before opening any windows,
  // so owner-only controls and existing photos/trip are ready on first paint.
  await Storage.hydrate();

  Landing.init();   // stats/status need trip data, which is now hydrated

  // ── Theme toggle (compact glyph: [D] dark / [L] light) ────
  const themeBtn = document.getElementById('btn-theme');
  let currentTheme = Storage.getTheme();
  _applyTheme(currentTheme);

  themeBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    Storage.setTheme(currentTheme);
    _applyTheme(currentTheme);
  });

  function _applyTheme(theme) {
    document.body.dataset.theme = theme;
    themeBtn.textContent = theme === 'light' ? '[L]' : '[D]';
    themeBtn.title = theme === 'light' ? 'Light theme — click for dark' : 'Dark theme — click for light';
    RouteMap.applyTheme(theme);
  }

  // ── Taskbar buttons ───────────────────────────────────────
  document.getElementById('btn-map') .addEventListener('click', () => RouteMap.open());
  document.getElementById('btn-trip').addEventListener('click', () => Trip.open());

  // ── Desktop right-click menu ──────────────────────────────
  const ctxMenu = document.getElementById('context-menu');

  document.getElementById('desktop').addEventListener('contextmenu', e => {
    if (e.target.closest('.win')) return;
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth  - 200);
    const y = Math.min(e.clientY, window.innerHeight - 120);
    ctxMenu.style.left = `${x}px`;
    ctxMenu.style.top  = `${y}px`;
    ctxMenu.classList.remove('hidden');
  });

  document.addEventListener('click',       () => ctxMenu.classList.add('hidden'));
  document.addEventListener('contextmenu', () => ctxMenu.classList.add('hidden'));

  ctxMenu.querySelectorAll('.context-item[data-action]').forEach(item => {
    item.addEventListener('click', () => {
      switch (item.dataset.action) {
        case 'open-gallery': Gallery.open();  break;
        case 'open-map':     RouteMap.open(); break;
        case 'open-trip':    Trip.open();     break;
        case 'open-about':   _openAbout();    break;
      }
    });
  });

  // ── About window ─────────────────────────────────────────
  function _openAbout() {
    const ex = WindowManager.findByType('about');
    if (ex) { ex.minimized ? WindowManager.restore(ex.id) : WindowManager.focus(ex.id); return; }
    WindowManager.create('about', { width: 300, height: 380, x: 200, y: 140 });
  }

  // ── Clock ─────────────────────────────────────────────────
  function _tick() {
    const now = new Date();
    document.getElementById('taskbar-clock').textContent =
      `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }
  _tick();
  setInterval(_tick, 15_000);

  // ── Boot ─────────────────────────────────────────────────
  // Diary home: open the Trip (itinerary → posts) on load.
  Trip.open();

});
