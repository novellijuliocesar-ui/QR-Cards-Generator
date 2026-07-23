import { mostrarMensaje } from '../shared/utils.js';

// ========== MÓDULO BUSCADOR DE STOCK ==========

const elements = {
    messageId: 'messageStock',
    loading: document.getElementById('loadingStock')
};

export async function initStock() {
    await cargarArchivoStock();
}

async function cargarArchivoStock() {
    mostrarMensaje(elements.messageId, '📦 Cargando archivo de stock...', 'info', 0);
    
    try {
        const response = await fetch('/QR-Cards-Generator/data/Materiales Almacen.xlsx');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: El archivo no se encontró`);
        }
        
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(primeraHoja);
        
        // Mostrar información del archivo
        const numFilas = json.length;
        const columnas = Object.keys(json[0] || {}).join(', ');
        
        mostrarMensaje(
            elements.messageId, 
            `✅ Archivo "Materiales Almacen.xlsx" cargado correctamente. ${numFilas} filas, columnas: ${columnas}`,
            'success',
            5000
        );
        
        console.log('📊 Datos del stock:', json);
        
    } catch (error) {
        console.error('Error al cargar stock:', error);
        mostrarMensaje(
            elements.messageId, 
            `⚠️ Error al cargar "Materiales Almacen.xlsx": ${error.message}. Asegúrate de que el archivo existe en la carpeta /data/`,
            'error',
            6000
        );
    }
}
