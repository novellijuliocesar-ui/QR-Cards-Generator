export function limpiarId(idRaw) {
    let idStr = String(idRaw);
    if (idStr.includes('.')) idStr = idStr.split('.')[0];
    return idStr;
}

export function mostrarMensaje(id, texto, tipo = 'info', duracion = 3000) {
    const msg = document.getElementById(id);
    if (!msg) return;
    msg.textContent = texto;
    msg.className = `message message-${tipo}`;
    msg.style.display = 'block';
    if (duracion > 0) {
        setTimeout(() => { msg.style.display = 'none'; }, duracion);
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

export function generarQR(texto, width = 200, margin = 1) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, texto, { width, margin }, (error) => {
            if (error) reject(error);
            else resolve(canvas);
        });
    });
}
