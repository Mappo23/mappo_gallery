'use strict';

const WindowManager = {
  container:      null,
  taskbarWindows: null,
  zCounter:       100,
  windows:        new Map(),   // id → { el, type, minimized, taskbarBtn, _prevPos }

  init() {
    this.container      = document.getElementById('windows-container');
    this.taskbarWindows = document.getElementById('taskbar-windows');
  },

  create(type, opts = {}) {
    const tpl = document.getElementById(`tpl-${type}`);
    if (!tpl) return null;

    const id  = `win-${type}-${Date.now()}`;
    const el  = tpl.content.cloneNode(true).firstElementChild;

    el.id            = id;
    el.style.left    = `${opts.x   ?? 60 + Math.random() * 80}px`;
    el.style.top     = `${opts.y   ?? 60 + Math.random() * 60}px`;
    el.style.width   = `${opts.width  || 800}px`;
    el.style.height  = `${opts.height || 560}px`;
    el.style.zIndex  = this.zCounter;

    this.container.appendChild(el);

    const taskbarBtn = this._mkTaskbarBtn(id, type);
    this.windows.set(id, { el, type, minimized: false, taskbarBtn, _prevPos: null });

    this._bindControls(el, id);
    this._bindDrag(el, id);
    this._bindResize(el);
    el.addEventListener('mousedown', () => this.focus(id));

    this.focus(id);
    return { el, id };
  },

  focus(id) {
    const win = this.windows.get(id);
    if (!win) return;
    win.el.style.zIndex = ++this.zCounter;
    this.windows.forEach((w, wid) => {
      w.el.classList.toggle('win-active', wid === id);
      w.taskbarBtn?.classList.toggle('active', wid === id);
    });
  },

  minimize(id) {
    const win = this.windows.get(id);
    if (!win) return;
    win.el.classList.add('win-minimized');
    win.minimized = true;
    win.taskbarBtn?.classList.add('minimized');
    win.taskbarBtn?.classList.remove('active');
  },

  restore(id) {
    const win = this.windows.get(id);
    if (!win) return;
    win.el.classList.remove('win-minimized');
    win.minimized = false;
    win.taskbarBtn?.classList.remove('minimized');
    this.focus(id);
  },

  close(id) {
    const win = this.windows.get(id);
    if (!win) return;
    win.el.remove();
    win.taskbarBtn?.remove();
    this.windows.delete(id);
  },

  toggle(id) {
    const win = this.windows.get(id);
    if (!win) return;
    win.minimized ? this.restore(id) : this.focus(id);
  },

  maximize(id) {
    const win = this.windows.get(id);
    if (!win) return;
    const el = win.el;
    if (el.classList.contains('win-maximized')) {
      el.classList.remove('win-maximized');
      if (win._prevPos) {
        el.style.left   = win._prevPos.left;
        el.style.top    = win._prevPos.top;
        el.style.width  = win._prevPos.width;
        el.style.height = win._prevPos.height;
      }
    } else {
      win._prevPos = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height };
      el.classList.add('win-maximized');
    }
  },

  findByType(type) {
    for (const [id, win] of this.windows) {
      if (win.type === type) return { id, ...win };
    }
    return null;
  },

  updateTitle(id, title) {
    const win = this.windows.get(id);
    if (!win) return;
    const el = win.el.querySelector('.win-title');
    if (el) el.textContent = title;
    if (win.taskbarBtn) win.taskbarBtn.textContent = `[ ${title.replace('▒ ', '')} ]`;
  },

  // ── Private ──────────────────────────────────────────────

  _bindControls(el, id) {
    el.querySelector('.win-close')?.addEventListener('click', e => { e.stopPropagation(); this.close(id); });
    el.querySelector('.win-min')  ?.addEventListener('click', e => { e.stopPropagation(); this.minimize(id); });
    el.querySelector('.win-max')  ?.addEventListener('click', e => { e.stopPropagation(); this.maximize(id); });
  },

  _bindDrag(el, id) {
    const bar = el.querySelector('.win-titlebar');
    let ox, oy, dragging = false;

    bar.addEventListener('mousedown', e => {
      if (e.target.closest('.win-controls')) return;
      dragging = true;
      ox = e.clientX - el.offsetLeft;
      oy = e.clientY - el.offsetTop;
      this.focus(id);
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const maxX = window.innerWidth  - 60;
      const maxY = window.innerHeight - 40;
      el.style.left = `${Math.max(0, Math.min(maxX, e.clientX - ox))}px`;
      el.style.top  = `${Math.max(0, Math.min(maxY, e.clientY - oy))}px`;
    });

    document.addEventListener('mouseup', () => { dragging = false; });
  },

  _bindResize(el) {
    const handle = el.querySelector('.win-resize-handle');
    if (!handle) return;
    let resizing = false, sx, sy, sw, sh;

    handle.addEventListener('mousedown', e => {
      resizing = true;
      sx = e.clientX; sy = e.clientY;
      sw = el.offsetWidth; sh = el.offsetHeight;
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', e => {
      if (!resizing) return;
      el.style.width  = `${Math.max(320,  sw + e.clientX - sx)}px`;
      el.style.height = `${Math.max(220,  sh + e.clientY - sy)}px`;
    });

    document.addEventListener('mouseup', () => { resizing = false; });
  },

  _mkTaskbarBtn(id, type) {
    const btn = document.createElement('button');
    btn.className   = 'taskbar-win-btn';
    btn.textContent = `[ ${type.toUpperCase()} ]`;
    btn.dataset.winId = id;
    btn.addEventListener('click', () => {
      const win = this.windows.get(id);
      if (!win) return;
      win.minimized ? this.restore(id) : this.focus(id);
    });
    this.taskbarWindows.appendChild(btn);
    return btn;
  },
};
