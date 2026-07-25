import { limpiarId, mostrarMensaje } from './utils.js';

// ========== GESTOR DE EXCEL ==========

export class ExcelLoader {
    constructor() {
        this.datos = [];
        this.filtrados = [];
        this.estaCargando = false;
        this.datosDeEjemplo = this._generarDatosEjemplo();
    }

    _generarDatosEjemplo() {
        // Datos de ejemplo extraídos del archivo Excel
        return [
            { id: '162511', codigo: 'CD_SALLENT', desc: 'CENTRO DE DISTRIBUCIÓN SALLENT - STRADIVARIUS LOGÍSTICA' },
            { id: '162512', codigo: 'SISTEMAS LOGÍSTICOS', desc: 'SISTEMAS LOGÍSTICOS DE PRODUCCIÓN' },
            { id: '162513', codigo: 'INFRAESTRUCTURAS', desc: 'SISTEMAS DE INFRAESTRUCTURA' },
            { id: '162514', codigo: 'TALLER', desc: 'TALLER DE MANTENIMIENTO' },
            { id: '162515', codigo: 'ALMACEN', desc: 'ALMACÉN DE REPUESTOS' },
            { id: '182386', codigo: 'OFICINA TÉCNICA', desc: 'TRABAJOS OFICINA TÉCNICA' },
            { id: '193616', codigo: 'INSTALACION', desc: 'ARRANQUE Y PARADA INSTALACION' },
            { id: '162516', codigo: 'PAQUETERIA CAJAS', desc: 'TRANSPORTADORES PAQUETERÍA' },
            { id: '162517', codigo: 'PRENDA COLGADA', desc: 'TRANSPORTADORES PRENDA COLGADA' },
            { id: '162518', codigo: 'SILOS PAQUETERÍA', desc: 'TRANSELEVADORES PAQUETERÍA' },
            { id: '162519', codigo: 'SILOS DE PRENDA COLGADA', desc: 'TRANSELEVADORES PRENDA COLGADA' },
            { id: '162520', codigo: 'MULTISHUTTLE PAQUETERÍA', desc: 'MULTISHUTTLE PAQUETERÍA' },
            { id: '162521', codigo: 'MULTISHUTTLE PRENDA COLGADA', desc: 'MULTISHUTTLE PRENDA COLGADA' },
            { id: '162522', codigo: 'SORTER PAQUETERÍA', desc: 'CLASIFICADORES PAQUETERÍA' },
            { id: '162523', codigo: 'SORTER PRENDA COLGADA', desc: 'CLASIFICADORES PRENDA COLGADA' },
            { id: '162524', codigo: 'PAQUETERÍA PALETS', desc: 'TRANSPORTADORES PALETS' },
            { id: '162525', codigo: 'SILO PALETS', desc: 'TRANSELEVADORES PALETS' },
            { id: '178006', codigo: 'MAQUINAS AUXILIARES PAQUETERÍA', desc: 'MÁQUINAS AUXILIARES PAQUETERÍA' },
            { id: '178007', codigo: 'MAQUINAS AUXILIARES PRENDA COLGADA', desc: 'MÁQUINAS AUXILIARES PRENDA COLGADA' },
        ];
    }

    async cargar(ruta = null) {
        if (this.estaCargando) return;
        this.estaCargando = true;

        // Intentar cargar el Excel
        try {
            // Si no se especifica ruta, probar varias opciones
            const rutas = ruta ? [ruta] : [
                './data/DOC-20251215-WA0003.xlsx',
                '/QR-Cards-Generator/data/DOC-20251215-WA0003.xlsx',
                'data/DOC-20251215-WA0003.xlsx',
                './DOC-20251215-WA0003.xlsx',
                '/data/DOC-20251215-WA0003.xlsx'
            ];

            for (const testRuta of rutas) {
                try {
                    console.log('[ExcelLoader] Probando ruta:', testRuta);
                    const response = await fetch(testRuta);
                    if (response.ok) {
                        const data = await response.arrayBuffer();
                        this.estaCargando = false;
                        const resultado = this._procesarExcel(data);
                        if (resultado.length > 0) {
                            mostrarMensaje(`✅ ${resultado.length} activos cargados desde Excel`, 'success', 3000);
                            return resultado;
                        }
                    }
                } catch (e) {
                    console.warn('[ExcelLoader] Falló ruta:', testRuta, e.message);
                }
            }

            // Si no se pudo cargar el Excel, usar datos de ejemplo
            console.log('[ExcelLoader] Usando datos de ejemplo');
            this.datos = [...this.datosDeEjemplo];
            this.filtrados = [];
            this.estaCargando = false;
            mostrarMensaje(`⚠️ Usando datos de ejemplo (${this.datos.length} activos)`, 'info', 4000);
            return this.datos;

        } catch (error) {
            this.estaCargando = false;
            console.error('[ExcelLoader] Error:', error);
            
            // Usar datos de ejemplo
            this.datos = [...this.datosDeEjemplo];
            this.filtrados = [];
            mostrarMensaje(`⚠️ Usando datos de ejemplo (${this.datos.length} activos)`, 'info', 4000);
            return this.datos;
        }
    }

    _procesarExcel(data) {
        try {
            const workbook = XLSX.read(data, { type: 'array' });
            const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(primeraHoja);

            const datos = json
                .filter(r => r.ID_ACTIVO_ARBOL && r.CODIGO_IDENTIFICATIVO)
                .map(r => ({
                    id: limpiarId(r.ID_ACTIVO_ARBOL),
                    codigo: String(r.CODIGO_IDENTIFICATIVO).trim(),
                    desc: r.DESCRIPCION ? String(r.DESCRIPCION).trim() : 'Sin descripción'
                }));

            if (datos.length > 0) {
                this.datos = datos;
                this.filtrados = [];
                return datos;
            }
            return [];

        } catch (error) {
            console.error('[ExcelLoader] Error procesando Excel:', error);
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
