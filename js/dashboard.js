/* ============================================================
   Dashboard
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initPage('dashboard');
  render();
});

function render() {
  const projects = ProjectStore.getAll();
  const tasks = TaskStore.getAll();

  // KPIs
  const pending = tasks.filter(t => t.status === 'pendiente').length;
  const inProg = tasks.filter(t => t.status === 'en_progreso').length;
  const done = tasks.filter(t => t.status === 'terminado').length;

  document.getElementById('kpi-projects').textContent = projects.length;
  document.getElementById('kpi-pending').textContent = pending;
  document.getElementById('kpi-progress').textContent = inProg;
  document.getElementById('kpi-done').textContent = done;

  // Overview bar
  renderOverview(tasks, pending, inProg, done);

  // Actividad
  renderActivity();

  // Próximas fechas
  renderUpcoming(tasks, projects);

  // Top proyectos
  renderTopProjects(projects, tasks);
}

function renderOverview(tasks, pending, inProg, done) {
  const total = tasks.length;
  const bar = document.getElementById('overview-bar');
  const legend = document.getElementById('overview-legend');

  if (total === 0) {
    bar.innerHTML = '<div class="empty-bar">Aún no hay tareas. Crea tu primera tarea para ver el avance.</div>';
    legend.innerHTML = '';
    return;
  }

  const segs = [
    { key: 'pendiente', label: 'Pendiente', count: pending },
    { key: 'en_progreso', label: 'En progreso', count: inProg },
    { key: 'terminado', label: 'Terminado', count: done }
  ];

  bar.innerHTML = segs.filter(s => s.count > 0).map(s => {
    const pct = (s.count / total) * 100;
    return `<div class="seg seg-${s.key}" style="width:${pct}%" title="${s.label}: ${s.count}">${pct >= 8 ? Math.round(pct) + '%' : ''}</div>`;
  }).join('');

  legend.innerHTML = segs.map(s => `
    <span class="legend-item">
      <span class="legend-dot" style="background: var(--status-${s.key})"></span>
      <strong>${s.count}</strong> ${s.label}
    </span>
  `).join('');
}

function renderActivity() {
  const list = ActivityStore.getAll().slice(0, 8);
  const ul = document.getElementById('activity-list');
  if (!list.length) {
    ul.innerHTML = '<li style="color: var(--text-muted); font-style: italic; border: none; padding: 16px 0;">Sin actividad reciente.</li>';
    return;
  }
  ul.innerHTML = list.map(a => `
    <li>
      <span class="activity-dot"></span>
      <div style="flex:1; min-width:0;">
        <div class="activity-text">${escapeHtml(a.message)}</div>
        <div class="activity-time">${formatRelative(a.timestamp)}</div>
      </div>
    </li>
  `).join('');
}

function renderUpcoming(tasks, projects) {
  const ul = document.getElementById('upcoming-list');
  const upcoming = tasks
    .filter(t => t.dueDate && t.status !== 'terminado')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  if (!upcoming.length) {
    ul.innerHTML = '<li style="color: var(--text-muted); font-style: italic; border: none; padding: 16px 0;">No hay fechas próximas.</li>';
    return;
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  ul.innerHTML = upcoming.map(t => {
    const d = new Date(t.dueDate);
    const project = projects.find(p => p.id === t.projectId);
    const overdue = d < today;
    return `
      <li class="${overdue ? 'upcoming-overdue' : ''}">
        <div class="upcoming-date">
          <div class="upcoming-day">${d.getDate()}</div>
          <div class="upcoming-month">${d.toLocaleDateString('es-ES', { month: 'short' })}</div>
        </div>
        <div class="upcoming-info">
          <div class="upcoming-title">${escapeHtml(t.title)}</div>
          <div class="upcoming-meta">${project ? escapeHtml(project.name) : 'Sin proyecto'} · ${overdue ? 'Atrasada' : statusLabel(t.status)}</div>
        </div>
        <span class="badge badge-priority-${t.priority}">${priorityLabel(t.priority)}</span>
      </li>
    `;
  }).join('');
}

function renderTopProjects(projects, tasks) {
  const container = document.getElementById('top-projects-list');
  if (!projects.length) {
    container.innerHTML = `
      <div style="padding: 24px 0; text-align: center; color: var(--text-muted); font-style: italic;">
        Aún no tienes proyectos.<br/>
        <a href="projects.html" style="margin-top: 10px; display: inline-block;">Crear el primero →</a>
      </div>
    `;
    return;
  }

  const enriched = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.id);
    const total = pTasks.length;
    const done = pTasks.filter(t => t.status === 'terminado').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...p, total, done, pct };
  }).sort((a, b) => b.pct - a.pct).slice(0, 5);

  container.innerHTML = enriched.map(p => `
    <div class="top-project">
      <div class="tp-head">
        <div class="tp-name">
          <span class="tp-color" style="background:${escapeHtml(p.color)}"></span>
          <span>${escapeHtml(p.name)}</span>
        </div>
        <div class="tp-pct">${p.done}/${p.total} · ${p.pct}%</div>
      </div>
      <div class="tp-bar"><div class="tp-bar-fill" style="width:${p.pct}%; background:${escapeHtml(p.color)}"></div></div>
    </div>
  `).join('');
}
