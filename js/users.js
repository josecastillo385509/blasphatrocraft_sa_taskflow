/* ============================================
   Users
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderUsers();
  $('#btn-new-user').addEventListener('click', openUserModal);
  $('#user-save').addEventListener('click', saveUser);
  $('#user-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveUser(); });
});

function renderUsers() {
  const container = $('#users-container');

  if (Store.data.users.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-mark">∅</div>
        <h3>Sin usuarios</h3>
        <p>Agrega perfiles para asignarles tareas.</p>
        <button class="btn btn-accent" onclick="openUserModal()">Crear usuario</button>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="users-grid">` + Store.data.users.map(u => {
    const tasks = Store.data.tasks.filter(t => t.assignedTo === u.id);
    const initial = u.name.charAt(0).toUpperCase();
    return `
      <div class="user-card">
        <div class="user-avatar">${escapeHtml(initial)}</div>
        <div class="user-info">
          <div class="user-name">${escapeHtml(u.name)}</div>
          <div class="user-tasks">${tasks.length} ${tasks.length === 1 ? 'tarea' : 'tareas'}</div>
        </div>
        <button class="icon-btn-sm danger" onclick="deleteUser('${u.id}')" title="Eliminar">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  }).join('') + `</div>`;
}

function openUserModal() {
  clearFieldErrors();
  $('#user-name').value = '';
  Modal.open('modal-user');
  setTimeout(() => $('#user-name').focus(), 100);
}

function saveUser() {
  clearFieldErrors();
  const name = $('#user-name').value.trim();
  if (!name) { setFieldError('user-name', true); return; }
  Store.createUser({ name });
  Modal.close('modal-user');
  renderUsers();
  Toast.show('Usuario creado', 'success');
}

function deleteUser(id) {
  const u = Store.data.users.find(x => x.id === id);
  if (!u) return;
  Confirm.show(
    '¿Eliminar usuario?',
    `Se eliminará <strong>${escapeHtml(u.name)}</strong>. Las tareas asignadas quedarán sin asignar.`,
    () => {
      Store.removeUser(id);
      renderUsers();
      Toast.show('Usuario eliminado', 'success');
    }
  );
}
