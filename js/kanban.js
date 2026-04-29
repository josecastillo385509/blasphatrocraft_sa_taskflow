/* ============================================
   Kanban
   ============================================ */

const kFilters = { project: 'all', priority: 'all', search: '' };

document.addEventListener('DOMContentLoaded', () => {
  // Pre-filtro desde querystring (viniendo desde "Ver tablero" en proyectos)
  const params = new URLSearchParams(location.search);
  if (params.get('project')) kFilters.project = params.get('project');

  bindFilters();
  renderKanban();
});

function bindFilters() {
  const projSelect = $('#kanban-project-filter');
  projSelect.innerHTML = '<option value="all">Todos los proyectos</option>' +
    Store.data.projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
  projSelect.value = kFilters.project;

  projSelect.addEventListener('change', e => { kFilters.project = e.target.value; renderKanban(); });
  $('#kanban-priority-filter').addEventListener('change', e => { kFilters.priority = e.target.value; renderKanban(); });
  $('#kanban-search').addEventListener('input', e => { kFilters.search = e.target.value; renderKanban(); });
}

function renderKanban() {
  const container = $('#kanban-container');

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
    if (kFilters.project !== 'all' && t.projectId !== kFilters.project) return false;
    if (kFilters.priority !== 'all' && t.priority !== kFilters.priority) return false;
    const q = kFilters.search.toLowerCase();
    if (q && !(t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))) return false;
    return true;
  });

  container.innerHTML = `
    <div class="kanban">
      ${['pendiente', 'en-progreso', 'terminado'].map(status => {
        const tasks = filtered.filter(t => t.status === status);
        return `
          <div class="kanban-col" data-status="${status}">
            <div class="kanban-col-head">
              <div class="kanban-col-title">${STATUS_LABELS[status]}</div>
              <div class="kanban-count">${tasks.length}</div>
            </div>
            <div class="kanban-list" data-list="${status}">
              ${tasks.length === 0
                ? `<div style="padding:24px 8px; text-align:center; color:var(--text-soft); font-size:12px;">— vacío —</div>`
                : tasks.map(t => kanbanCard(t)).join('')
              }
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  bindDragAndDrop();
}

function kanbanCard(t) {
  const project = Store.data.projects.find(p => p.id === t.projectId);
  const assignee = Store.data.users.find(u => u.id === t.assignedTo);
  const isOverdue = t.dueDate && t.dueDate < todayISO() && t.status !== 'terminado';
  return `
    <div class="kanban-card" draggable="true" data-task="${t.id}" onclick="if(!this._fromDrag) window.location.href='tasks.html?id=${t.id}'">
      <div class="kanban-card-title">${escapeHtml(t.title)}</div>
      ${project ? `<div class="kanban-card-project" style="color:${project.color}">● ${escapeHtml(project.name)}</div>` : ''}
      <div style="display:flex; gap:4px; margin-top:6px;">
        <span class="pill pill-${t.priority}">${PRIORITY_LABELS[t.priority]}</span>
      </div>
      <div class="kanban-card-meta">
        <span class="kanban-card-due ${isOverdue ? 'overdue' : ''}">
          ${t.dueDate ? `<svg class="icon" style="width:11px; height:11px;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg> ${escapeHtml(formatDate(t.dueDate))}` : ''}
        </span>
        ${assignee ? `<span class="kanban-card-assignee" title="${escapeHtml(assignee.name)}">${escapeHtml(assignee.name.charAt(0).toUpperCase())}</span>` : ''}
      </div>
    </div>
  `;
}

function bindDragAndDrop() {
  $$('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      card._fromDrag = true;
      setTimeout(() => { card._fromDrag = false; }, 100);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.task);
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  $$('.kanban-col').forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', (e) => {
      if (!col.contains(e.relatedTarget)) col.classList.remove('drag-over');
    });
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const status = col.dataset.status;
      Store.setTaskStatus(taskId, status);
      renderKanban();
    });
  });
}
