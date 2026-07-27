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
let savedEditorRange = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function saveEditorSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  if (editor.contains(range.commonAncestorContainer)) savedEditorRange = range.cloneRange();
}

function restoreEditorSelection() {
  editor.focus();
  if (!savedEditorRange) return false;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(savedEditorRange);
  return true;
}

function exec(command, value = null) {
  restoreEditorSelection();
  document.execCommand(command, false, value);
  saveEditorSelection();
}

function insertHtmlAtCursor(html) {
  restoreEditorSelection();
  const selection = window.getSelection();

  if (selection && selection.rangeCount) {
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      const fragment = range.createContextualFragment(html);
      const lastNode = fragment.lastChild;
      range.insertNode(fragment);
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        savedEditorRange = range.cloneRange();
      }
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
  }

  editor.insertAdjacentHTML('beforeend', html);
  editor.focus();
  const fallbackRange = document.createRange();
  fallbackRange.selectNodeContents(editor);
  fallbackRange.collapse(false);
  const fallbackSelection = window.getSelection();
  fallbackSelection.removeAllRanges();
  fallbackSelection.addRange(fallbackRange);
  savedEditorRange = fallbackRange.cloneRange();
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

document.querySelectorAll('[data-command]').forEach(button => {
  button.addEventListener('click', () => exec(button.dataset.command));
});

document.getElementById('formatBlock').addEventListener('change', e => {
  exec('formatBlock', e.target.value);
});

document.getElementById('insertTableBtn').addEventListener('click', () => {
  saveEditorSelection();
  tableDialog.showModal();
});

document.getElementById('confirmTable').addEventListener('click', e => {
  e.preventDefault();
  const rows = Math.max(1, Math.min(30, Number(document.getElementById('tableRows').value) || 1));
  const cols = Math.max(1, Math.min(12, Number(document.getElementById('tableCols').value) || 1));
  let html = '<div class="table-scroll"><table><thead><tr>';
  for (let c = 0; c < cols; c++) html += `<th>Columna ${c + 1}</th>`;
  html += '</tr></thead><tbody>';
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) html += '<td><br></td>';
    html += '</tr>';
  }
  html += '</tbody></table></div><p><br></p>';
  tableDialog.close();
  insertHtmlAtCursor(html);
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
    insertHtmlAtCursor(`<img src="${reader.result}" alt="Imagen incorporada en la circular"><p><br></p>`);
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
['keyup', 'mouseup', 'focus', 'input'].forEach(eventName => editor.addEventListener(eventName, saveEditorSelection));

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

function formatDate(value) {
  if (!value) return 'Sin definir';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateDash(value) {
  if (!value) return '--/--/----';
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

function textOrFallback(value, fallback = 'Sin informar') {
  return escapeHtml(value || fallback);
}

function buildPreview() {
  const data = serializeForm();
  const circularNumber = `N.º ${String(new Date().getFullYear()).slice(-2)}${String(new Date().getMonth()+1).padStart(2,'0')}/2026`;
  const attachmentHtml = attachedFiles.length
    ? attachedFiles.map(file => `<div class="attachment-row"><div class="attachment-icon">📄</div><div><strong>${escapeHtml(file.name)}</strong><span>${formatBytes(file.size)}</span></div></div>`).join('')
    : '<span>No hay archivos adjuntos.</span>';

  previewBody.innerHTML = `
    <div class="preview-layout">
      <aside class="preview-summary">
        <div class="preview-summary-card">
          <h4>Resumen de la solicitud</h4>
          <div class="preview-complete">✓ Lista para revisar</div>
          <div class="summary-item"><strong>Unidad Organizativa emisora</strong><span>${textOrFallback(data.unidadEmisora)}</span></div>
          <div class="summary-item"><strong>Cargo de revista</strong><span>${textOrFallback(data.cargo)}</span></div>
          <div class="summary-item"><strong>Correos en copia</strong><span>${textOrFallback(data.copias, 'Sin copias')}</span></div>
          <div class="summary-item"><strong>Fecha de publicación</strong><span>${formatDate(data.fechaPublicacion)}</span></div>
          <div class="summary-item"><strong>Utilidad</strong><span>${textOrFallback(data.utilidad)}</span></div>
          <div class="summary-item"><strong>Proceso / Producto</strong><span>${textOrFallback(data.procesoProducto)}</span></div>
          <div class="summary-item"><strong>Afectación</strong><span>${textOrFallback(data.tipoAfectacion)}</span></div>
          <div class="summary-item"><strong>Detalle</strong><span>${textOrFallback(data.detalleAfectacion)}</span></div>
          <div class="summary-item"><strong>Ámbito de aplicación</strong><span>${textOrFallback(data.ambito)}</span></div>
        </div>
        <div class="preview-summary-card">
          <h4>Archivos adjuntos</h4>
          ${attachmentHtml}
        </div>
      </aside>

      <main class="circular-frame">
        <div class="circular-preview-label">◉ Vista previa de la Circular Reservada</div>
        <article class="circular-document">
          <header class="circular-header">
            <div class="circular-title-wrap">
              <div class="circular-bank"><span class="seal">▥</span> Banco Nación</div>
              <h2 class="circular-title">Circular Reservada</h2>
            </div>
            <div class="circular-number">
              <div>${circularNumber}</div>
              <div>${formatDateDash(data.fechaPublicacion)}</div>
            </div>
          </header>

          <section class="circular-meta">
            <div class="circular-meta-item"><b>Utilidad</b><span>${textOrFallback(data.utilidad)}</span></div>
            <div class="circular-meta-item"><b>Proceso / Producto</b><span>${textOrFallback(data.procesoProducto)}</span></div>
            <div class="circular-meta-item"><b>Unidades de información o asunto</b><span>${textOrFallback(data.detalleAfectacion)}</span></div>
            <div class="circular-meta-item"><b>Ámbito de aplicación</b><span>${textOrFallback(data.ambito)}</span></div>
          </section>

          <section class="circular-content">
            ${data.contenido || '<p><em>Sin contenido redactado.</em></p>'}
          </section>

          <section class="circular-bottom">
            <section><b>MENÚ</b><p>${textOrFallback(data.rutaAcceso, 'Sin ruta informada')}</p></section>
            <section><b>CONSULTAS</b><p>${textOrFallback(data.consultas, 'Sin canal informado')}</p></section>
            <section><b>EMISOR</b><p>${textOrFallback(data.unidadEmisora)}</p></section>
          </section>
          <footer class="circular-footer">PROCESOS INTELIGENTES</footer>
        </article>
        <div class="preview-note"><strong>Importante:</strong> esta es la apariencia final de la circular antes de enviarla. Puede volver a editar cualquier dato.</div>
      </main>
    </div>`;
}

document.getElementById('previewBtn').addEventListener('click', () => {
  buildPreview();
  previewDialog.showModal();
});

document.getElementById('closePreview').addEventListener('click', () => previewDialog.close());
document.getElementById('backToEdit').addEventListener('click', () => previewDialog.close());
document.getElementById('sendFromPreview').addEventListener('click', () => {
  previewDialog.close();
  form.requestSubmit();
});

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
