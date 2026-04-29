/* ============================================
   Tasks
   ============================================ */

let editingTaskId = null;
const filters = { project: 'all', status: 'all', priority: 'all', search: '' };

// Exponer para el quick-add del topbar
window.openNewTaskModal = () => openTaskModal(null);

document.addEventListener('DOMContentLoaded', () => {
  bindFilters();
  bindTaskForm();
  $('#btn-new-task').addEventListener('click', () => openTaskModal(null));
  renderTasks();

  // Soporte para querystring: ?id=... abre tarea en edición; ?new=1 abre modal nueva
  const params = new URLSearchParams(location.search);
  if (params.get('id')) openTaskModal(params.get('id'));
  else if (params.get('new')) openTaskModal(null);
});

function bindFilters() {
  // Llenar el select de proyectos
  const projSelect = $('#filter-project');
  projSelect.innerHTML = '<option value="all">Todos los proyectos</option>' +
    Store.data.projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

  $('#filter-project').addEventListener('change', e => { filters.project = e.target.value; renderTasks(); });
  $('#filter-status').addEventListener('change', e => { filters.status = e.target.value; renderTasks(); });
  $('#filter-priority').addEventListener('change', e => { filters.priority = e.target.value; renderTasks(); });
  $('#filter-search').addEventListener('input', e => { filters.search = e.target.value; renderTasks(); });
}

function renderTasks() {
  const container = $('#tasks-container');

  if (Store.data.projects.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-mark">∅</div>
        <h3>Sin proyectos</h3>
        <p>Crea un proyecto antes de añadir tareas.</p>
        <a class="btn btn-accent" href="projects.html">Crear proyecto</a>
      </div>`;
    return;
  }

  const filtered = Store.data.tasks.filter(t => {
    if (filters.project !== 'all' && t.projectId !== filters.project) return false;
    if (filters.status !== 'all' && t.status !== filters.status) return false;
    if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
    const q = filters.search.toLowerCase();
    if (q && !(t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))) return false;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-mark">∅</div>
        <h3>${Store.data.tasks.length === 0 ? 'Sin tareas todavía' : 'Ninguna tarea coincide'}</h3>
        <p>${Store.data.tasks.length === 0 ? 'Crea tu primera tarea para empezar.' : 'Ajusta los filtros o crea una nueva tarea.'}</p>
        <button class="btn btn-accent" onclick="openTaskModal(null)">Nueva tarea</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="tasks-table">
      <div class="tasks-table-head">
        <div>Título</div>
        <div>Proyecto</div>
        <div>Prioridad</div>
        <div>Estado</div>
        <div>Fecha límite</div>
        <div>Asignado</div>
        <div></div>
      </div>
      ${filtered.map(t => taskRow(t)).join('')}
    </div>
  `;
}

function taskRow(t) {
  const project = Store.data.projects.find(p => p.id === t.projectId);
  const assignee = Store.data.users.find(u => u.id === t.assignedTo);
  const isOverdue = t.dueDate && t.dueDate < todayISO() && t.status !== 'terminado';
  return `
    <div class="tasks-row" onclick="openTaskModal('${t.id}')">
      <div class="tasks-row-title ${t.status === 'terminado' ? 'done' : ''}">${escapeHtml(t.title)}</div>
      <div class="tasks-row-project" style="--proj-color:${project ? project.color : 'var(--accent)'}">
        ${project ? escapeHtml(project.name) : '—'}
      </div>
      <div><span class="pill pill-${t.priority}">${PRIORITY_LABELS[t.priority]}</span></div>
      <div><span class="pill pill-${t.status}">${STATUS_LABELS[t.status]}</span></div>
      <div style="font-family:var(--font-mono); font-size:12px; ${isOverdue ? 'color:var(--danger); font-weight:600;' : 'color:var(--text-muted);'}">${t.dueDate ? escapeHtml(formatDate(t.dueDate)) : '—'}</div>
      <div style="font-size:12px; color:var(--text-muted);">${assignee ? escapeHtml(assignee.name) : '<em style="color:var(--text-soft);">—</em>'}</div>
      <div class="tasks-row-actions" onclick="event.stopPropagation()">
        <button class="icon-btn-sm" onclick="openTaskModal('${t.id}')" title="Editar">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-btn-sm danger" onclick="deleteTask('${t.id}')" title="Eliminar">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  `;
}

function openTaskModal(id) {
  if (!id && Store.data.projects.length === 0) {
    Toast.show('Crea un proyecto primero', 'warning');
    return;
  }

  editingTaskId = id;
  clearFieldErrors();

  // Llenar selects
  $('#task-project').innerHTML = Store.data.projects.map(p =>
    `<option value="${p.id}">${escapeHtml(p.name)}</option>`
  ).join('');

  $('#task-assignee').innerHTML = '<option value="">— Sin asignar —</option>' +
    Store.data.users.map(u => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join('');

  if (id) {
    const t = Store.data.tasks.find(x => x.id === id);
    if (!t) { Toast.show('Tarea no encontrada', 'error'); return; }
    $('#modal-task-title').innerHTML = 'Editar <em>tarea</em>';
    $('#task-title').value = t.title;
    $('#task-desc').value = t.description || '';
    $('#task-project').value = t.projectId;
    $('#task-priority').value = t.priority;
    $('#task-status').value = t.status;
    $('#task-due').value = t.dueDate || '';
    $('#task-assignee').value = t.assignedTo || '';
    $('#task-delete').style.display = 'inline-flex';
  } else {
    $('#modal-task-title').innerHTML = 'Nueva <em>tarea</em>';
    $('#task-title').value = '';
    $('#task-desc').value = '';
    $('#task-project').value = filters.project !== 'all' ? filters.project : Store.data.projects[0].id;
    $('#task-priority').value = 'media';
    $('#task-status').value = 'pendiente';
    $('#task-due').value = '';
    $('#task-assignee').value = '';
    $('#task-delete').style.display = 'none';
  }

  Modal.open('modal-task');
  setTimeout(() => $('#task-title').focus(), 100);
}

function bindTaskForm() {
  $('#task-save').addEventListener('click', saveTask);
  $('#task-delete').addEventListener('click', () => {
    if (editingTaskId) deleteTask(editingTaskId);
  });
  $('#task-title').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) saveTask();
  });
}

