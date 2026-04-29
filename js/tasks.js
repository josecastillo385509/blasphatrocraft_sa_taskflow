/* ============================================================
   Tasks logic
   ============================================================ */

const filters = {
  project: '',
  status: '',
  priority: '',
  search: ''
};

document.addEventListener('DOMContentLoaded', () => {
  initPage('tasks');
  // Pre-filtro desde query string (cuando se viene desde projects)
  const url = new URL(window.location.href);
  const projectParam = url.searchParams.get('project');
  if (projectParam) filters.project = projectParam;

  bindEvents();
  populateFilters();
  populateProjectSelect();
  populateAssigneeSelect();
  applyFiltersToUI();
  render();
});

function bindEvents() {
  document.getElementById('btn-new-task').addEventListener('click', () => openTaskModal());
  document.getElementById('task-form').addEventListener('submit', handleSubmit);

  document.getElementById('filter-project').addEventListener('change', e => {
    filters.project = e.target.value;
    render();
  });
  document.getElementById('filter-status').addEventListener('change', e => {
    filters.status = e.target.value;
    render();
  });
  document.getElementById('filter-priority').addEventListener('change', e => {
    filters.priority = e.target.value;
    render();
  });
  document.getElementById('filter-search').addEventListener('input', e => {
    filters.search = e.target.value.trim().toLowerCase();
    render();
  });
}

function applyFiltersToUI() {
  document.getElementById('filter-project').value = filters.project;
  document.getElementById('filter-status').value = filters.status;
  document.getElementById('filter-priority').value = filters.priority;
}

function populateFilters() {
  const projects = ProjectStore.getAll();
  const sel = document.getElementById('filter-project');
  sel.innerHTML = '<option value="">Todos los proyectos</option>' +
    projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
}

function populateProjectSelect() {
  const projects = ProjectStore.getAll();
  const sel = document.getElementById('task-project');
  if (!projects.length) {
    sel.innerHTML = '<option value="" disabled>— Crea un proyecto primero —</option>';
    return;
  }
  sel.innerHTML = projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
}

