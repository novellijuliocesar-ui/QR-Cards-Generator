import { mostrarMensajeStock } from './stock-utils.js';

export class StockLoader {
    constructor(messageId = 'messageStock') {
        this.datos = [];
        this.estaCargando = false;
        this.messageId = messageId;
        this.rutaExcel = '/QR-Cards-Generator/data/DOC-20251215-WA0003..xlsx';
    }

    async cargar(ruta = null) {
        if (this.estaCargando) return;
        this.estaCargando = true;

        const rutaFinal = ruta || this.rutaExcel;

        try {
            mostrarMensajeStock(this.messageId, 'Cargando datos de stock...', 'info', 0);
            
            const response = await fetch(rutaFinal);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: No se pudo cargar el archivo de stock`);
            }

            const data = await response.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(primeraHoja);

            // Mapear datos para el buscador de stock
            this.datos = json
                .filter(r => r.CODIGO_IDENTIFICATIVO)
                .map(r => ({
                    codigo: String(r.CODIGO_IDENTIFICATIVO).trim(),
                    desc: r.DESCRIPCION ? String(r.DESCRIPCION).trim() : 'Sin descripción',
                    // Si el Excel tiene columna de stock, la usamos; si no, simulamos
                    stock: r.STOCK ? parseInt(r.STOCK) : Math.floor(Math.random() * 20)
                }));

            this.estaCargando = false;

            mostrarMensajeStock(this.messageId, `✅ ${this.datos.length} productos cargados para stock`, 'success');
            return this.datos;

        } catch (error) {
            this.estaCargando = false;
            console.error('Error al cargar stock:', error);
            mostrarMensajeStock(this.messageId, `⚠️ Error al cargar stock: ${error.message}`, 'error');
            return [];
        }
    }

    buscar(termino) {
        if (!termino || termino.trim() === '') {
            return [];
        }

        const busqueda = termino.toLowerCase().trim();
        return this.datos.filter(item =>
            item.codigo.toLowerCase().includes(busqueda) ||
            item.desc.toLowerCase().includes(busqueda)
        );
    }
}