/* ============================================
   Projects
   ============================================ */

let editingProjectId = null;

document.addEventListener('DOMContentLoaded', () => {
  renderProjects();
  bindProjectForm();
  $('#btn-new-project').addEventListener('click', () => openProjectModal(null));
});

function renderProjects() {
  const container = $('#projects-container');

  if (Store.data.projects.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-mark">∅</div>
        <h3>Sin proyectos todavía</h3>
        <p>Los proyectos te ayudan a agrupar tareas relacionadas. Empieza creando el primero.</p>
        <button class="btn btn-accent" onclick="openProjectModal(null)">Crear proyecto</button>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="projects-grid">` +
    Store.data.projects.map(p => {
      const prog = Store.getProjectProgress(p.id);
      return `
        <article class="project-card">
          <div class="project-card-stripe" style="background:${p.color}"></div>
          <div class="project-card-body">
            <div class="project-card-head">
              <h3 class="project-name">${escapeHtml(p.name)}</h3>
              <div class="project-actions">
                <button class="icon-btn-sm" onclick="openProjectModal('${p.id}')" title="Editar">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="icon-btn-sm danger" onclick="deleteProject('${p.id}')" title="Eliminar">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                </button>
              </div>
            </div>
            <p class="project-desc">${p.description ? escapeHtml(p.description) : '<em style="color:var(--text-soft);">Sin descripción</em>'}</p>
            <div class="project-progress">
              <div class="progress-meta">
                <span>Avance</span>
                <span>${prog.pct}%</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${prog.pct}%; background:${p.color}"></div></div>
            </div>
            <div class="project-stats">
              <span><strong>${prog.total}</strong> ${prog.total === 1 ? 'tarea' : 'tareas'}</span>
              <span><strong>${prog.done}</strong> hechas</span>
              <span style="margin-left:auto;">
                <a href="kanban.html?project=${p.id}" style="color:var(--accent); font-weight:500;">Ver tablero →</a>
              </span>
            </div>
          </div>
        </article>
      `;
    }).join('') + `</div>`;
}

function openProjectModal(id) {
  editingProjectId = id;
  clearFieldErrors();

  if (id) {
    const p = Store.data.projects.find(x => x.id === id);
    $('#modal-project-title').innerHTML = 'Editar <em>proyecto</em>';
    $('#project-name').value = p.name;
    $('#project-desc').value = p.description || '';
    $$('#project-color .color-swatch').forEach(s =>
      s.classList.toggle('active', s.dataset.color === p.color)
    );
  } else {
    $('#modal-project-title').innerHTML = 'Nuevo <em>proyecto</em>';
    $('#project-name').value = '';
    $('#project-desc').value = '';
    $$('#project-color .color-swatch').forEach((s, i) => s.classList.toggle('active', i === 0));
  }

  Modal.open('modal-project');
  setTimeout(() => $('#project-name').focus(), 100);
}

function bindProjectForm() {
  // Color picker
  $$('#project-color .color-swatch').forEach(s => {
    s.addEventListener('click', () => {
      $$('#project-color .color-swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
    });
  });

  // Save
  $('#project-save').addEventListener('click', saveProject);

  // Submit on Enter
  $('#project-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveProject();
  });
}

function saveProject() {
  clearFieldErrors();

  const name = $('#project-name').value.trim();
  if (!name) {
    setFieldError('project-name', true);
    return;
  }

  const description = $('#project-desc').value.trim();
  const colorEl = $('#project-color .color-swatch.active');
  const color = colorEl ? colorEl.dataset.color : '#C8553D';

  if (editingProjectId) {
    Store.updateProject(editingProjectId, { name, description, color });
    Toast.show('Proyecto actualizado', 'success');
  } else {
    Store.createProject({ name, description, color });
    Toast.show('Proyecto creado', 'success');
  }

  Modal.close('modal-project');
  renderProjects();
}

function deleteProject(id) {
  const p = Store.data.projects.find(x => x.id === id);
  const taskCount = Store.data.tasks.filter(t => t.projectId === id).length;

  Confirm.show(
    '¿Eliminar proyecto?',
    `Se eliminará <strong>${escapeHtml(p.name)}</strong>${taskCount ? ` y sus <strong>${taskCount}</strong> ${taskCount === 1 ? 'tarea' : 'tareas'}` : ''}. Esta acción no se puede deshacer.`,
    () => {
      Store.removeProject(id);
      renderProjects();
      Toast.show('Proyecto eliminado', 'success');
    }
  );
}
