/* ============================================
   Dashboard
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderActivity();
  renderToday();
});

function renderStats() {
  const total = Store.data.projects.length;
  const pending = Store.data.tasks.filter(t => t.status === 'pendiente').length;
  const inProgress = Store.data.tasks.filter(t => t.status === 'en-progreso').length;
  const done = Store.data.tasks.filter(t => t.status === 'terminado').length;
  const totalTasks = pending + inProgress + done;

  $('#stat-grid').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Proyectos</div>
      <div class="stat-value">${total}</div>
      <div class="stat-trend">${total === 0 ? 'crea uno para empezar' : (total === 1 ? 'proyecto activo' : 'proyectos activos')}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">En progreso</div>
      <div class="stat-value">${inProgress}</div>
      <div class="stat-trend">${inProgress === 1 ? 'tarea en marcha' : 'tareas en marcha'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pendientes</div>
      <div class="stat-value">${pending}</div>
      <div class="stat-trend">por iniciar</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Completadas</div>
      <div class="stat-value">${done}</div>
      <div class="stat-trend">${totalTasks === 0 ? '—' : Math.round(done * 100 / totalTasks) + '% del total'}</div>
    </div>
  `;
}

function renderActivity() {
  const list = $('#activity-list');
  const items = Store.data.activity.slice(0, 10);

  if (items.length === 0) {
    list.innerHTML = '<li style="padding:20px 0; color:var(--text-soft); font-size:13px;">Aún no hay actividad. Empieza creando un proyecto o tarea.</li>';
    return;
  }

  list.innerHTML = items.map(a => `
    <li class="activity-item">
      <span class="activity-time">${escapeHtml(formatRelative(a.timestamp))}</span>
      <span class="activity-text">${a.description}</span>
    </li>
  `).join('');
}

function renderToday() {
  const today = todayISO();
  const todayTasks = Store.data.tasks.filter(t => t.dueDate === today && t.status !== 'terminado');
  const overdue = Store.data.tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'terminado');
  const box = $('#today-tasks');

  if (todayTasks.length === 0 && overdue.length === 0) {
    box.innerHTML = `<div style="padding:20px 0; color:var(--text-soft); font-size:13px;">Sin tareas para hoy. Disfruta el día.</div>`;
    return;
  }

  let html = '';

  if (overdue.length) {
    html += `<div style="font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--danger); margin-bottom:8px;">Atrasadas (${overdue.length})</div>`;
    html += overdue.slice(0, 5).map(t => taskMini(t)).join('');
  }

  if (todayTasks.length) {
    html += `<div style="font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-muted); margin:${overdue.length ? '14px' : '0'} 0 8px;">Hoy (${todayTasks.length})</div>`;
    html += todayTasks.map(t => taskMini(t)).join('');
  }

  box.innerHTML = html;
}

function taskMini(t) {
  const project = Store.data.projects.find(p => p.id === t.projectId);
  return `
    <a href="tasks.html?id=${t.id}" class="task-mini" style="display:block;">
      <div class="task-mini-title">${escapeHtml(t.title)}</div>
      <div class="task-mini-meta">
        <span class="pill pill-${t.priority}">${PRIORITY_LABELS[t.priority]}</span>
        ${project ? `<span style="font-family:var(--font-mono);">· ${escapeHtml(project.name)}</span>` : ''}
      </div>
    </a>
  `;
}
