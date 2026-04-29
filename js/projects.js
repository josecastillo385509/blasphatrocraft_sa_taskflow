/* ============================================================
   Projects logic
   ============================================================ */

const PROJECT_COLORS = [
  '#d4a857', '#d96b5e', '#7ba87b', '#6b9cb8',
  '#b87bb8', '#e0a44a', '#9c8264', '#5e7d8e'
];

let selectedColor = PROJECT_COLORS[0];

document.addEventListener('DOMContentLoaded', () => {
  initPage('projects');
  renderColorPicker();
  bindEvents();
  render();
});

function bindEvents() {
  document.getElementById('btn-new-project').addEventListener('click', () => openProjectModal());
  document.getElementById('project-form').addEventListener('submit', handleSubmit);
}

function renderColorPicker() {
  const cp = document.getElementById('color-picker');
  cp.innerHTML = PROJECT_COLORS.map(c => `
    <div class="color-swatch ${c === selectedColor ? 'selected' : ''}" 
         data-color="${c}" 
         style="background:${c}"></div>
  `).join('');
  cp.querySelectorAll('.color-swatch').forEach(s => {
    s.addEventListener('click', () => {
      selectedColor = s.dataset.color;
      cp.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('selected'));
      s.classList.add('selected');
    });
  });
}

function openProjectModal(project = null) {
  const isEdit = !!project;
  document.getElementById('project-modal-title').textContent = isEdit ? 'Editar proyecto' : 'Nuevo proyecto';
  document.getElementById('project-submit').textContent = isEdit ? 'Actualizar' : 'Crear';
  document.getElementById('project-id').value = isEdit ? project.id : '';
  document.getElementById('project-name').value = isEdit ? project.name : '';
  document.getElementById('project-description').value = isEdit ? (project.description || '') : '';
  selectedColor = isEdit ? project.color : PROJECT_COLORS[0];
  renderColorPicker();
  openModal('project-modal');
  setTimeout(() => document.getElementById('project-name').focus(), 50);
}

function handleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('project-id').value;
  const name = document.getElementById('project-name').value;
  const description = document.getElementById('project-description').value;

  try {
    if (id) {
      ProjectStore.update(id, { name, description, color: selectedColor });
      showToast('Proyecto actualizado', 'success');
    } else {
      ProjectStore.create({ name, description, color: selectedColor });
      showToast('Proyecto creado', 'success');
    }
    closeModal('project-modal');
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteProject(id) {
  const project = ProjectStore.getById(id);
  if (!project) return;
  const taskCount = TaskStore.getByProject(id).length;
  const ok = await confirmDialog({
    title: 'Eliminar proyecto',
    message: `¿Estás seguro de eliminar <strong>${escapeHtml(project.name)}</strong>?${taskCount > 0 ? `<br/>Esto también eliminará <strong>${taskCount}</strong> tarea${taskCount === 1 ? '' : 's'} asociada${taskCount === 1 ? '' : 's'}.` : ''}`,
    confirmText: 'Eliminar'
  });
  if (ok) {
    ProjectStore.remove(id);
    showToast('Proyecto eliminado', 'success');
    render();
  }
}

function render() {
  const projects = ProjectStore.getAll();
  const tasks = TaskStore.getAll();
  const grid = document.getElementById('projects-grid');

  if (!projects.length) {
    grid.innerHTML = `
      <div class="empty-state projects-empty">
        <div class="icon">∅</div>
        <h3>Aún no hay proyectos</h3>
        <p>Crea tu primer proyecto para empezar a organizar tus tareas. Cada proyecto agrupa su propio conjunto de tareas y progreso.</p>
        <button class="btn btn-primary" style="margin-top: 20px;" onclick="openProjectModal()">Crear primer proyecto</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.id);
    const total = pTasks.length;
    const done = pTasks.filter(t => t.status === 'terminado').length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    return `
      <article class="project-card" style="--card-color: ${escapeHtml(p.color)}" data-id="${p.id}">
        <div class="pc-head">
          <h3 class="pc-title">${escapeHtml(p.name)}</h3>
          <div class="pc-actions">
            <button class="pc-action-btn" data-action="edit" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="pc-action-btn danger" data-action="delete" title="Eliminar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        </div>
        ${p.description ? `<p class="pc-desc">${escapeHtml(p.description)}</p>` : '<p class="pc-desc" style="font-style:italic; opacity:0.6;">Sin descripción</p>'}
        <div class="pc-footer">
          <div class="pc-stats">
            <span><strong>${total}</strong> tarea${total === 1 ? '' : 's'}</span>
            <span><strong>${done}</strong> hecha${done === 1 ? '' : 's'}</span>
          </div>
          <div class="pc-progress">
            <div class="pc-progress-bar"><div class="pc-progress-fill" style="width:${pct}%"></div></div>
            <span class="pc-progress-pct">${pct}%</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Eventos
  grid.querySelectorAll('.project-card').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
      e.stopPropagation();
      openProjectModal(ProjectStore.getById(id));
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteProject(id);
    });
    card.addEventListener('click', () => {
      // Ir a tareas filtradas por este proyecto
      window.location.href = `tasks.html?project=${id}`;
    });
  });
}
