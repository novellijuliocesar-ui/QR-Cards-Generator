// ========== UTILIDADES PARA EL BUSCADOR DE STOCK ==========

export function mostrarMensajeStock(elementId, texto, tipo = 'info', duracion = 3000) {
    const msg = document.getElementById(elementId);
    if (!msg) return;
    
    msg.textContent = texto;
    msg.className = `message message-${tipo}`;
    msg.style.display = 'block';
    
    if (duracion > 0) {
        setTimeout(() => {
            msg.style.display = 'none';
        }, duracion);
    }
}

export function formatearCantidad(cantidad) {
    const num = parseInt(cantidad);
    if (isNaN(num)) return '0';
    return num.toLocaleString('es-ES');
}

export function getStockLevel(cantidad) {
    const num = parseInt(cantidad);
    if (isNaN(num) || num <= 0) return 'low';
    if (num <= 5) return 'medium';
    return 'high';
}