// ========== UTILIDADES PARA EL GENERADOR QR ==========

export function limpiarId(idRaw) {
    const idStr = String(idRaw);
    return idStr.includes('.') ? idStr.split('.')[0] : idStr;
}

export function mostrarMensaje(elementId, texto, tipo = 'info', duracion = 3000) {
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

export function sanitizarNombre(nombre) {
    return nombre.replace(/[<>:"/\\|?*.]/g, '_');
}

export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}