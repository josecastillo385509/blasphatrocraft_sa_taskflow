// ─── TASKFLOW SHARED DATA LAYER ───────────────────────────────────────────────

const TF = (() => {
  const KEYS = {
    projects: 'tf_projects',
    tasks: 'tf_tasks',
    users: 'tf_users',
    activity: 'tf_activity',
    theme: 'tf_theme',
  };

  // ── Storage ───────────────────────────────────────────────────────────────
  const load = (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  };
  const save = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // ── Generators ────────────────────────────────────────────────────────────
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = () => new Date().toISOString();
  const today = () => new Date().toISOString().split('T')[0];

  // ── Projects ──────────────────────────────────────────────────────────────
  const getProjects = () => load(KEYS.projects);
  const saveProjects = (p) => save(KEYS.projects, p);

  const createProject = (data) => {
    const projects = getProjects();
    const project = {
      id: uid(),
      name: data.name.trim(),
      description: data.description?.trim() || '',
      color: data.color || '#f0a500',
      createdAt: now(),
      updatedAt: now(),
    };
    projects.push(project);
    saveProjects(projects);
    logActivity(`Proyecto "${project.name}" creado`, 'project', project.id);
    return project;
  };

  const updateProject = (id, data) => {
    const projects = getProjects();
    const idx = projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    projects[idx] = { ...projects[idx], ...data, updatedAt: now() };
    saveProjects(projects);
    logActivity(`Proyecto "${projects[idx].name}" actualizado`, 'project', id);
    return projects[idx];
  };

  const deleteProject = (id) => {
    const project = getProjects().find(p => p.id === id);
    if (!project) return;
    saveProjects(getProjects().filter(p => p.id !== id));
    // Remove associated tasks
    saveTasks(getTasks().filter(t => t.projectId !== id));
    logActivity(`Proyecto "${project.name}" eliminado`, 'project', null);
  };

  const getProject = (id) => getProjects().find(p => p.id === id);

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const getTasks = () => load(KEYS.tasks);
  const saveTasks = (t) => save(KEYS.tasks, t);

  const createTask = (data) => {
    const tasks = getTasks();
    const task = {
      id: uid(),
      projectId: data.projectId || null,
      assigneeId: data.assigneeId || null,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      priority: data.priority || 'medium', // high | medium | low
      status: data.status || 'pending',    // pending | progress | done
      dueDate: data.dueDate || null,
      createdAt: now(),
      updatedAt: now(),
    };
    tasks.push(task);
    saveTasks(tasks);
    logActivity(`Tarea "${task.title}" creada`, 'task', task.id);
    return task;
  };

  const updateTask = (id, data) => {
    const tasks = getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const old = tasks[idx];
    tasks[idx] = { ...old, ...data, updatedAt: now() };
    saveTasks(tasks);
    if (data.status && data.status !== old.status) {
      const labels = { pending: 'Pendiente', progress: 'En Progreso', done: 'Completada' };
      logActivity(`"${tasks[idx].title}" → ${labels[data.status]}`, 'task', id);
    }
    return tasks[idx];
  };

  const deleteTask = (id) => {
    const task = getTasks().find(t => t.id === id);
    if (!task) return;
    saveTasks(getTasks().filter(t => t.id !== id));
    logActivity(`Tarea "${task.title}" eliminada`, 'task', null);
  };

  const getTask = (id) => getTasks().find(t => t.id === id);

  const getTasksByProject = (projectId) => getTasks().filter(t => t.projectId === projectId);

  const getProjectProgress = (projectId) => {
    const tasks = getTasksByProject(projectId);
    if (!tasks.length) return 0;
    const done = tasks.filter(t => t.status === 'done').length;
    return Math.round((done / tasks.length) * 100);
  };

  // ── Users ─────────────────────────────────────────────────────────────────
  const getUsers = () => load(KEYS.users);
  const saveUsers = (u) => save(KEYS.users, u);

  const createUser = (data) => {
    const users = getUsers();
    const user = {
      id: uid(),
      name: data.name.trim(),
      avatar: data.name.trim()[0].toUpperCase(),
      createdAt: now(),
    };
    users.push(user);
    saveUsers(users);
    return user;
  };

  const deleteUser = (id) => {
    saveUsers(getUsers().filter(u => u.id !== id));
    // Unassign tasks
    const tasks = getTasks().map(t => t.assigneeId === id ? { ...t, assigneeId: null } : t);
    saveTasks(tasks);
  };

  const getUser = (id) => getUsers().find(u => u.id === id);

  // ── Activity ──────────────────────────────────────────────────────────────
  const logActivity = (message, type, refId) => {
    const activity = load(KEYS.activity);
    activity.unshift({ id: uid(), message, type, refId, timestamp: now() });
    if (activity.length > 50) activity.length = 50;
    save(KEYS.activity, activity);
  };

  const getActivity = () => load(KEYS.activity);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const getStats = () => {
    const projects = getProjects();
    const tasks = getTasks();
    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      progress: tasks.filter(t => t.status === 'progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      highPriority: tasks.filter(t => t.priority === 'high').length,
      overdue: tasks.filter(t => t.dueDate && t.dueDate < today() && t.status !== 'done').length,
    };
  };

  // ── Data Management ───────────────────────────────────────────────────────
  const exportData = () => {
    return JSON.stringify({
      projects: getProjects(),
      tasks: getTasks(),
      users: getUsers(),
      activity: getActivity(),
      exportedAt: now(),
    }, null, 2);
  };

  const importData = (jsonStr) => {
    const data = JSON.parse(jsonStr);
    if (data.projects) saveProjects(data.projects);
    if (data.tasks) saveTasks(data.tasks);
    if (data.users) saveUsers(data.users);
    if (data.activity) save(KEYS.activity, data.activity);
  };

  const clearAll = () => {
    Object.values(KEYS).forEach(k => {
      if (k !== KEYS.theme) localStorage.removeItem(k);
    });
  };

  // ── Theme ─────────────────────────────────────────────────────────────────
  const getTheme = () => localStorage.getItem(KEYS.theme) || 'dark';
  const setTheme = (t) => {
    localStorage.setItem(KEYS.theme, t);
    document.documentElement.setAttribute('data-theme', t);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days}d`;
  };

  const priorityLabel = { high: 'Alta', medium: 'Media', low: 'Baja' };
  const statusLabel = { pending: 'Pendiente', progress: 'En Progreso', done: 'Completado' };
  const priorityClass = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  const statusClass = { pending: 'badge-pending', progress: 'badge-progress', done: 'badge-done' };

  const PROJECT_COLORS = ['#f0a500','#3ecf8e','#5b8af0','#f06060','#a78bfa','#f06ba0','#3ecfd0','#f0c040'];

  const isOverdue = (task) => task.dueDate && task.dueDate < today() && task.status !== 'done';

  return {
    uid, now, today,
    getProjects, createProject, updateProject, deleteProject, getProject,
    getTasks, saveTasks, createTask, updateTask, deleteTask, getTask,
    getTasksByProject, getProjectProgress,
    getUsers, createUser, deleteUser, getUser, saveUsers,
    getActivity, logActivity,
    getStats,
    exportData, importData, clearAll,
    getTheme, setTheme,
    formatDate, timeAgo,
    priorityLabel, statusLabel, priorityClass, statusClass,
    PROJECT_COLORS, isOverdue,
  };
})();

// ─── SHARED UI UTILITIES ─────────────────────────────────────────────────────

// Toast
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer') || (() => {
    const el = document.createElement('div');
    el.id = 'toastContainer';
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();
  const icons = { success: '✓', error: '✕', info: '◆' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(16px)'; t.style.transition = '0.2s'; setTimeout(() => t.remove(), 200); }, 3000);
}

// Confirm dialog
function confirmDialog(title, msg) {
  return new Promise(resolve => {
    const overlay = document.getElementById('confirmOverlay');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMsg').textContent = msg;
    overlay.classList.add('open');
    const ok = document.getElementById('confirmOk');
    const cancel = document.getElementById('confirmCancel');
    const close = () => { overlay.classList.remove('open'); ok.onclick = null; cancel.onclick = null; };
    ok.onclick = () => { close(); resolve(true); };
    cancel.onclick = () => { close(); resolve(false); };
  });
}

// Nav active link
function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
  });
}

// Theme toggle
function initTheme() {
  const theme = TF.getTheme();
  // Theme is dark-only for now, button is decorative
  const btn = document.getElementById('themeToggle');
  if (btn) btn.onclick = () => {};
}

// Shared HTML snippets
const NAV_HTML = `
<nav class="nav">
  <a href="index.html" class="nav-logo">
    <div class="nav-logo-icon">TF</div>
    Task<span>Flow</span>
  </a>
  <ul class="nav-links">
    <li><a href="index.html"><span class="nav-icon">⬡</span> Dashboard</a></li>
    <li><a href="projects.html"><span class="nav-icon">◈</span> Proyectos</a></li>
    <li><a href="tasks.html"><span class="nav-icon">◉</span> Tareas</a></li>
    <li><a href="kanban.html"><span class="nav-icon">▦</span> Kanban</a></li>
    <li><a href="calendar.html"><span class="nav-icon">◫</span> Calendario</a></li>
  </ul>
  <div class="nav-right">
    <button class="theme-toggle" id="themeToggle" title="Tema">◑</button>
  </div>
</nav>
<div class="confirm-overlay" id="confirmOverlay">
  <div class="confirm-box">
    <div class="confirm-title" id="confirmTitle">¿Confirmar acción?</div>
    <div class="confirm-msg" id="confirmMsg"></div>
    <div class="confirm-actions">
      <button class="btn btn-secondary btn-sm" id="confirmCancel">Cancelar</button>
      <button class="btn btn-danger btn-sm" id="confirmOk">Eliminar</button>
    </div>
  </div>
</div>
`;

// Render nav
document.addEventListener('DOMContentLoaded', () => {
  const navWrap = document.getElementById('navWrap');
  if (navWrap) navWrap.innerHTML = NAV_HTML;
  setActiveNav();
  initTheme();
});
