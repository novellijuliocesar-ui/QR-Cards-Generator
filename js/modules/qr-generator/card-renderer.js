import { QRGenerator } from './qr-generator.js';

export class CardRenderer {
    static async generarImagen(id, codigo, descripcion) {
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
                this._dibujarRectRedondeado(ctx, 200 - idWidth/2, 20, idWidth, 48, 24);
                ctx.fill();
                ctx.fillStyle = '#1a1a2e';
                ctx.fillText(idTexto, 200, 52);

                // QR
                const qrCanvas = await QRGenerator.generarQR(id, 200, 1);
                ctx.fillStyle = '#FFFFFF';
                this._dibujarRectRedondeado(ctx, 200 - 110, 72, 220, 220, 20);
                ctx.fill();
                ctx.drawImage(qrCanvas, 200 - 100, 82, 200, 200);

                // Código
                const codTexto = String(codigo);
                ctx.font = 'bold 15px "Courier New", monospace';
                const codWidth = ctx.measureText(codTexto).width + 50;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this._dibujarRectRedondeado(ctx, 200 - codWidth/2, 305, codWidth, 40, 20);
                ctx.fill();
                ctx.fillStyle = '#1a1a2e';
                ctx.fillText(codTexto, 200, 333);

                // Descripción
                const descTexto = descripcion || 'Sin descripción';
                ctx.font = '12px "Segoe UI", monospace';
                const maxWidth = 300;
                const lines = this._dividirTexto(ctx, descTexto, maxWidth);
                const lineHeight = 20;
                const descHeight = (lines.length * lineHeight) + 24;
                const descY = 365;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                this._dibujarRectRedondeado(ctx, 50, descY, 300, descHeight, 16);
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

    static _dibujarRectRedondeado(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    static _dividirTexto(ctx, texto, maxWidth) {
        const lines = [];
        let currentLine = '';
        ctx.font = '12px "Segoe UI", monospace';

        for (const char of texto) {
            const testLine = currentLine + char;
            if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }
}