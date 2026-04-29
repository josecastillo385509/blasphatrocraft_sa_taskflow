const Store = {
  KEY: 'taskflow_data_v1',
  data: null,

  // ---------- Carga / persistencia ----------
  load() {
    try {

      // CAMBIO:
      // Se usa window.localStorage para mejorar compatibilidad con Firefox
      // y evitar problemas de acceso al storage en algunos navegadores.
      const raw = window.localStorage.getItem(this.KEY);

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

      // CAMBIO:
      // Se reemplazó localStorage por window.localStorage
      // para asegurar compatibilidad en Firefox.
      window.localStorage.setItem(this.KEY, JSON.stringify(this.data));

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
      settings: d.settings && typeof d.settings === 'object'
        ? d.settings
        : { theme: 'light' }
    };
  },

  // ---------- Utilidades ----------
  uid() {
    return 'id_' + Math.random().toString(36).slice(2, 11) +
           Date.now().toString(36);
  },

  // ---------- Actividad ----------
  log(type, description) {
    this.data.activity.unshift({
      id: this.uid(),
      type,
      description,
      timestamp: new Date().toISOString()
    });

    if (this.data.activity.length > 100) {
      this.data.activity.length = 100;
    }
  },

  // ---------- Configuración ----------
  setTheme(theme) {
    this.data.settings.theme = theme;
    this.scheduleSave();
  }
};

// Helper global ligero
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// Cargar datos inmediatamente
Store.load();