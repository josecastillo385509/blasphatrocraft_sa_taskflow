/* ============================================
   TaskFlow — UI compartida
   Inyecta sidebar/topbar y maneja tema, modales,
   toasts, dialog de confirmación y formatters.
   ============================================ */

// Selectores cortos
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Etiquetas de dominio
const STATUS_LABELS = { 'pendiente': 'Pendiente', 'en-progreso': 'En progreso', 'terminado': 'Terminado' };
const PRIORITY_LABELS = { 'alta': 'Alta', 'media': 'Media', 'baja': 'Baja' };

// Metadatos por página (se leen del atributo data-page del <html>)
const PAGE_META = {
  dashboard: { eyebrow: 'Tu jornada', title: 'Inicio' },
  projects:  { eyebrow: 'Espacio de trabajo', title: 'Proyectos' },
  tasks:     { eyebrow: 'Espacio de trabajo', title: 'Tareas' },
  kanban:    { eyebrow: 'Espacio de trabajo', title: 'Tablero <em>Kanban</em>' },
  calendar:  { eyebrow: 'Espacio de trabajo', title: 'Calendario' },
  stats:     { eyebrow: 'Análisis', title: 'Estadísticas' },
  users:     { eyebrow: 'Equipo', title: 'Usuarios' },
  settings:  { eyebrow: 'Sistema', title: 'Configuración' }
};

// ---------- Formatters ----------
function todayISO() { return new Date().toISOString().slice(0, 10); }

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

