// ========== GENERADOR DE QR ==========

export class QRGenerator {
    /**
     * Genera un canvas con el código QR
     */
    static async generarQR(texto, width = 200, margin = 1) {
        try {
            const canvas = document.createElement('canvas');
            await QRCode.toCanvas(canvas, texto, { width, margin });
            return canvas;
        } catch (error) {
            console.error('Error generando QR:', error);
            throw new Error('No se pudo generar el código QR');
        }
    }
}