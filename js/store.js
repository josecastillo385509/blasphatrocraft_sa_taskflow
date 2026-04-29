/* ============================================
   TaskFlow — Store (capa de datos)
   Persistencia en localStorage como un único
   objeto JSON bajo la clave 'taskflow_data_v1'.
   ============================================ */

const Store = {
  KEY: 'taskflow_data_v1',
  data: null,

  // ---------- Carga / persistencia ----------
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        this.data = this._normalize(JSON.parse(raw));
      } else {
        this.data = this._defaults();
        this.save();
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      this.data = this._defaults();
    }
    return this.data;
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (err) {
      console.error('Error guardando datos:', err);
    }
  },

  _saveTimer: null,
  scheduleSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.save(), 200);
  },

  _defaults() {
    return {
      version: '1.0',
      projects: [],
      tasks: [],
      users: [],
      activity: [],
      settings: { theme: 'light' }
    };
  },

  _normalize(d) {
    return {
      version: d.version || '1.0',
      projects: Array.isArray(d.projects) ? d.projects : [],
      tasks: Array.isArray(d.tasks) ? d.tasks : [],
      users: Array.isArray(d.users) ? d.users : [],
      activity: Array.isArray(d.activity) ? d.activity : [],
      settings: d.settings && typeof d.settings === 'object' ? d.settings : { theme: 'light' }
    };
  },

  // ---------- Utilidades ----------
  uid() {
    return 'id_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
  },

  // ---------- Actividad ----------
  log(type, description) {
    this.data.activity.unshift({
      id: this.uid(),
      type,
      description,
      timestamp: new Date().toISOString()
    });
    if (this.data.activity.length > 100) this.data.activity.length = 100;
  },

  // ---------- Proyectos ----------
  createProject({ name, description, color }) {
    const project = {
      id: this.uid(),
      name: name.trim(),
      description: (description || '').trim(),
      color: color || '#C8553D',
      createdAt: new Date().toISOString()
    };
    this.data.projects.unshift(project);
    this.log('project_created', `Creó el proyecto <strong>${escapeHtml(project.name)}</strong>`);
    this.scheduleSave();
    return project;
  },

  updateProject(id, { name, description, color }) {
    const p = this.data.projects.find(x => x.id === id);
    if (!p) return null;
    p.name = name.trim();
    p.description = (description || '').trim();
    p.color = color || p.color;
    this.log('project_updated', `Editó el proyecto <strong>${escapeHtml(p.name)}</strong>`);
    this.scheduleSave();
    return p;
  },

  removeProject(id) {
    const p = this.data.projects.find(x => x.id === id);
    if (!p) return;
    this.data.projects = this.data.projects.filter(x => x.id !== id);
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== id);
    this.log('project_deleted', `Eliminó el proyecto <strong>${escapeHtml(p.name)}</strong>`);
    this.scheduleSave();
  },

  getProjectProgress(projectId) {
    const tasks = this.data.tasks.filter(t => t.projectId === projectId);
    if (tasks.length === 0) return { pct: 0, total: 0, done: 0 };
    const done = tasks.filter(t => t.status === 'terminado').length;
    return { pct: Math.round((done / tasks.length) * 100), total: tasks.length, done };
  },

  // ---------- Tareas ----------
  createTask({ projectId, title, description, priority, status, dueDate, assignedTo }) {
    const task = {
      id: this.uid(),
      projectId,
      title: title.trim(),
      description: (description || '').trim(),
      priority: priority || 'media',
      status: status || 'pendiente',
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      createdAt: new Date().toISOString(),
      completedAt: status === 'terminado' ? new Date().toISOString() : null
    };
    this.data.tasks.unshift(task);
    const project = this.data.projects.find(p => p.id === task.projectId);
    this.log('task_created',
      `Creó la tarea <strong>${escapeHtml(task.title)}</strong>` +
      (project ? ` en ${escapeHtml(project.name)}` : '')
    );
    this.scheduleSave();
    return task;
  },

  updateTask(id, data) {
    const t = this.data.tasks.find(x => x.id === id);
    if (!t) return null;
    const oldStatus = t.status;
    t.title = data.title.trim();
    t.description = (data.description || '').trim();
    t.projectId = data.projectId;
    t.priority = data.priority;
    t.status = data.status;
    t.dueDate = data.dueDate || null;
    t.assignedTo = data.assignedTo || null;
    if (data.status === 'terminado' && oldStatus !== 'terminado') t.completedAt = new Date().toISOString();
    if (data.status !== 'terminado') t.completedAt = null;
    this.log('task_updated', `Editó la tarea <strong>${escapeHtml(t.title)}</strong>`);
    this.scheduleSave();
    return t;
  },

  removeTask(id) {
    const t = this.data.tasks.find(x => x.id === id);
    if (!t) return;
    this.data.tasks = this.data.tasks.filter(x => x.id !== id);
    this.log('task_deleted', `Eliminó la tarea <strong>${escapeHtml(t.title)}</strong>`);
    this.scheduleSave();
  },

  setTaskStatus(id, status) {
    const t = this.data.tasks.find(x => x.id === id);
    if (!t || t.status === status) return;
    t.status = status;
    t.completedAt = status === 'terminado' ? new Date().toISOString() : null;
    const labels = { 'pendiente': 'Pendiente', 'en-progreso': 'En progreso', 'terminado': 'Terminado' };
    this.log('task_moved', `Movió <strong>${escapeHtml(t.title)}</strong> a <strong>${labels[status]}</strong>`);
    this.scheduleSave();
  },

  // ---------- Usuarios ----------
  createUser({ name }) {
    const u = { id: this.uid(), name: name.trim(), createdAt: new Date().toISOString() };
    this.data.users.unshift(u);
    this.log('user_created', `Agregó al usuario <strong>${escapeHtml(u.name)}</strong>`);
    this.scheduleSave();
    return u;
  },

  removeUser(id) {
    const u = this.data.users.find(x => x.id === id);
    if (!u) return;
    this.data.users = this.data.users.filter(x => x.id !== id);
    this.data.tasks.forEach(t => { if (t.assignedTo === id) t.assignedTo = null; });
    this.log('user_deleted', `Eliminó al usuario <strong>${escapeHtml(u.name)}</strong>`);
    this.scheduleSave();
  },

  // ---------- Configuración ----------
  setTheme(theme) {
    this.data.settings.theme = theme;
    this.scheduleSave();
  },

  // ---------- Exportar / Importar ----------
  exportJSON() {
    const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `taskflow-data-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async importJSON(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') throw new Error('Archivo JSON inválido');
    this.data = this._normalize(parsed);
    this.save();
    return this.data;
  },

  // ---------- Reset ----------
  reset() {
    this.data = this._defaults();
    this.save();
  }
};

// Helper global ligero (también usado en ui.js)
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Cargar datos inmediatamente al incluir este script
Store.load();
