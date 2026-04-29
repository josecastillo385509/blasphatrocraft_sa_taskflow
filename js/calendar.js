/* ============================================================
   Calendar
   ============================================================ */

let currentDate = new Date();
let selectedDay = null;

document.addEventListener('DOMContentLoaded', () => {
  initPage('calendar');
  document.getElementById('cal-prev').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    render();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    render();
  });
  document.getElementById('cal-today').addEventListener('click', () => {
    currentDate = new Date();
    selectedDay = null;
    document.getElementById('cal-day-details').style.display = 'none';
    render();
  });
  render();
});

function render() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById('cal-current').textContent =
    currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Día 1 del mes
  const first = new Date(year, month, 1);
  // Lunes-base: si es domingo (0), retroceder 6; si es lunes (1), 0; etc.
  const firstWeekday = (first.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - firstWeekday);

  const tasks = TaskStore.getAll();
  const projects = ProjectStore.getAll();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Construir 6 semanas (42 días)
  const grid = document.getElementById('cal-grid');
  let html = '';

  for (let i = 0; i < 42; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    const isOutside = dayDate.getMonth() !== month;
    const isToday = dayDate.getTime() === today.getTime();
    const dayKey = dayDate.toISOString().slice(0, 10);

    const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.slice(0, 10) === dayKey);
    const hasOverdue = dayTasks.some(t => t.status !== 'terminado' && new Date(t.dueDate) < today);

    let pillsHtml = '';
    const visiblePills = dayTasks.slice(0, 3);
    visiblePills.forEach(t => {
      const project = projects.find(p => p.id === t.projectId);
      const color = project?.color || 'var(--accent)';
      const isDone = t.status === 'terminado';
      pillsHtml += `<div class="cal-task-pill ${isDone ? 'completed' : ''}" style="--task-color: ${escapeHtml(color)}; background: ${escapeHtml(color)};" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</div>`;
    });
    if (dayTasks.length > 3) {
      pillsHtml += `<div class="cal-task-more">+${dayTasks.length - 3} más</div>`;
    }

    html += `
      <div class="cal-day ${isOutside ? 'outside' : ''} ${isToday ? 'today' : ''} ${hasOverdue ? 'has-overdue' : ''}"
           data-date="${dayKey}">
        <div class="cal-day-num">${dayDate.getDate()}</div>
        <div class="cal-day-tasks">${pillsHtml}</div>
      </div>
    `;
  }

  grid.innerHTML = html;

  // Click en día → mostrar detalle
  grid.querySelectorAll('.cal-day').forEach(d => {
    d.addEventListener('click', () => showDayDetail(d.dataset.date, projects, tasks));
  });
}

function showDayDetail(dateKey, projects, tasks) {
  const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.slice(0, 10) === dateKey);
  const wrap = document.getElementById('cal-day-details');
  const title = document.getElementById('cal-day-title');
  const list = document.getElementById('cal-day-tasks');

  const d = new Date(dateKey + 'T00:00:00');
  title.textContent = d.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  if (!dayTasks.length) {
    list.innerHTML = '<p style="padding: 16px 0; color: var(--text-muted); font-style: italic;">Sin tareas para este día.</p>';
  } else {
    list.innerHTML = dayTasks.map(t => {
      const project = projects.find(p => p.id === t.projectId);
      return `
        <div class="cal-detail-task">
          <span class="badge badge-status-${t.status}">${statusLabel(t.status)}</span>
          <div class="cal-detail-info">
            <div class="cal-detail-title">${escapeHtml(t.title)}</div>
            <div class="cal-detail-meta">${project ? escapeHtml(project.name) : 'Sin proyecto'}</div>
          </div>
          <span class="badge badge-priority-${t.priority}">${priorityLabel(t.priority)}</span>
        </div>
      `;
    }).join('');
  }

  wrap.style.display = 'block';
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
