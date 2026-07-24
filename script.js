// 1. Inicializar el editor TinyMCE
tinymce.init({
    selector: '#editor',
    menubar: false,
    plugins: 'table image lists link',
    toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | table image',
    height: 400,
    language: 'es',
    // Fuerza el CSS de las tablas internamente para que mantengan la estructura de Excel
    content_style: `
        body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 15px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
        td, th { border: 1px solid #000000 !important; padding: 8px 10px; }
        th { background-color: #f3f2f1 !important; font-weight: bold; }
    `
});

// Configurar fecha de hoy por defecto
document.getElementById('fechaPublicacion').valueAsDate = new Date();

// 2. Lógica del Modal de Tabla
function abrirModalTabla() { document.getElementById('modalTabla').style.display = 'flex'; }
function cerrarModalTabla() { document.getElementById('modalTabla').style.display = 'none'; }

function insertarTablaGenerada() {
    const filas = parseInt(document.getElementById('numFilas').value);
    const cols = parseInt(document.getElementById('numCols').value);
    
    let htmlTabla = '<table style="width:100%; border-collapse:collapse; border:1px solid #000;"><thead><tr>';
    for (let j = 1; j <= cols; j++) {
        htmlTabla += `<th style="border:1px solid #000; padding:8px; background-color:#f3f2f1; text-align:left; font-weight:bold;">Título ${j}</th>`;
    }
    htmlTabla += '</tr></thead><tbody>';
    for (let i = 1; i <= filas; i++) {
        htmlTabla += '<tr>';
        for (let j = 1; j <= cols; j++) {
            htmlTabla += `<td style="border:1px solid #000; padding:8px;">Dato ${i}-${j}</td>`;
        }
        htmlTabla += '</tr>';
    }
    htmlTabla += '</tbody></table><p><br></p>';

    tinymce.activeEditor.insertContent(htmlTabla);
    cerrarModalTabla();
}

// 3. Lógica para Inyectar Imágenes Locales
function insertarImagen(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            tinymce.activeEditor.insertContent(`<img src="${e.target.result}" style="max-width: 100%; height: auto; border-radius: 4px;" />`);
        };
        reader.readAsDataURL(file);
    }
}

// 4. Envío de Formulario
function enviarFormulario() {
    if(!document.getElementById('unidadEmisora').value || 
       !document.getElementById('cargoRevista').value) {
        alert("Por favor, complete los campos obligatorios (*).");
        return;
    }

    const payload = {
        unidadEmisora: document.getElementById('unidadEmisora').value,
        cargoRevista: document.getElementById('cargoRevista').value,
        correosCopia: document.getElementById('correosCopia').value,
        fechaPublicacion: document.getElementById('fechaPublicacion').value,
        
        procesoProducto: document.getElementById('procesoProducto').value,
        afectaUnidades: document.getElementById('afectaUnidades').value,
        detalleUnidades: document.getElementById('detalleUnidades').value,
        ambitoAplicacion: document.getElementById('ambitoAplicacion').value,
        
        // El HTML extraído manteniendo 100% la estructura para tu PDF/Mail
        contenidoCircularHtml: tinymce.activeEditor.getContent(),
        
        rutaAcceso: document.getElementById('rutaAcceso').value,
        consultasCircular: document.getElementById('consultasCircular').value,
        cantidadAdjuntos: document.getElementById('archivosAdjuntos').files.length
    };

    console.log("Datos Listos para enviar:", payload);
    alert("¡Éxito! Todos los datos y la circular con tablas perfectas están listos. Revisá la consola (F12).");
}