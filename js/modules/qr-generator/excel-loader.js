import { limpiarId, mostrarMensaje } from './qr-utils.js';

export class ExcelLoader {
    constructor(messageId = 'messageQR') {
        this.datos = [];
        this.filtrados = [];
        this.estaCargando = false;
        this.messageId = messageId;
    }

    async cargar(ruta = '/QR-Cards-Generator/data/DOC-20251215-WA0003..xlsx') {
        if (this.estaCargando) return;
        this.estaCargando = true;

        try {
            mostrarMensaje(this.messageId, 'Cargando archivo Excel...', 'info', 0);
            
            const response = await fetch(ruta);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: No se pudo cargar el archivo`);
            }

            const data = await response.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(primeraHoja);

            this.datos = json
                .filter(r => r.ID_ACTIVO_ARBOL && r.CODIGO_IDENTIFICATIVO)
                .map(r => ({
                    id: limpiarId(r.ID_ACTIVO_ARBOL),
                    codigo: String(r.CODIGO_IDENTIFICATIVO).trim(),
                    desc: r.DESCRIPCION ? String(r.DESCRIPCION).trim() : 'Sin descripción'
                }));

            this.filtrados = [];
            this.estaCargando = false;

            mostrarMensaje(this.messageId, `✅ ${this.datos.length} activos cargados correctamente`, 'success');
            return this.datos;

        } catch (error) {
            this.estaCargando = false;
            console.error('Error al cargar Excel:', error);
            mostrarMensaje(this.messageId, `⚠️ Error: ${error.message}`, 'error');
            return [];
        }
    }

    filtrar(termino) {
        if (!termino || termino.trim() === '') {
            this.filtrados = [];
            return this.datos;
        }

        const busqueda = termino.toLowerCase().trim();
        this.filtrados = this.datos.filter(item =>
            item.id === busqueda ||
            item.id.includes(busqueda) ||
            item.codigo.toLowerCase().includes(busqueda) ||
            item.desc.toLowerCase().includes(busqueda)
        );

        return this.filtrados;
    }

    obtenerPorIndice(indice) {
        if (isNaN(indice) || indice < 0 || indice >= this.datos.length) {
            return null;
        }
        return this.datos[indice];
    }

    obtenerDatos() {
        return this.filtrados.length > 0 ? this.filtrados : this.datos;
    }
}