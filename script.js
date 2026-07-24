// 1. Inicializar el editor Quill
const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ]
    }
});

// Configurar fecha por defecto (Simulando tu captura que decía 31 diciembre 2001)
// Si querés que sea el día de hoy, dejá esto así:
document.getElementById('fechaPublicacion').valueAsDate = new Date();

// 2. Funciones para la Tabla
function abrirModalTabla() { document.getElementById('modalTabla').style.display = 'flex'; }
function cerrarModalTabla() { document.getElementById('modalTabla').style.display = 'none'; }

function insertarTablaGenerada() {
    const filas = parseInt(document.getElementById('numFilas').value);
    const cols = parseInt(document.getElementById('numCols').value);
    
    let htmlTabla = '<br><table style="width:100%; border-collapse:collapse; border:1px solid #000; margin:15px 0;"><thead><tr>';
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
    htmlTabla += '</tbody></table><br>';

    const range = quill.getSelection(true);
    quill.clipboard.dangerouslyPasteHTML(range.index, htmlTabla);
    cerrarModalTabla();
}

// 3. Inserción de imágenes
function insertarImagen(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// 4. Recolectar todos los datos exactos del formulario para enviar
function enviarFormulario() {
    // Validar campos requeridos básicos antes de enviar
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
        
        contenidoCircularHtml: quill.root.innerHTML,
        
        rutaAcceso: document.getElementById('rutaAcceso').value,
        consultasCircular: document.getElementById('consultasCircular').value,
        
        // Nota: Los archivos adjuntos requieren lógica en Base64 o Multipart para enviarse por API.
        // Por ahora registramos la cantidad de archivos seleccionados.
        cantidadAdjuntos: document.getElementById('archivosAdjuntos').files.length
    };

    console.log("Datos de la Circular Listos para enviar:", payload);
    alert("¡Revisá la consola del navegador! Todos los campos de tus capturas fueron capturados perfectamente.");
    
    // Acá iría el fetch() a tu Webhook de Power Automate
}