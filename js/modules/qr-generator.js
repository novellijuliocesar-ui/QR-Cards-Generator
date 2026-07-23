// ============================================================
//  MÓDULO GENERADOR QR
// ============================================================

import { mostrarMensaje, limpiarId, generarQR, sanitizarNombre } from '../shared/utils.js';

let excelData = [];
let filteredData = [];
let currentItem = null;
let cachedImage = null;

const elements = {
    searchInput: document.getElementById('searchInputQR'),
    activoSelect: document.getElementById('activoSelectQR'),
    generateBtn: document.getElementById('generateBtnQR'),
    downloadBtn: document.getElementById('downloadCardBtnQR'),
    shareBtn: document.getElementById('shareCardBtnQR'),
    cardContainer: document.getElementById('cardContainerQR'),
    cardNumber: document.getElementById('cardNumberQR'),
    cardQr: document.getElementById('cardQrQR'),
    cardCode: document.getElementById('cardCodeQR'),
    cardDesc: document.getElementById('cardDescQR'),
    loading: document.getElementById('loadingQR'),
    messageId: 'messageQR'
};

export async function initQR() {
    await cargarExcel();
    setupEventListeners();
}

async function cargarExcel() {
    mostrarMensaje(elements.messageId, 'Cargando archivo QR...', 'info', 0);
    try {
        const response = await fetch('/QR-Cards-Generator/data/DOC-20251215-WA0003..xlsx');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        excelData = json
            .filter(r => r.ID_ACTIVO_ARBOL && r.CODIGO_IDENTIFICATIVO)
            .map(r => ({
                id: limpiarId(r.ID_ACTIVO_ARBOL),
                codigo: String(r.CODIGO_IDENTIFICATIVO).trim(),
                desc: r.DESCRIPCION ? String(r.DESCRIPCION).trim() : 'Sin descripción'
            }));
        filteredData = [];
        poblarSelect();
        mostrarMensaje(elements.messageId, `✅ ${excelData.length} activos cargados`, 'success');
    } catch (e) {
        console.error('Error QR:', e);
        mostrarMensaje(elements.messageId, `⚠️ Error: ${e.message}`, 'error');
    }
}

function poblarSelect() {
    const data = filteredData.length > 0 ? filteredData : excelData;
    const select = elements.activoSelect;
    select.innerHTML = '<option value="">-- Seleccionar --</option>';
    data.forEach((item) => {
        const opt = document.createElement('option');
        const realIndex = excelData.findIndex(d => d.id === item.id && d.codigo === item.codigo);
        opt.value = realIndex;
        const label = item.desc.length > 50 ? item.desc.substring(0, 50) + '...' : item.desc;
        opt.textContent = `${item.codigo} - ${label}`;
        select.appendChild(opt);
    });
}

function setupEventListeners() {
    elements.searchInput.addEventListener('input', handleSearch);
    elements.activoSelect.addEventListener('change', handleSelect);
    elements.generateBtn.addEventListener('click', handleGenerate);
    elements.downloadBtn.addEventListener('click', handleDownload);
    elements.shareBtn.addEventListener('click', handleShare);
}

function handleSearch() {
    const term = this.value.toLowerCase().trim();
    if (!term) { filteredData = []; poblarSelect(); return; }
    filteredData = excelData.filter(item =>
        item.id === term || item.id.includes(term) ||
        item.codigo.toLowerCase().includes(term) ||
        item.desc.toLowerCase().includes(term)
    );
    poblarSelect();
    if (filteredData.length === 0) {
        mostrarMensaje(elements.messageId, '🔍 No se encontraron resultados', 'info');
    } else {
        mostrarMensaje(elements.messageId, `🔍 ${filteredData.length} resultados`, 'success');
    }
}

function handleSelect() {
    const index = parseInt(this.value);
    if (isNaN(index) || index < 0 || !excelData[index]) { currentItem = null; return; }
    currentItem = excelData[index];
    mostrarMensaje(elements.messageId, `✅ Seleccionado: ${currentItem.codigo}`, 'success');
}

async function handleGenerate() {
    if (!currentItem) {
        mostrarMensaje(elements.messageId, '❌ Selecciona un activo', 'error');
        return;
    }
    elements.loading.style.display = 'block';
    elements.cardContainer.classList.remove('visible');
    try {
        const { id, codigo, desc } = currentItem;
        await mostrarTarjeta(id, codigo, desc);
        cachedImage = await generarImagenTarjeta(id, codigo, desc);
        mostrarMensaje(elements.messageId, '✅ Tarjeta generada', 'success');
    } catch (error) {
        console.error(error);
        mostrarMensaje(elements.messageId, '❌ Error al generar', 'error');
    } finally {
        elements.loading.style.display = 'none';
    }
}

async function mostrarTarjeta(id, codigo, desc) {
    const container = elements.cardQr;
    container.innerHTML = '';
    const canvas = await generarQR(id, 200, 1);
    container.appendChild(canvas);
    elements.cardNumber.textContent = id;
    elements.cardCode.textContent = codigo;
    elements.cardDesc.textContent = desc || 'Sin descripción';
    elements.cardContainer.classList.add('visible');
}

