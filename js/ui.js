/* ============================================================
   TaskFlow - UI Module
   Componentes UI compartidos: sidebar, modales, helpers
   ============================================================ */

/* ---------- SVG Icons ---------- */
const ICONS = {
  dashboard: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  projects: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  tasks: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>',
  kanban: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="5" height="18"/><rect x="10" y="3" width="5" height="12"/><rect x="17" y="3" width="4" height="8"/></svg>',
  calendar: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  stats: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  settings: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
};

/* ---------- Sidebar ---------- */
function renderSidebarInner(activePage) {
  const items = [
    { id: 'dashboard', href: 'index.html', label: 'Dashboard', icon: ICONS.dashboard },
    { id: 'projects', href: 'projects.html', label: 'Proyectos', icon: ICONS.projects },
    { id: 'tasks', href: 'tasks.html', label: 'Tareas', icon: ICONS.tasks },
    { id: 'kanban', href: 'kanban.html', label: 'Kanban', icon: ICONS.kanban },
    { id: 'calendar', href: 'calendar.html', label: 'Calendario', icon: ICONS.calendar },
    { id: 'stats', href: 'stats.html', label: 'Estadísticas', icon: ICONS.stats },
    { id: 'settings', href: 'settings.html', label: 'Configuración', icon: ICONS.settings }
  ];

  const isDark = ThemeStore.get() === 'dark';

  return `
    <div class="brand">
      <span class="brand-mark">⌘</span>
      <span class="brand-name">TaskFlow</span>
    </div>
    <nav class="nav">
      ${items.map(it => `
        <a href="${it.href}" class="${activePage === it.id ? 'active' : ''}">
          ${it.icon}
          <span>${it.label}</span>
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-actions">
        <button class="icon-btn" id="theme-toggle" title="Cambiar tema">
          ${isDark ? ICONS.sun : ICONS.moon}
        </button>
      </div>
      <div style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); letter-spacing: 0.1em;">
        v1.0 · LOCAL
      </div>
    </div>
  `;
}

function mountSidebar(activePage) {
  const slot = document.getElementById('sidebar-slot');
  if (!slot) {
    console.warn('[TaskFlow] No se encontró #sidebar-slot en la página');
    return;
  }
  // El slot YA es el <aside class="sidebar"> en el HTML estático.
  // Solo rellenamos su contenido interior.
  slot.innerHTML = renderSidebarInner(activePage);

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const next = ThemeStore.toggle();
      toggleBtn.innerHTML = next === 'dark' ? ICONS.sun : ICONS.moon;
    });
  }
}

/* ---------- Modal helpers ---------- */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function setupModalDismiss() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('show');
    }
    if (e.target.dataset.close) {
      closeModal(e.target.dataset.close);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.show').forEach(m => m.classList.remove('show'));
    }
  });
}

/* ---------- Confirm dialog ---------- */
function confirmDialog({ title = 'Confirmar', message = '¿Estás seguro?', confirmText = 'Eliminar', confirmClass = 'btn-danger' }) {
  return new Promise(resolve => {
    let backdrop = document.getElementById('confirm-backdrop');
    if (backdrop) backdrop.remove();

    backdrop = document.createElement('div');
    backdrop.id = 'confirm-backdrop';
    backdrop.className = 'modal-backdrop show';
    backdrop.innerHTML = `
      <div class="modal confirm-dialog" role="dialog">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
        </div>
        <p style="color: var(--text-soft); line-height: 1.6;">${message}</p>
        <div class="modal-actions">
          <button class="btn" id="confirm-cancel">Cancelar</button>
          <button class="btn ${confirmClass}" id="confirm-ok">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const cleanup = (val) => {
      backdrop.remove();
      resolve(val);
    };
    backdrop.querySelector('#confirm-cancel').onclick = () => cleanup(false);
    backdrop.querySelector('#confirm-ok').onclick = () => cleanup(true);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(false);
    });
  });
}

/* ---------- Format helpers ---------- */
function formatDate(iso, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', opts);
}

function formatRelative(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
  return formatDate(iso);
}

function statusLabel(s) {
  return ({
    pendiente: 'Pendiente',
    en_progreso: 'En progreso',
    terminado: 'Terminado'
  })[s] || s;
}

function priorityLabel(p) {
  return ({ alta: 'Alta', media: 'Media', baja: 'Baja' })[p] || p;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------- Init común para todas las páginas ---------- */
function initPage(activePage) {
  ThemeStore.apply();
  mountSidebar(activePage);
  setupModalDismiss();
}
