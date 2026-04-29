/* ============================================
   Calendar
   ============================================ */

const calState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth()
};

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

document.addEventListener('DOMContentLoaded', () => {
  bindCalendarNav();
  renderCalendar();
});

function bindCalendarNav() {
  $('#cal-prev').addEventListener('click', () => {
    calState.month--;
    if (calState.month < 0) { calState.month = 11; calState.year--; }
    renderCalendar();
  });
  $('#cal-next').addEventListener('click', () => {
    calState.month++;
    if (calState.month > 11) { calState.month = 0; calState.year++; }
    renderCalendar();
  });
  $('#cal-today').addEventListener('click', () => {
    const now = new Date();
    calState.year = now.getFullYear();
    calState.month = now.getMonth();
    renderCalendar();
  });
}

function renderCalendar() {
  const { year, month } = calState;
  $('#cal-month-label').innerHTML = `<em>${MONTH_NAMES[month]}</em> ${year}`;

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  // Lunes como primer día de la semana
  let startDay = first.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const grid = $('#cal-grid');
  grid.innerHTML = '';

  const today = todayISO();

  // Indexar tareas por fecha
  const byDate = {};
  Store.data.tasks.forEach(t => {
    if (!t.dueDate) return;
    (byDate[t.dueDate] = byDate[t.dueDate] || []).push(t);
  });

  // Días del mes anterior (para llenar la primera fila)
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    grid.appendChild(buildCell(prevLast - i, year, month - 1, true, byDate, today));
  }

  // Mes actual
  for (let d = 1; d <= last.getDate(); d++) {
    grid.appendChild(buildCell(d, year, month, false, byDate, today));
  }

  // Mes siguiente (completar a 35 o 42 celdas)
  const totalCells = startDay + last.getDate();
  const cellsToFill = (totalCells <= 35) ? 35 - totalCells : 42 - totalCells;
  for (let d = 1; d <= cellsToFill; d++) {
    grid.appendChild(buildCell(d, year, month + 1, true, byDate, today));
  }
}

function buildCell(day, year, month, otherMonth, byDate, today) {
  const date = new Date(year, month, day);
  const iso = date.toISOString().slice(0, 10);

  const cell = document.createElement('div');
  cell.className = 'cal-day' + (otherMonth ? ' other-month' : '') + (iso === today ? ' today' : '');

  let html = `<span class="cal-day-num">${day}</span>`;
  const tasks = byDate[iso] || [];
  tasks.slice(0, 3).forEach(t => {
    html += `<div class="cal-task ${t.status}" onclick="window.location.href='tasks.html?id=${t.id}'" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</div>`;
  });

  if (tasks.length > 3) {
    html += `<div style="font-size:10px; color:var(--text-soft); padding:0 4px; font-family:var(--font-mono);">+${tasks.length - 3} más</div>`;
  }

  cell.innerHTML = html;
  return cell;
}