async function generarImagenTarjeta(id, codigo, desc) {
    return new Promise(async (resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 540;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#F2C200';
            ctx.fillRect(0, 0, 400, 540);

            // ID
            const idTexto = String(id);
            ctx.font = 'bold 26px "Courier New", monospace';
            ctx.textAlign = 'center';
            const idWidth = ctx.measureText(idTexto).width + 50;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.moveTo(200 - idWidth / 2 + 24, 20);
            ctx.lineTo(200 + idWidth / 2 - 24, 20);
            ctx.quadraticCurveTo(200 + idWidth / 2, 20, 200 + idWidth / 2, 20 + 24);
            ctx.lineTo(200 + idWidth / 2, 20 + 48 - 24);
            ctx.quadraticCurveTo(200 + idWidth / 2, 20 + 48, 200 + idWidth / 2 - 24, 20 + 48);
            ctx.lineTo(200 - idWidth / 2 + 24, 20 + 48);
            ctx.quadraticCurveTo(200 - idWidth / 2, 20 + 48, 200 - idWidth / 2, 20 + 48 - 24);
            ctx.lineTo(200 - idWidth / 2, 20 + 24);
            ctx.quadraticCurveTo(200 - idWidth / 2, 20, 200 - idWidth / 2 + 24, 20);
            ctx.fill();
            ctx.fillStyle = '#1a1a2e';
            ctx.fillText(idTexto, 200, 52);

            // QR
            const qrCanvas = await generarQR(id, 200, 1);
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(200 - 110, 72);
            ctx.lineTo(200 + 110, 72);
            ctx.quadraticCurveTo(200 + 110, 72, 200 + 110, 72 + 20);
            ctx.lineTo(200 + 110, 72 + 200 + 20);
            ctx.quadraticCurveTo(200 + 110, 72 + 200 + 20, 200 + 110 - 20, 72 + 200 + 20);
            ctx.lineTo(200 - 110 + 20, 72 + 200 + 20);
            ctx.quadraticCurveTo(200 - 110, 72 + 200 + 20, 200 - 110, 72 + 200 + 20 - 20);
            ctx.lineTo(200 - 110, 72 + 20);
            ctx.quadraticCurveTo(200 - 110, 72, 200 - 110 + 20, 72);
            ctx.fill();
            ctx.drawImage(qrCanvas, 200 - 100, 82, 200, 200);

            // Código
            const codTexto = String(codigo);
            ctx.font = 'bold 15px "Courier New", monospace';
            const codWidth = ctx.measureText(codTexto).width + 50;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.moveTo(200 - codWidth / 2 + 20, 305);
            ctx.lineTo(200 + codWidth / 2 - 20, 305);
            ctx.quadraticCurveTo(200 + codWidth / 2, 305, 200 + codWidth / 2, 305 + 20);
            ctx.lineTo(200 + codWidth / 2, 305 + 40 - 20);
            ctx.quadraticCurveTo(200 + codWidth / 2, 305 + 40, 200 + codWidth / 2 - 20, 305 + 40);
            ctx.lineTo(200 - codWidth / 2 + 20, 305 + 40);
            ctx.quadraticCurveTo(200 - codWidth / 2, 305 + 40, 200 - codWidth / 2, 305 + 40 - 20);
            ctx.lineTo(200 - codWidth / 2, 305 + 20);
            ctx.quadraticCurveTo(200 - codWidth / 2, 305, 200 - codWidth / 2 + 20, 305);
            ctx.fill();
            ctx.fillStyle = '#1a1a2e';
            ctx.fillText(codTexto, 200, 333);

            // Descripción
            const descTexto = desc || 'Sin descripción';
            ctx.font = '12px "Segoe UI", monospace';
            const maxWidth = 300;
            let lines = [],
                currentLine = '';
            for (let char of descTexto) {
                let testLine = currentLine + char;
                if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = char;
                } else { currentLine = testLine; }
            }
            if (currentLine) lines.push(currentLine);
            const lineHeight = 20;
            const descHeight = (lines.length * lineHeight) + 24;
            const descY = 365;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.moveTo(50 + 16, descY);
            ctx.lineTo(350 - 16, descY);
            ctx.quadraticCurveTo(350, descY, 350, descY + 16);
            ctx.lineTo(350, descY + descHeight - 16);
            ctx.quadraticCurveTo(350, descY + descHeight, 350 - 16, descY + descHeight);
            ctx.lineTo(50 + 16, descY + descHeight);
            ctx.quadraticCurveTo(50, descY + descHeight, 50, descY + descHeight - 16);
            ctx.lineTo(50, descY + 16);
            ctx.quadraticCurveTo(50, descY, 50 + 16, descY);
            ctx.fill();
            ctx.fillStyle = '#1a1a2e';
            lines.forEach((line, i) => {
                ctx.fillText(line, 200, descY + 20 + (i * lineHeight));
            });

            resolve(canvas.toDataURL('image/png'));
        } catch (error) {
            reject(error);
        }
    });
}

function handleDownload() {
    if (!cachedImage || !currentItem) return;
    const link = document.createElement('a');
    link.download = `tarjeta-${sanitizarNombre(currentItem.codigo)}.png`;
    link.href = cachedImage;
    link.click();
    mostrarMensaje(elements.messageId, '📥 Descargada', 'success');
}

async function handleShare() {
    if (!cachedImage) return;
    try {
        const blob = await (await fetch(cachedImage)).blob();
        const file = new File([blob], 'tarjeta.png', { type: 'image/png' });
        if (navigator.share) {
            await navigator.share({ title: 'Tarjeta QR', files: [file] });
            mostrarMensaje(elements.messageId, '📤 Compartido', 'success');
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            mostrarMensaje(elements.messageId, '❌ Error al compartir', 'error');
        }
    }
}
