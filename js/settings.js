/* ============================================
   Settings
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  updateStorageSize();

  $('#theme-toggle-2').addEventListener('click', () => Theme.toggle());

  $('#settings-export').addEventListener('click', () => {
    Store.exportJSON();
    Toast.show('Datos exportados', 'success');
  });

  $('#settings-import').addEventListener('click', () => $('#import-file').click());

  $('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Confirm.show(
      '¿Importar datos?',
      'Esto <strong>reemplazará</strong> todos los datos actuales. ¿Continuar?',
      async () => {
        try {
          await Store.importJSON(file);
          Toast.show('Datos importados correctamente', 'success');
          updateStorageSize();
          // Recargar para refrescar sidebar y todo lo demás
          setTimeout(() => location.reload(), 800);
        } catch (err) {
          Toast.show('Error al importar: ' + err.message, 'error');
        }
        e.target.value = '';
      }
    );
  });

  $('#settings-reset').addEventListener('click', () => {
    Confirm.show(
      '¿Borrar todos los datos?',
      'Se eliminarán <strong>todos</strong> los proyectos, tareas, usuarios y actividad. Esta acción no se puede deshacer.',
      () => {
        Store.reset();
        Toast.show('Datos eliminados', 'success');
        setTimeout(() => location.reload(), 800);
      }
    );
  });
});

function updateStorageSize() {
  const raw = localStorage.getItem(Store.KEY) || '';
  const bytes = new Blob([raw]).size;
  const kb = (bytes / 1024).toFixed(1);
  const el = $('#storage-size');
  if (el) el.textContent = kb + ' KB';
}
