/* ============================================================
   Kanban — Drag & Drop entre columnas
   ============================================================ */

let projectFilter = '';

document.addEventListener('DOMContentLoaded', () => {
  initPage('kanban');
  populateProjectFilter();
  document.getElementById('kanban-project-filter').addEventListener('change', e => {
    projectFilter = e.target.value;
    render();
  });
  render();
});

function populateProjectFilter() {
  const projects = ProjectStore.getAll();
  const sel = document.getElementById('kanban-project-filter');
  sel.innerHTML = '<option value="">Todos los proyectos</option>' +
    projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
}

function render() {
  const board = document.getElementById('kanban-board');
  const projects = ProjectStore.getAll();

  if (!projects.length) {
    board.innerHTML = `
      <div class="empty-state kanban-empty">
        <div class="icon">∅</div>
        <h3>Aún no hay proyectos</h3>
        <p>Crea un proyecto y luego añade tareas para visualizarlas en el tablero.</p>
        <a href="projects.html" class="btn btn-primary" style="margin-top: 20px;">Crear proyecto →</a>
      </div>
    `;
    return;
  }

  let tasks = TaskStore.getAll();
  if (projectFilter) tasks = tasks.filter(t => t.projectId === projectFilter);

  const columns = [
    { key: 'pendiente', label: 'Pendiente' },
    { key: 'en_progreso', label: 'En progreso' },
    { key: 'terminado', label: 'Terminado' }
  ];

  board.innerHTML = columns.map(col => {
    const colTasks = tasks.filter(t => t.status === col.key);
    return `
      <div class="kanban-column kanban-col-${col.key}" data-status="${col.key}">
        <div class="kanban-col-header">
          <div class="kanban-col-title">${col.label}</div>
          <span class="kanban-col-count">${colTasks.length}</span>
        </div>
        <div class="kanban-cards" data-drop-zone="${col.key}">
          ${colTasks.length
            ? colTasks.map(t => kanbanCard(t, projects)).join('')
            : '<div class="kanban-empty-col">Suelta aquí</div>'
          }
        </div>
      </div>
    `;
  }).join('');

  bindDragAndDrop();
}

function kanbanCard(t, projects) {
  const project = projects.find(p => p.id === t.projectId);
  const projectColor = project?.color || 'var(--accent)';

  let dueText = '';
  let dueClass = '';
  if (t.dueDate) {
    const d = new Date(t.dueDate);
    const today = new Date(); today.setHours(0,0,0,0);
    if (d < today && t.status !== 'terminado') dueClass = 'overdue';
    dueText = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  return `
    <article class="kanban-card" 
             draggable="true" 
             data-id="${t.id}" 
             style="--card-project-color: ${escapeHtml(projectColor)}">
      <div class="kc-title">${escapeHtml(t.title)}</div>
      ${t.description ? `<div class="kc-desc">${escapeHtml(t.description)}</div>` : ''}
      <div class="kc-footer">
        <div class="kc-meta">
          ${project ? `<span class="kc-project"><span class="dot" style="background:${escapeHtml(project.color)}"></span>${escapeHtml(project.name)}</span>` : ''}
          ${dueText ? `<span class="kc-due ${dueClass}">${dueClass === 'overdue' ? '⚠ ' : '◷ '}${dueText}</span>` : ''}
        </div>
        <span class="badge badge-priority-${t.priority}">${priorityLabel(t.priority)}</span>
      </div>
    </article>
  `;
}

function bindDragAndDrop() {
  let draggedId = null;

  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedId = card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.id);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
    });
  });

  document.querySelectorAll('.kanban-column').forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', (e) => {
      // Solo quitar si realmente salimos
      if (e.target === col) col.classList.remove('drag-over');
    });
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain') || draggedId;
      const newStatus = col.dataset.status;
      if (!id || !newStatus) return;
      const task = TaskStore.getById(id);
      if (task && task.status !== newStatus) {
        try {
          TaskStore.changeStatus(id, newStatus);
          showToast(`Tarea movida a "${statusLabel(newStatus)}"`, 'success', 2000);
          render();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  });
}
