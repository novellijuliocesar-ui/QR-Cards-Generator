// ============================================================
//  MÓDULO BUSCADOR DE STOCK
// ============================================================

import { mostrarMensaje } from '../shared/utils.js';

let stockData = [];

const elements = {
    searchInput: document.getElementById('searchInputStock'),
    searchBtn: document.getElementById('searchStockBtn'),
    resultsContainer: document.getElementById('resultsContainerStock'),
    resultsList: document.getElementById('stockResultsList'),
    loading: document.getElementById('loadingStock'),
    messageId: 'messageStock'
};

export async function initStock() {
    await cargarExcel();
    setupEventListeners();
}

async function cargarExcel() {
    mostrarMensaje(elements.messageId, 'Cargando archivo de stock...', 'info', 0);
    try {
        const response = await fetch('/mi-app-qr/data/Materiales Almacen.xlsx');
        if (!response.ok) throw new Error(`HTTP ${response.status}: Archivo no encontrado`);
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        stockData = json.map(r => ({
            codigo: String(r.CODIGO || r.CODIGO_IDENTIFICATIVO || '').trim(),
            desc: String(r.DESCRIPCION || r.DESC || '').trim(),
            stock: parseInt(r.STOCK || r.CANTIDAD || 0) || 0
        }));
        mostrarMensaje(elements.messageId, `✅ ${stockData.length} productos cargados`, 'success');
        console.log('Stock cargado:', stockData);
    } catch (e) {
        console.error('Error Stock:', e);
        mostrarMensaje(elements.messageId, `⚠️ Error: ${e.message}. Asegúrate de que el archivo existe en /data/`, 'error');
    }
}

function setupEventListeners() {
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

function handleSearch() {
    const term = elements.searchInput.value.trim();
    if (!term) {
        mostrarMensaje(elements.messageId, '📝 Escribe un término de búsqueda', 'info');
        elements.resultsContainer.classList.remove('visible');
        return;
    }

    elements.loading.style.display = 'block';
    elements.resultsContainer.classList.remove('visible');

    setTimeout(() => {
        const results = stockData.filter(item =>
            item.codigo.toLowerCase().includes(term.toLowerCase()) ||
            item.desc.toLowerCase().includes(term.toLowerCase())
        );
        mostrarResultados(results);
        elements.loading.style.display = 'none';
        if (results.length === 0) {
            mostrarMensaje(elements.messageId, `🔍 No se encontraron productos con "${term}"`, 'info');
        } else {
            mostrarMensaje(elements.messageId, `✅ ${results.length} productos encontrados`, 'success');
        }
    }, 300);
}

function mostrarResultados(results) {
    const list = elements.resultsList;
    if (results.length === 0) {
        list.innerHTML = `<div class="stock-not-found"><span class="icon">🔍</span><p>No se encontraron productos</p></div>`;
        elements.resultsContainer.classList.add('visible');
        return;
    }

    list.innerHTML = results.map(item => {
        const stockClass = item.stock <= 0 ? 'low' : (item.stock <= 5 ? 'medium' : '');
        const stockLabel = item.stock <= 0 ? '❌ Agotado' : (item.stock <= 5 ? '⚠️ Bajo' : '✓ Stock');
        return `
            <div class="stock-item">
                <span class="code">${item.codigo}</span>
                <span class="desc">${item.desc}</span>
                <span class="stock-qty ${stockClass}">${item.stock} ${stockLabel}</span>
            </div>
        `;
    }).join('');

    elements.resultsContainer.classList.add('visible');
}
