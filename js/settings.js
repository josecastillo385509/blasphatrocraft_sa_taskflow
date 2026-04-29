/* ============================================================
   Settings
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initPage('settings');
  bindEvents();
  refreshStats();
  renderUsers();
  highlightActiveTheme();
});

function bindEvents() {
  // Export
  document.getElementById('btn-export').addEventListener('click', () => {
    const stamp = new Date().toISOString().slice(0, 10);
    DataIO.downloadJSON(`taskflow-backup-${stamp}.json`);
    showToast('Datos exportados', 'success');
  });

  // Import
  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ok = await confirmDialog({
      title: 'Importar datos',
      message: `Esto <strong>reemplazará</strong> todos los datos actuales con los del archivo <code>${escapeHtml(file.name)}</code>. ¿Continuar?`,
      confirmText: 'Importar',
      confirmClass: 'btn-primary'
    });
    if (!ok) {
      e.target.value = '';
      return;
    }
    try {
      const text = await file.text();
      const result = DataIO.importFromJSON(text);
      showToast(`Importado: ${result.projects} proyectos, ${result.tasks} tareas`, 'success');
      refreshStats();
      renderUsers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      e.target.value = '';
    }
  });

  // Clear all
  document.getElementById('btn-clear').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: '¿Eliminar todos los datos?',
      message: 'Esto borrará permanentemente <strong>todos los proyectos, tareas, perfiles y actividad</strong>. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar todo'
    });
    if (ok) {
      DataIO.clearAll();
      showToast('Todos los datos han sido eliminados', 'success');
      refreshStats();
      renderUsers();
    }
  });

  // Theme
  document.querySelectorAll('[data-theme-set]').forEach(btn => {
    btn.addEventListener('click', () => {
      ThemeStore.set(btn.dataset.themeSet);
      highlightActiveTheme();
      // Actualizar el icono del sidebar
      mountSidebar('settings');
    });
  });

  // Add user
  document.getElementById('user-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('user-name');
    try {
      UserStore.create({ name: input.value });
      input.value = '';
      renderUsers();
      showToast('Perfil creado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function highlightActiveTheme() {
  const current = ThemeStore.get();
  document.querySelectorAll('[data-theme-set]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeSet === current);
  });
}

function refreshStats() {
  const projects = ProjectStore.getAll().length;
  const tasks = TaskStore.getAll().length;
  const users = UserStore.getAll().length;
  const activity = ActivityStore.getAll().length;
  document.getElementById('data-stats').innerHTML = `
    <span><strong>${projects}</strong> proyectos</span>
    <span><strong>${tasks}</strong> tareas</span>
    <span><strong>${users}</strong> perfiles</span>
    <span><strong>${activity}</strong> registros de actividad</span>
  `;
}

function renderUsers() {
  const list = document.getElementById('users-list');
  const users = UserStore.getAll();
  const tasks = TaskStore.getAll();

  if (!users.length) {
    list.innerHTML = '<div class="users-empty">No hay perfiles aún. Crea uno para asignar tareas.</div>';
    return;
  }

  list.innerHTML = users.map(u => {
    const count = tasks.filter(t => t.assigneeId === u.id).length;
    const initials = u.name.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
    return `
      <div class="user-item">
        <div class="user-avatar">${escapeHtml(initials)}</div>
        <div class="user-name">${escapeHtml(u.name)}</div>
        <span class="user-tasks">${count} tarea${count === 1 ? '' : 's'}</span>
        <button class="task-action-btn danger" data-user-delete="${u.id}" title="Eliminar perfil"
                style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-user-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.userDelete;
      const u = UserStore.getById(id);
      const ok = await confirmDialog({
        title: 'Eliminar perfil',
        message: `¿Eliminar el perfil <strong>${escapeHtml(u.name)}</strong>? Las tareas asignadas a este perfil quedarán sin asignar.`,
        confirmText: 'Eliminar'
      });
      if (ok) {
        UserStore.remove(id);
        renderUsers();
        showToast('Perfil eliminado', 'success');
      }
    });
  });
}
