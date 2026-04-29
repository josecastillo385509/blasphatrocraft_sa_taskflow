/* ============================================================
   TaskFlow - Storage Module
   Maneja toda la persistencia en LocalStorage
   Compartido entre todas las páginas
   ============================================================ */

const STORAGE_KEYS = {
  PROJECTS: 'taskflow_projects',
  TASKS: 'taskflow_tasks',
  USERS: 'taskflow_users',
  ACTIVITY: 'taskflow_activity',
  THEME: 'taskflow_theme'
};

/* ---------- Utilidades ---------- */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function nowISO() {
  return new Date().toISOString();
}

/* ---------- Lectura / Escritura genérica ---------- */
function _read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo de localStorage:', key, e);
    return [];
  }
}

function _write(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error escribiendo en localStorage:', key, e);
    return false;
  }
}

/* ---------- PROYECTOS ---------- */
const ProjectStore = {
  getAll() {
    return _read(STORAGE_KEYS.PROJECTS);
  },
  getById(id) {
    return this.getAll().find(p => p.id === id) || null;
  },
  create({ name, description, color }) {
    if (!name || !name.trim()) {
      throw new Error('El nombre del proyecto es obligatorio');
    }
    const project = {
      id: generateId(),
      name: name.trim(),
      description: (description || '').trim(),
      color: color || '#c9a961',
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    const projects = this.getAll();
    projects.push(project);
    _write(STORAGE_KEYS.PROJECTS, projects);
    ActivityStore.log('project_create', `Proyecto creado: ${project.name}`);
    return project;
  },
  update(id, changes) {
    const projects = this.getAll();
    const idx = projects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Proyecto no encontrado');
    projects[idx] = {
      ...projects[idx],
      ...changes,
      updatedAt: nowISO()
    };
    _write(STORAGE_KEYS.PROJECTS, projects);
    ActivityStore.log('project_update', `Proyecto actualizado: ${projects[idx].name}`);
    return projects[idx];
  },
  remove(id) {
    const projects = this.getAll();
    const target = projects.find(p => p.id === id);
    const filtered = projects.filter(p => p.id !== id);
    _write(STORAGE_KEYS.PROJECTS, filtered);
    // Eliminar tareas en cascada
    const tasks = TaskStore.getAll().filter(t => t.projectId !== id);
    _write(STORAGE_KEYS.TASKS, tasks);
    if (target) {
      ActivityStore.log('project_delete', `Proyecto eliminado: ${target.name}`);
    }
  }
};

/* ---------- TAREAS ---------- */
const VALID_PRIORITIES = ['baja', 'media', 'alta'];
const VALID_STATUSES = ['pendiente', 'en_progreso', 'terminado'];

const TaskStore = {
  getAll() {
    return _read(STORAGE_KEYS.TASKS);
  },
  getById(id) {
    return this.getAll().find(t => t.id === id) || null;
  },
  getByProject(projectId) {
    return this.getAll().filter(t => t.projectId === projectId);
  },
  create({ title, description, projectId, priority, status, dueDate, assigneeId }) {
    if (!title || !title.trim()) {
      throw new Error('El título de la tarea es obligatorio');
    }
    if (!projectId) {
      throw new Error('La tarea debe pertenecer a un proyecto');
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new Error('Prioridad inválida');
    }
    if (status && !VALID_STATUSES.includes(status)) {
      throw new Error('Estado inválido');
    }
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) throw new Error('Fecha límite inválida');
    }
    const task = {
      id: generateId(),
      title: title.trim(),
      description: (description || '').trim(),
      projectId,
      priority: priority || 'media',
      status: status || 'pendiente',
      dueDate: dueDate || null,
      assigneeId: assigneeId || null,
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    const tasks = this.getAll();
    tasks.push(task);
    _write(STORAGE_KEYS.TASKS, tasks);
    ActivityStore.log('task_create', `Tarea creada: ${task.title}`);
    return task;
  },
  update(id, changes) {
    const tasks = this.getAll();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tarea no encontrada');
    if (changes.priority && !VALID_PRIORITIES.includes(changes.priority)) {
      throw new Error('Prioridad inválida');
    }
    if (changes.status && !VALID_STATUSES.includes(changes.status)) {
      throw new Error('Estado inválido');
    }
    if (changes.dueDate) {
      const d = new Date(changes.dueDate);
      if (isNaN(d.getTime())) throw new Error('Fecha límite inválida');
    }
    const previousStatus = tasks[idx].status;
    tasks[idx] = {
      ...tasks[idx],
      ...changes,
      updatedAt: nowISO()
    };
    _write(STORAGE_KEYS.TASKS, tasks);
    if (changes.status && changes.status !== previousStatus) {
      ActivityStore.log('task_status', `${tasks[idx].title} → ${changes.status.replace('_', ' ')}`);
    } else {
      ActivityStore.log('task_update', `Tarea actualizada: ${tasks[idx].title}`);
    }
    return tasks[idx];
  },
  remove(id) {
    const tasks = this.getAll();
    const target = tasks.find(t => t.id === id);
    const filtered = tasks.filter(t => t.id !== id);
    _write(STORAGE_KEYS.TASKS, filtered);
    if (target) {
      ActivityStore.log('task_delete', `Tarea eliminada: ${target.title}`);
    }
  },
  changeStatus(id, status) {
    return this.update(id, { status });
  }
};

