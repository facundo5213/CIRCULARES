const form = document.getElementById('circularForm');
const editor = document.getElementById('editor');
const toast = document.getElementById('toast');
const tableDialog = document.getElementById('tableDialog');
const previewDialog = document.getElementById('previewDialog');
const previewBody = document.getElementById('previewBody');
const attachmentInput = document.getElementById('attachmentInput');
const dropzone = document.getElementById('dropzone');
const fileList = document.getElementById('fileList');
let attachedFiles = [];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function exec(command, value = null) {
  editor.focus();
  document.execCommand(command, false, value);
}

document.querySelectorAll('[data-command]').forEach(button => {
  button.addEventListener('click', () => exec(button.dataset.command));
});

document.getElementById('formatBlock').addEventListener('change', e => {
  exec('formatBlock', e.target.value);
});

document.getElementById('insertTableBtn').addEventListener('click', () => tableDialog.showModal());

document.getElementById('confirmTable').addEventListener('click', e => {
  e.preventDefault();
  const rows = Math.max(1, Math.min(30, Number(document.getElementById('tableRows').value) || 1));
  const cols = Math.max(1, Math.min(12, Number(document.getElementById('tableCols').value) || 1));
  let html = '<table><thead><tr>';
  for (let c = 0; c < cols; c++) html += `<th>Columna ${c + 1}</th>`;
  html += '</tr></thead><tbody>';
  for (let r = 1; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) html += '<td>&nbsp;</td>';
    html += '</tr>';
  }
  html += '</tbody></table><p><br></p>';
  exec('insertHTML', html);
  tableDialog.close();
  updateWordCount();
});

document.getElementById('insertImageBtn').addEventListener('click', () => {
  document.getElementById('imageInput').click();
});

document.getElementById('imageInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return showToast('Seleccione un archivo de imagen válido.');
  const reader = new FileReader();
  reader.onload = () => {
    exec('insertHTML', `<img src="${reader.result}" alt="Imagen incorporada en la circular"><p><br></p>`);
    updateWordCount();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

function updateWordCount() {
  const text = editor.innerText.trim();
  const count = text ? text.split(/\s+/).length : 0;
  document.getElementById('wordCount').textContent = `${count} ${count === 1 ? 'palabra' : 'palabras'}`;
}
editor.addEventListener('input', updateWordCount);

function addFiles(files) {
  [...files].forEach(file => {
    if (!attachedFiles.some(f => f.name === file.name && f.size === file.size)) attachedFiles.push(file);
  });
  renderFiles();
}
function renderFiles() {
  fileList.innerHTML = '';
  attachedFiles.forEach((file, index) => {
    const row = document.createElement('div');
    row.className = 'file-chip';
    row.innerHTML = `<span>📎 ${file.name} · ${formatBytes(file.size)}</span><button type="button" aria-label="Quitar archivo">×</button>`;
    row.querySelector('button').addEventListener('click', () => {
      attachedFiles.splice(index, 1);
      renderFiles();
    });
    fileList.appendChild(row);
  });
}
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}
attachmentInput.addEventListener('change', e => addFiles(e.target.files));
['dragenter','dragover'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault(); dropzone.classList.add('dragover');
}));
['dragleave','drop'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault(); dropzone.classList.remove('dragover');
}));
dropzone.addEventListener('drop', e => addFiles(e.dataTransfer.files));

function serializeForm() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.contenido = editor.innerHTML;
  data.adjuntos = attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }));
  return data;
}

document.getElementById('saveDraft').addEventListener('click', () => {
  localStorage.setItem('circularReservadaDraft', JSON.stringify(serializeForm()));
  showToast('Borrador guardado en este navegador.');
});

function loadDraft() {
  const raw = localStorage.getItem('circularReservadaDraft');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'contenido') editor.innerHTML = value || '';
      else if (key !== 'adjuntos' && form.elements[key]) form.elements[key].value = value || '';
    });
    updateWordCount();
  } catch (_) {}
}
loadDraft();

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
}

document.getElementById('previewBtn').addEventListener('click', () => {
  const data = serializeForm();
  previewBody.innerHTML = `
    <article class="preview-sheet">
      <dl>
        <dt>Unidad Organizativa emisora</dt><dd>${escapeHtml(data.unidadEmisora)}</dd>
        <dt>Cargo de revista</dt><dd>${escapeHtml(data.cargo)}</dd>
        <dt>Correos en copia</dt><dd>${escapeHtml(data.copias)}</dd>
        <dt>Fecha de publicación</dt><dd>${escapeHtml(data.fechaPublicacion)}</dd>
        <dt>Utilidad</dt><dd>${escapeHtml(data.utilidad)}</dd>
        <dt>Proceso o producto</dt><dd>${escapeHtml(data.procesoProducto)}</dd>
        <dt>Afectación</dt><dd>${escapeHtml(data.tipoAfectacion)}</dd>
        <dt>Detalle</dt><dd>${escapeHtml(data.detalleAfectacion)}</dd>
        <dt>Ámbito de aplicación</dt><dd>${escapeHtml(data.ambito)}</dd>
        <dt>Ruta de acceso</dt><dd>${escapeHtml(data.rutaAcceso)}</dd>
        <dt>Consultas</dt><dd>${escapeHtml(data.consultas)}</dd>
      </dl>
      <div class="preview-editor">${data.contenido || '<p><em>Sin contenido redactado.</em></p>'}</div>
    </article>`;
  previewDialog.showModal();
});

document.getElementById('closePreview').addEventListener('click', () => previewDialog.close());

form.addEventListener('submit', e => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  if (!editor.innerText.trim() && !editor.querySelector('img, table')) {
    editor.focus();
    showToast('Debe redactar el contenido de la circular.');
    return;
  }
  console.log('Datos enviados:', serializeForm());
  showToast('Solicitud validada y lista para integrarse con el backend.');
});