function formatRelative(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return Math.floor(diff / 60) + ' min';
  if (diff < 86400) return Math.floor(diff / 3600) + ' h';
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' d';
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

function parseDate(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? null : d;
}

// ---------- Toasts ----------
const Toast = {
  _icons: {
    success: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg>',
    error:   '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    warning: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>'
  },
  show(message, type = 'default') {
    let host = $('#toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toasts';
      host.className = 'toasts';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + (type !== 'default' ? type : '');
    el.innerHTML = (this._icons[type] || '') + '<span>' + escapeHtml(message) + '</span>';
    host.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }
};

// ---------- Modales ----------
const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  },
  close(id) {
    if (id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    } else {
      $$('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  },
  bindCommon() {
    document.addEventListener('click', (e) => {
      const closer = e.target.closest('[data-close-modal]');
      if (closer) {
        const overlay = closer.closest('.modal-overlay');
        if (overlay) Modal.close(overlay.id);
      }
    });
    $$('.modal-overlay').forEach(o => {
      o.addEventListener('click', (e) => {
        if (e.target === o) Modal.close(o.id);
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Modal.close();
    });
  }
};

// ---------- Confirmación ----------
const Confirm = {
  _ensureModal() {
    if (document.getElementById('modal-confirm')) return;
    const html = `
      <div class="modal-overlay" id="modal-confirm">
        <div class="modal confirm-modal">
          <div class="modal-head" style="border:none; padding-bottom:0;">
            <h3 class="modal-title" id="confirm-title">¿Confirmar?</h3>
          </div>
          <div class="modal-body" style="padding-top:8px;">
            <div class="confirm-icon">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
              </svg>
            </div>
            <p class="confirm-text" id="confirm-text">¿Estás seguro?</p>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" data-close-modal>Cancelar</button>
            <button class="btn btn-accent" id="confirm-ok" style="background:var(--danger);">Confirmar</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },
  show(title, text, onOk) {
    this._ensureModal();
    $('#confirm-title').innerHTML = title;
    $('#confirm-text').innerHTML = text;
    const ok = $('#confirm-ok');
    const fresh = ok.cloneNode(true);
    ok.parentNode.replaceChild(fresh, ok);
    fresh.addEventListener('click', () => {
      Modal.close('modal-confirm');
      onOk();
    });
    Modal.open('modal-confirm');
  }
};

// ---------- Tema ----------
const Theme = {
  apply() {
    const t = (Store.data && Store.data.settings && Store.data.settings.theme) || 'light';
    document.documentElement.dataset.theme = t;
    const icon = $('#theme-icon');
    if (icon) {
      if (t === 'dark') {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
      } else {
        icon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>';
      }
    }
  },
  toggle() {
    const cur = document.documentElement.dataset.theme;
    const next = cur === 'dark' ? 'light' : 'dark';
    Store.setTheme(next);
    this.apply();
    document.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: next } }));
  }
};

// ---------- Sidebar / Topbar ----------
const Layout = {
  buildSidebar(activePage) {
    const projectCount = Store.data.projects.length;
    const userCount = Store.data.users.length;
    const taskCount = Store.data.tasks.length;
    return `
      <aside class="sidebar" id="sidebar">
        <div class="brand">
          <div class="brand-mark">Task<span class="accent">Flow</span></div>
          <div class="brand-tag">v1.0</div>
        </div>
        <nav class="nav">
          <div class="nav-section">Espacio de trabajo</div>
          <a class="nav-item ${activePage === 'dashboard' ? 'active' : ''}" href="index.html">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Inicio
          </a>
          <a class="nav-item ${activePage === 'projects' ? 'active' : ''}" href="projects.html">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
            Proyectos <span class="badge">${projectCount}</span>
          </a>
          <a class="nav-item ${activePage === 'tasks' ? 'active' : ''}" href="tasks.html">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            Tareas <span class="badge">${taskCount}</span>
          </a>
          <a class="nav-item ${activePage === 'kanban' ? 'active' : ''}" href="kanban.html">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="14" rx="1"/></svg>
            Tablero
          </a>
          <a class="nav-item ${activePage === 'calendar' ? 'active' : ''}" href="calendar.html">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>
            Calendario
          </a>
          <a class="nav-item ${activePage === 'stats' ? 'active' : ''}" href="stats.html">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-6"/></svg>
            Estadísticas
          </a>

          <div class="nav-section">Equipo</div>
          <a class="nav-item ${activePage === 'users' ? 'active' : ''}" href="users.html">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M21 19c0-2.5-2-4-4-4"/></svg>
            Usuarios <span class="badge">${userCount}</span>
          </a>

          <div class="nav-section">Sistema</div>
          <a class="nav-item ${activePage === 'settings' ? 'active' : ''}" href="settings.html">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Configuración
          </a>
        </nav>

        <div class="storage-status">
          <div class="storage-status-row">
            <div class="storage-dot"></div>
            <div class="storage-label">Almacenamiento</div>
          </div>
          <div class="storage-meta">localStorage</div>
          <div style="font-size:10px; color:var(--text-soft); font-family:var(--font-mono); margin-top:4px;">
            ${Store.data.projects.length} proyectos · ${Store.data.tasks.length} tareas
          </div>
        </div>
      </aside>
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
    `;
  },

  buildTopbar(page) {
    const meta = PAGE_META[page] || { eyebrow: '', title: '' };
    return `
      <header class="topbar">
        <div style="display:flex; align-items:center; gap:12px;">
          <button class="icon-btn menu-btn" id="menu-btn" aria-label="Menú">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
          <div class="page-meta">
            <div class="page-eyebrow">${meta.eyebrow}</div>
            <h1 class="page-title">${meta.title}</h1>
          </div>
        </div>
        <div class="topbar-actions">
          <button class="icon-btn" id="theme-btn" aria-label="Cambiar tema">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" id="theme-icon"></svg>
          </button>
          <button class="btn btn-accent" id="quick-add-btn">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>
            Nueva tarea
          </button>
        </div>
      </header>
    `;
  },

  // Monta sidebar y topbar dentro de los contenedores #app y #topbar
  mount(page) {
    const appEl = $('#app');
    const sidebarHTML = this.buildSidebar(page);
    appEl.insertAdjacentHTML('afterbegin', sidebarHTML);

    const topbarMount = $('#topbar-mount');
    if (topbarMount) topbarMount.outerHTML = this.buildTopbar(page);

    // Bind eventos de la layout
    $('#theme-btn').addEventListener('click', () => Theme.toggle());
    $('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    $('#sidebar-backdrop').addEventListener('click', () => $('#sidebar').classList.remove('open'));

    // Quick-add: si no hay proyectos, redirige; si hay, abre modal de tarea (si la página la soporta)
    const quickAdd = $('#quick-add-btn');
    if (quickAdd) {
      quickAdd.addEventListener('click', () => {
        if (Store.data.projects.length === 0) {
          Toast.show('Crea un proyecto primero', 'warning');
          window.location.href = 'projects.html';
          return;
        }
        // Si la página actual tiene un handler global, lo usa; si no, va a tareas
        if (typeof window.openNewTaskModal === 'function') {
          window.openNewTaskModal();
        } else {
          window.location.href = 'tasks.html?new=1';
        }
      });
    }
  }
};

// ---------- Validación de formularios ----------
function setFieldError(fieldName, hasError) {
  const f = document.querySelector(`[data-field="${fieldName}"]`);
  if (f) f.classList.toggle('has-error', !!hasError);
}

function clearFieldErrors(scope) {
  const root = scope || document;
  $$('.field.has-error', root).forEach(f => f.classList.remove('has-error'));
}

// ---------- Inicialización al cargar página ----------
document.addEventListener('DOMContentLoaded', () => {
  const page = document.documentElement.dataset.page || 'dashboard';
  Theme.apply();
  Layout.mount(page);
  Modal.bindCommon();
});