/* ---------- USUARIOS (perfiles simples) ---------- */
const UserStore = {
  getAll() {
    return _read(STORAGE_KEYS.USERS);
  },
  getById(id) {
    return this.getAll().find(u => u.id === id) || null;
  },
  create({ name }) {
    if (!name || !name.trim()) throw new Error('El nombre es obligatorio');
    const user = {
      id: generateId(),
      name: name.trim(),
      createdAt: nowISO()
    };
    const users = this.getAll();
    users.push(user);
    _write(STORAGE_KEYS.USERS, users);
    return user;
  },
  remove(id) {
    const users = this.getAll().filter(u => u.id !== id);
    _write(STORAGE_KEYS.USERS, users);
    // Desasignar tareas
    const tasks = TaskStore.getAll().map(t =>
      t.assigneeId === id ? { ...t, assigneeId: null } : t
    );
    _write(STORAGE_KEYS.TASKS, tasks);
  }
};

/* ---------- ACTIVIDAD RECIENTE ---------- */
const ActivityStore = {
  getAll() {
    return _read(STORAGE_KEYS.ACTIVITY);
  },
  log(type, message) {
    const entry = {
      id: generateId(),
      type,
      message,
      timestamp: nowISO()
    };
    const list = this.getAll();
    list.unshift(entry);
    // Mantener máx 50 entradas
    if (list.length > 50) list.length = 50;
    _write(STORAGE_KEYS.ACTIVITY, list);
  },
  clear() {
    _write(STORAGE_KEYS.ACTIVITY, []);
  }
};

/* ---------- TEMA ---------- */
const ThemeStore = {
  get() {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    } catch (e) {
      return 'dark';
    }
  },
  set(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.error('No se pudo guardar el tema:', e);
    }
    document.documentElement.setAttribute('data-theme', theme);
  },
  toggle() {
    const next = this.get() === 'dark' ? 'light' : 'dark';
    this.set(next);
    return next;
  },
  apply() {
    document.documentElement.setAttribute('data-theme', this.get());
  }
};

/* ---------- IMPORT / EXPORT ---------- */
const DataIO = {
  exportAll() {
    return {
      version: '1.0',
      exportedAt: nowISO(),
      projects: ProjectStore.getAll(),
      tasks: TaskStore.getAll(),
      users: UserStore.getAll(),
      activity: ActivityStore.getAll()
    };
  },
  downloadJSON(filename = 'taskflow-backup.json') {
    const data = this.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  importFromJSON(jsonString) {
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Archivo JSON inválido');
    }
    if (!data || typeof data !== 'object') {
      throw new Error('El archivo no contiene datos válidos');
    }
    if (!Array.isArray(data.projects) || !Array.isArray(data.tasks)) {
      throw new Error('Estructura de datos incorrecta');
    }
    _write(STORAGE_KEYS.PROJECTS, data.projects);
    _write(STORAGE_KEYS.TASKS, data.tasks);
    if (Array.isArray(data.users)) _write(STORAGE_KEYS.USERS, data.users);
    if (Array.isArray(data.activity)) _write(STORAGE_KEYS.ACTIVITY, data.activity);
    ActivityStore.log('import', 'Datos importados correctamente');
    return {
      projects: data.projects.length,
      tasks: data.tasks.length,
      users: Array.isArray(data.users) ? data.users.length : 0
    };
  },
  clearAll() {
    Object.values(STORAGE_KEYS).forEach(k => {
      if (k !== STORAGE_KEYS.THEME) localStorage.removeItem(k);
    });
  }
};

/* ---------- TOAST / NOTIFICACIONES ---------- */
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  // Animación de entrada
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ---------- INICIALIZACIÓN ---------- */
// Aplicar tema inmediatamente para evitar parpadeo
(function initTheme() {
  if (typeof document !== 'undefined') {
    ThemeStore.apply();
  }
})();