function saveTask() {
  clearFieldErrors();

  const title = $('#task-title').value.trim();
  const projectId = $('#task-project').value;
  const dueDate = $('#task-due').value;

  let valid = true;
  if (!title) { setFieldError('task-title', true); valid = false; }
  if (!projectId) { setFieldError('task-project', true); valid = false; }
  if (dueDate && !parseDate(dueDate)) { setFieldError('task-due', true); valid = false; }
  if (!valid) return;

  const data = {
    title,
    description: $('#task-desc').value.trim(),
    projectId,
    priority: $('#task-priority').value,
    status: $('#task-status').value,
    dueDate: dueDate || null,
    assignedTo: $('#task-assignee').value || null
  };

  if (editingTaskId) {
    Store.updateTask(editingTaskId, data);
    Toast.show('Tarea actualizada', 'success');
  } else {
    Store.createTask(data);
    Toast.show('Tarea creada', 'success');
  }

  Modal.close('modal-task');
  renderTasks();
}

function deleteTask(id) {
  const t = Store.data.tasks.find(x => x.id === id);
  if (!t) return;
  Confirm.show(
    '¿Eliminar tarea?',
    `Se eliminará <strong>${escapeHtml(t.title)}</strong>. Esta acción no se puede deshacer.`,
    () => {
      Store.removeTask(id);
      Modal.close();
      renderTasks();
      Toast.show('Tarea eliminada', 'success');
    }
  );
}
