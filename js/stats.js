/* ============================================================
   Stats — Charts SVG nativos
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initPage('stats');
  render();
});

function render() {
  const projects = ProjectStore.getAll();
  const tasks = TaskStore.getAll();

  renderSummary(projects, tasks);
  renderStatusDonut(tasks);
  renderPriorityDonut(tasks);
  renderProjectProgress(projects, tasks);
}

function renderSummary(projects, tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'terminado').length;
  const overdue = tasks.filter(t =>
    t.dueDate && t.status !== 'terminado' && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0))
  ).length;
  const completion = total > 0 ? Math.round((done / total) * 100) : 0;
  const avgPerProject = projects.length > 0 ? (total / projects.length).toFixed(1) : '0';

  document.getElementById('stats-summary').innerHTML = `
    <div class="stat-block">
      <div class="stat-label">Total tareas</div>
      <div class="stat-value">${total}</div>
      <div class="stat-extra">${projects.length} proyecto${projects.length === 1 ? '' : 's'}</div>
    </div>
    <div class="stat-block">
      <div class="stat-label">Completadas</div>
      <div class="stat-value" style="color: var(--success);">${done}</div>
      <div class="stat-extra">${completion}% del total</div>
    </div>
    <div class="stat-block">
      <div class="stat-label">Atrasadas</div>
      <div class="stat-value" style="color: var(--danger);">${overdue}</div>
      <div class="stat-extra">requieren atención</div>
    </div>
    <div class="stat-block">
      <div class="stat-label">Promedio</div>
      <div class="stat-value">${avgPerProject}</div>
      <div class="stat-extra">tareas por proyecto</div>
    </div>
  `;
}

/* ---------- Donut chart genérico ---------- */
function buildDonut(svgEl, legendEl, data, centerLabel) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    svgEl.innerHTML = `<circle cx="100" cy="100" r="70" class="donut-track"/>
      <text x="100" y="100" class="donut-center" style="font-size: 14px; fill: var(--text-muted); font-style: italic;">Sin datos</text>`;
    legendEl.innerHTML = '<div class="donut-empty">No hay tareas registradas</div>';
    return;
  }

  const cx = 100, cy = 100, r = 70;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  const segs = data.filter(d => d.value > 0).map(d => {
    const fraction = d.value / total;
    const length = fraction * circumference;
    const offset = circumference * 0.25 - cumulative;
    cumulative += length;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" 
                    class="donut-segment" 
                    stroke="${d.color}" 
                    stroke-dasharray="${length} ${circumference - length}" 
                    stroke-dashoffset="${offset}"
                    transform="rotate(-90 ${cx} ${cy})"
                    stroke-linecap="butt"/>`;
  }).join('');

  svgEl.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" class="donut-track"/>
    ${segs}
    <text x="${cx}" y="${cy - 6}" class="donut-center">${total}</text>
    <text x="${cx}" y="${cy + 18}" class="donut-center-sub">${centerLabel}</text>
  `;

  legendEl.innerHTML = data.map(d => `
    <div class="dl-item">
      <span class="dl-color" style="background:${d.color}"></span>
      <span class="dl-label">${d.label}</span>
      <span class="dl-value">${d.value}</span>
    </div>
  `).join('');
}

function renderStatusDonut(tasks) {
  const data = [
    { label: 'Pendientes', value: tasks.filter(t => t.status === 'pendiente').length, color: '#7a7268' },
    { label: 'En progreso', value: tasks.filter(t => t.status === 'en_progreso').length, color: '#6b9cb8' },
    { label: 'Terminadas', value: tasks.filter(t => t.status === 'terminado').length, color: '#7ba87b' }
  ];
  buildDonut(
    document.getElementById('donut-status'),
    document.getElementById('donut-status-legend'),
    data,
    'TAREAS'
  );
}

function renderPriorityDonut(tasks) {
  const data = [
    { label: 'Alta', value: tasks.filter(t => t.priority === 'alta').length, color: '#d96b5e' },
    { label: 'Media', value: tasks.filter(t => t.priority === 'media').length, color: '#e0a44a' },
    { label: 'Baja', value: tasks.filter(t => t.priority === 'baja').length, color: '#7ba87b' }
  ];
  buildDonut(
    document.getElementById('donut-priority'),
    document.getElementById('donut-priority-legend'),
    data,
    'TAREAS'
  );
}

function renderProjectProgress(projects, tasks) {
  const container = document.getElementById('project-progress-chart');

  if (!projects.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px 0;">
        <p>Sin proyectos registrados.</p>
      </div>
    `;
    return;
  }

  const enriched = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.id);
    const total = pTasks.length;
    const done = pTasks.filter(t => t.status === 'terminado').length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { ...p, total, done, pct };
  }).sort((a, b) => b.pct - a.pct);

  container.innerHTML = enriched.map(p => `
    <div class="progress-row">
      <div class="pr-head">
        <div class="pr-name">
          <span class="pr-color" style="background:${escapeHtml(p.color)}"></span>
          <span>${escapeHtml(p.name)}</span>
        </div>
        <div class="pr-stats">${p.done}/${p.total} · ${p.pct}%</div>
      </div>
      <div class="pr-bar">
        <div class="pr-bar-fill" style="width:${p.pct}%; --bar-color: ${escapeHtml(p.color)};"></div>
      </div>
    </div>
  `).join('');
}
