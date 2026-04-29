/* ============================================
   Stats — Charts
   ============================================ */

let charts = { status: null, priority: null };

document.addEventListener('DOMContentLoaded', () => {
  renderCharts();
  renderProjectProgress();
  document.addEventListener('theme-change', () => renderCharts());
});

function renderCharts() {
  const statusCounts = ['pendiente', 'en-progreso', 'terminado'].map(s =>
    Store.data.tasks.filter(t => t.status === s).length
  );
  const priorityCounts = ['alta', 'media', 'baja'].map(p =>
    Store.data.tasks.filter(t => t.priority === p).length
  );

  const isDark = document.documentElement.dataset.theme === 'dark';
  const textColor = isDark ? '#A8A39A' : '#6B6B6B';
  const gridColor = isDark ? '#353844' : '#E0DAD0';

  Chart.defaults.font.family = "'DM Sans', sans-serif";
  Chart.defaults.color = textColor;

  if (charts.status) charts.status.destroy();
  charts.status = new Chart($('#chart-status'), {
    type: 'bar',
    data: {
      labels: ['Pendiente', 'En progreso', 'Terminado'],
      datasets: [{
        data: statusCounts,
        backgroundColor: ['#9A938A', '#4A7BA8', '#5C8D5A'],
        borderRadius: 6,
        barThickness: 50
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { color: gridColor } },
        x: { grid: { display: false } }
      }
    }
  });

  if (charts.priority) charts.priority.destroy();
  charts.priority = new Chart($('#chart-priority'), {
    type: 'doughnut',
    data: {
      labels: ['Alta', 'Media', 'Baja'],
      datasets: [{
        data: priorityCounts,
        backgroundColor: ['#B8473D', '#D4A24A', '#5C8D5A'],
        borderColor: isDark ? '#22242C' : '#FFFFFF',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, pointStyle: 'circle' } } },
      cutout: '62%'
    }
  });
}

function renderProjectProgress() {
  const list = $('#proj-progress-list');

  if (Store.data.projects.length === 0) {
    list.innerHTML = `<div style="padding:20px 0; color:var(--text-soft); font-size:13px;">Sin proyectos para mostrar.</div>`;
    return;
  }

  list.innerHTML = Store.data.projects.map(p => {
    const prog = Store.getProjectProgress(p.id);
    return `
      <div class="proj-progress-item">
        <div class="proj-progress-head">
          <span class="proj-progress-name">${escapeHtml(p.name)}</span>
          <span class="proj-progress-pct">${prog.pct}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${prog.pct}%; background:${p.color};"></div></div>
        <div class="proj-progress-meta">${prog.done} de ${prog.total} ${prog.total === 1 ? 'tarea' : 'tareas'} ${prog.total === 0 ? '· sin tareas aún' : 'completadas'}</div>
      </div>
    `;
  }).join('');
}
