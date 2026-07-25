import { limpiarId, mostrarMensaje } from './utils.js';

// ========== GESTOR DE EXCEL ==========

export class ExcelLoader {
    constructor() {
        this.datos = [];
        this.filtrados = [];
        this.estaCargando = false;
        this.rutaBase = this._detectarRutaBase();
    }

    /**
     * Detecta automáticamente la ruta base de la aplicación
     */
    _detectarRutaBase() {
        const path = window.location.pathname;
        if (path.includes('/QR-Cards-Generator/')) {
            return '/QR-Cards-Generator/';
        }
        // Si estamos en la raíz
        if (path === '/' || path === '/index.html') {
            return '/';
        }
        // Si estamos en una subcarpeta
        const match = path.match(/^(.+\/)[^\/]+$/);
        if (match) {
            return match[1];
        }
        return './';
    }

    /**
     * Carga el archivo Excel
     */
    async cargar(ruta = null) {
        if (this.estaCargando) return;
        this.estaCargando = true;

        try {
            // Si no se especifica ruta, usar la detectada automáticamente
            if (!ruta) {
                ruta = `${this.rutaBase}data/DOC-20251215-WA0003.xlsx`;
            }

            console.log('[ExcelLoader] Intentando cargar desde:', ruta);
            mostrarMensaje('📂 Cargando archivo Excel...', 'info', 0);
            
            const response = await fetch(ruta);
            
            if (!response.ok) {
                // Si falla, intentar con otra ruta
                console.warn('[ExcelLoader] Falló la ruta primaria, intentando alternativa...');
                
                // Intentar con diferentes variaciones de ruta
                const rutasAlternativas = [
                    './data/DOC-20251215-WA0003.xlsx',
                    './DOC-20251215-WA0003.xlsx',
                    '../data/DOC-20251215-WA0003.xlsx',
                    'data/DOC-20251215-WA0003.xlsx',
                    '/data/DOC-20251215-WA0003.xlsx'
                ];
                
                for (const altRuta of rutasAlternativas) {
                    try {
                        console.log('[ExcelLoader] Probando ruta alternativa:', altRuta);
                        const altResponse = await fetch(altRuta);
                        if (altResponse.ok) {
                            const data = await altResponse.arrayBuffer();
                            this.estaCargando = false;
                            return this._procesarExcel(data);
                        }
                    } catch (e) {
                        // Continuar con la siguiente ruta
                    }
                }
                
                throw new Error(`No se pudo cargar el archivo Excel en ninguna ruta. Verifica que el archivo existe en la carpeta /data/`);
            }

            const data = await response.arrayBuffer();
            this.estaCargando = false;
            return this._procesarExcel(data);

        } catch (error) {
            this.estaCargando = false;
            console.error('[ExcelLoader] Error detallado:', error);
            
            // Mostrar mensaje de error más informativo
            let mensajeError = '⚠️ Error al cargar el archivo Excel. ';
            if (error.message.includes('404')) {
                mensajeError += 'El archivo no se encuentra en la ruta esperada.';
            } else if (error.message.includes('CORS')) {
                mensajeError += 'Problema de permisos CORS.';
            } else {
                mensajeError += error.message;
            }
            
            mostrarMensaje(mensajeError, 'error', 5000);
            return [];
        }
    }

    /**
     * Procesa el archivo Excel y extrae los datos
     */
    _procesarExcel(data) {
        try {
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
            
            console.log(`[ExcelLoader] ✅ ${this.datos.length} activos cargados correctamente`);
            mostrarMensaje(`✅ ${this.datos.length} activos cargados correctamente`, 'success', 3000);
            return this.datos;

        } catch (error) {
            console.error('[ExcelLoader] Error al procesar el Excel:', error);
            mostrarMensaje('⚠️ Error al procesar el archivo Excel: ' + error.message, 'error', 5000);
            return [];
        }
    }

    /**
     * Filtra los datos según un término de búsqueda
     */
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

    /**
     * Obtiene un elemento por su índice original
     */
    obtenerPorIndice(indice) {
        if (isNaN(indice) || indice < 0 || indice >= this.datos.length) {
            return null;
        }
        return this.datos[indice];
    }

    /**
     * Obtiene todos los datos (usando filtro si existe)
     */
    obtenerDatos() {
        return this.filtrados.length > 0 ? this.filtrados : this.datos;
    }
}
