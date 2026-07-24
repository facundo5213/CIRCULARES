// Configuración e Inicialización del Editor Quill.js
const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['clean']
        ]
    }
});

// Colocar la fecha actual por defecto en el formulario
document.getElementById('fecha').valueAsDate = new Date();

// Modal de Generación de Tablas
function abrirModalTabla() {
    document.getElementById('modalTabla').style.display = 'flex';
}

function cerrarModalTabla() {
    document.getElementById('modalTabla').style.display = 'none';
}

function insertarTablaGenerada() {
    const filas = parseInt(document.getElementById('numFilas').value);
    const cols = parseInt(document.getElementById('numCols').value);

    let htmlTabla = '<br><table style="width:100%; border-collapse:collapse; border:1px solid #000; margin:15px 0;"><thead><tr>';
    
    // Encabezados
    for (let j = 1; j <= cols; j++) {
        htmlTabla += `<th style="border:1px solid #000; padding:8px; background-color:#f3f2f1; text-align:left; font-weight:bold;">Título ${j}</th>`;
    }
    htmlTabla += '</tr></thead><tbody>';

    // Filas de Datos
    for (let i = 1; i <= filas; i++) {
        htmlTabla += '<tr>';
        for (let j = 1; j <= cols; j++) {
            htmlTabla += `<td style="border:1px solid #000; padding:8px;">Dato ${i}-${j}</td>`;
        }
        htmlTabla += '</tr>';
    }
    htmlTabla += '</tbody></table><br>';

    // Insertar en el editor Quill
    const range = quill.getSelection(true);
    quill.clipboard.dangerouslyPasteHTML(range.index, htmlTabla);
    cerrarModalTabla();
}

// Carga e inserción de imágenes en Base64
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

// Vista Previa de la Circular
function abrirVistaPrevia() {
    const num = document.getElementById('numCircular').value || 'CR-2026-XXX';
    const fecha = document.getElementById('fecha').value;
    const emisor = document.getElementById('emisor').value || '—';
    const destinatario = document.getElementById('destinatario').value || '—';
    const asunto = document.getElementById('asunto').value || '—';
    const contenido = quill.root.innerHTML;

    const docPrevia = document.getElementById('documentoPrevia');
    docPrevia.innerHTML = `
        <div class="doc-header">
            <h2>CIRCULAR RESERVADA N° ${num}</h2>
            <p><strong>FECHA:</strong> ${fecha}</p>
        </div>
        <div class="doc-metadata">
            <p><strong>DE:</strong> ${emisor}</p>
            <p><strong>PARA:</strong> ${destinatario}</p>
            <p><strong>ASUNTO:</strong> ${asunto}</p>
        </div>
        <hr style="border:0; border-top:1px solid #000; margin:20px 0;">
        <div class="doc-body">
            ${contenido}
        </div>
    `;

    document.getElementById('modalPrevia').style.display = 'flex';
}

function cerrarVistaPrevia() {
    document.getElementById('modalPrevia').style.display = 'none';
}

// Envío de Datos a Power Automate mediante Webhook
async function enviarAPowerAutomate() {
    // Reemplazar este string con la URL de tu Webhook de Power Automate
    const WEBHOOK_URL = "https://prod-xx.westus.logic.azure.com:443/workflows/..."; 

    const payload = {
        numeroCircular: document.getElementById('numCircular').value,
        fecha: document.getElementById('fecha').value,
        emisor: document.getElementById('emisor').value,
        destinatario: document.getElementById('destinatario').value,
        asunto: document.getElementById('asunto').value,
        contenidoHtml: quill.root.innerHTML
    };

    if (!payload.numeroCircular || !payload.asunto) {
        alert("Por favor completa al menos el Número de Circular y el Asunto.");
        return;
    }

    try {
        /* Descomentar cuando tengas la URL de Power Automate lista:
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("¡Circular enviada con éxito a Power Automate!");
        } else {
            alert("Error al enviar la circular.");
        }
        */
        console.log("Payload generado listo para enviar:", payload);
        alert("¡Payload generado correctamente en consola! Revisa script.js para colocar tu URL de Power Automate.");
    } catch (error) {
        console.error("Error:", error);
        alert("Hubo un problema con la conexión.");
    }
}