function populateAssigneeSelect() {
  const users = UserStore.getAll();
  const sel = document.getElementById('task-assignee');
  sel.innerHTML = '<option value="">— Sin asignar —</option>' +
    users.map(u => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join('');
}

function openTaskModal(task = null) {
  if (!ProjectStore.getAll().length) {
    showToast('Necesitas crear al menos un proyecto antes de crear tareas', 'warning');
    setTimeout(() => { window.location.href = 'projects.html'; }, 1200);
    return;
  }
  populateProjectSelect();
  populateAssigneeSelect();
  const isEdit = !!task;
  document.getElementById('task-modal-title').textContent = isEdit ? 'Editar tarea' : 'Nueva tarea';
  document.getElementById('task-submit').textContent = isEdit ? 'Actualizar' : 'Crear';
  document.getElementById('task-id').value = isEdit ? task.id : '';
  document.getElementById('task-title').value = isEdit ? task.title : '';
  document.getElementById('task-description').value = isEdit ? (task.description || '') : '';
  document.getElementById('task-project').value = isEdit ? task.projectId : (filters.project || ProjectStore.getAll()[0]?.id || '');
  document.getElementById('task-priority').value = isEdit ? task.priority : 'media';
  document.getElementById('task-status').value = isEdit ? task.status : 'pendiente';
  document.getElementById('task-due').value = isEdit && task.dueDate ? task.dueDate.slice(0, 10) : '';
  document.getElementById('task-assignee').value = isEdit && task.assigneeId ? task.assigneeId : '';
  openModal('task-modal');
  setTimeout(() => document.getElementById('task-title').focus(), 50);
}

function handleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('task-id').value;
  const data = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-description').value,
    projectId: document.getElementById('task-project').value,
    priority: document.getElementById('task-priority').value,
    status: document.getElementById('task-status').value,
    dueDate: document.getElementById('task-due').value || null,
    assigneeId: document.getElementById('task-assignee').value || null
  };
  try {
    if (id) {
      TaskStore.update(id, data);
      showToast('Tarea actualizada', 'success');
    } else {
      TaskStore.create(data);
      showToast('Tarea creada', 'success');
    }
    closeModal('task-modal');
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteTask(id) {
  const t = TaskStore.getById(id);
  if (!t) return;
  const ok = await confirmDialog({
    title: 'Eliminar tarea',
    message: `¿Eliminar la tarea <strong>${escapeHtml(t.title)}</strong>?`,
    confirmText: 'Eliminar'
  });
  if (ok) {
    TaskStore.remove(id);
    showToast('Tarea eliminada', 'success');
    render();
  }
}

function toggleComplete(id) {
  const t = TaskStore.getById(id);
  if (!t) return;
  const newStatus = t.status === 'terminado' ? 'pendiente' : 'terminado';
  TaskStore.update(id, { status: newStatus });
  render();
}

function getFilteredTasks() {
  let list = TaskStore.getAll();
  if (filters.project) list = list.filter(t => t.projectId === filters.project);
  if (filters.status) list = list.filter(t => t.status === filters.status);
  if (filters.priority) list = list.filter(t => t.priority === filters.priority);
  if (filters.search) {
    list = list.filter(t =>
      t.title.toLowerCase().includes(filters.search) ||
      (t.description && t.description.toLowerCase().includes(filters.search))
    );
  }
  return list;
}

function render() {
  const tasks = getFilteredTasks();
  const projects = ProjectStore.getAll();
  const users = UserStore.getAll();
  const container = document.getElementById('tasks-container');

  if (!projects.length) {
    container.innerHTML = `
      <div class="empty-state" style="background: var(--bg-elev); border: 1px dashed var(--border); border-radius: var(--radius-lg);">
        <div class="icon">∅</div>
        <h3>Primero, crea un proyecto</h3>
        <p>Las tareas pertenecen a un proyecto. Crea uno para empezar a registrar tareas.</p>
        <a href="projects.html" class="btn btn-primary" style="margin-top: 20px;">Ir a proyectos →</a>
      </div>
    `;
    return;
  }

  if (!tasks.length) {
    container.innerHTML = `
      <div class="empty-state" style="background: var(--bg-elev); border: 1px dashed var(--border); border-radius: var(--radius-lg);">
        <div class="icon">∅</div>
        <h3>Sin tareas que mostrar</h3>
        <p>${TaskStore.getAll().length === 0 ? 'Todavía no hay tareas. Crea la primera para empezar.' : 'Ninguna tarea coincide con los filtros activos.'}</p>
      </div>
    `;
    return;
  }

  // Agrupar por estado
  const grouped = {
    pendiente: tasks.filter(t => t.status === 'pendiente'),
    en_progreso: tasks.filter(t => t.status === 'en_progreso'),
    terminado: tasks.filter(t => t.status === 'terminado')
  };

  const order = ['pendiente', 'en_progreso', 'terminado'];

  container.innerHTML = order
    .filter(k => grouped[k].length > 0)
    .map(k => `
      <section class="task-group">
        <div class="task-group-header">
          <span class="badge badge-status-${k}">${statusLabel(k)}</span>
          <span class="task-group-count">${grouped[k].length}</span>
        </div>
        ${grouped[k].map(t => taskRow(t, projects, users)).join('')}
      </section>
    `).join('');

  // Bind events
  container.querySelectorAll('[data-task-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const action = btn.dataset.taskAction;
      if (action === 'edit') openTaskModal(TaskStore.getById(id));
      else if (action === 'delete') deleteTask(id);
      else if (action === 'toggle') toggleComplete(id);
    });
  });
}

function taskRow(t, projects, users) {
  const project = projects.find(p => p.id === t.projectId);
  const user = users.find(u => u.id === t.assigneeId);
  const isDone = t.status === 'terminado';

  let dueText = '';
  let dueClass = '';
  if (t.dueDate) {
    const d = new Date(t.dueDate);
    const today = new Date(); today.setHours(0,0,0,0);
    if (d < today && !isDone) dueClass = 'overdue';
    dueText = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  return `
    <div class="task-row ${isDone ? 'completed' : ''}">
      <button class="task-checkbox ${isDone ? 'checked' : ''}" data-task-action="toggle" data-id="${t.id}" title="Marcar/desmarcar"></button>
      <div class="task-info">
        <div class="task-title-text">${escapeHtml(t.title)}</div>
        <div class="task-meta">
          ${project ? `<span class="task-project-tag"><span class="dot" style="background:${escapeHtml(project.color)}"></span>${escapeHtml(project.name)}</span>` : ''}
          ${dueText ? `<span class="task-due ${dueClass}">${dueClass === 'overdue' ? '⚠ ' : '◷ '}${dueText}</span>` : ''}
          ${user ? `<span>👤 ${escapeHtml(user.name)}</span>` : ''}
        </div>
      </div>
      <span class="badge task-priority-badge badge-priority-${t.priority}">${priorityLabel(t.priority)}</span>
      <div class="task-actions">
        <button class="task-action-btn" data-task-action="edit" data-id="${t.id}" title="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="task-action-btn danger" data-task-action="delete" data-id="${t.id}" title="Eliminar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  `;
}
