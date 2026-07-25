import { mostrarMensaje, debounce } from './utils.js';

// ========== FUNCIÓN DE NORMALIZACIÓN DE TEXTO =========

/**
 * Normaliza un texto para búsqueda:
 * - Convierte a minúsculas
 * - Elimina tildes
 * - Elimina caracteres especiales
 */
function normalizarTexto(texto) {
    if (!texto) return '';
    
    return String(texto)
        .toLowerCase()
        // Eliminar tildes
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Eliminar caracteres especiales (conservar letras, números y espacios)
        .replace(/[^a-z0-9\s]/g, ' ')
        // Eliminar espacios múltiples
        .replace(/\s+/g, ' ')
        .trim();
}

// ========== DATOS DE EJEMPLO (FALLBACK) ==========

const DATOS_EJEMPLO = [
    {
        ubicacion: 'S1/A1/P1/H1/D1/F1',
        referencia: '45837',
        refFabricante: '82014647-00001',
        descripcion: 'Motor-reductor engranaje. cilindricos R47DRS80M4BE2',
        clasificacion: 'MOTORES',
        tipoUnidad: 'UD.',
        cantidad: 2
    },
    {
        ubicacion: 'S1/A1/P1/H1/D2/F1',
        referencia: '45838',
        refFabricante: '82013047-00001',
        descripcion: 'Motor-reductor engranaje. cilindricos R47DRS90M4BE2/Z',
        clasificacion: 'MOTORES',
        tipoUnidad: 'UD.',
        cantidad: 1
    },
    {
        ubicacion: 'S1/A1/P1/H1/D4/F1',
        referencia: '21034',
        refFabricante: '306865',
        descripcion: 'MOTORREDUCTOR R67 DT90L4 1,5 KW 1410/27 REV/MIN',
        clasificacion: 'MOTORES',
        tipoUnidad: 'UD.',
        cantidad: 1
    },
    {
        ubicacion: 'S1/A1/P1/H1/D5/F1',
        referencia: '45464',
        refFabricante: 'K47 DT90L4/BMG/H12',
        descripcion: 'MOTOR CADENA',
        clasificacion: 'MOTORES',
        tipoUnidad: 'UD.',
        cantidad: 1
    },
    {
        ubicacion: 'S1/A1/P1/H1/D6/F1',
        referencia: '21194',
        refFabricante: '305620',
        descripcion: 'MOTORREDUCTOR (TELESCOPIO) 11-00140',
        clasificacion: 'MOTORES',
        tipoUnidad: 'UD.',
        cantidad: 1
    },
    {
        ubicacion: 'S1/A1/P2/H1/D1/F1',
        referencia: '45835',
        refFabricante: '82029847-00001',
        descripcion: 'Motorreductor:SA47TDRS80S4BGE',
        clasificacion: 'MOTORES',
        tipoUnidad: 'UD.',
        cantidad: 1
    },
    {
        ubicacion: 'S1/A1/P2/H1/D3/F1',
        referencia: '45832',
        refFabricante: '82052347-00001',
        descripcion: 'Motorreductor:SF47DRS80M4BE2M',
        clasificacion: 'MOTORES',
        tipoUnidad: 'UD.',
        cantidad: 1
    },
    {
        ubicacion: 'S1/A1/P2/H1/D4/F1',
        referencia: '45831',
        refFabricante: '82052647-00001',
        descripcion: 'Motorreductor:SF47DRS80M4BE2M',
        clasificacion: 'MOTORES',
        tipoUnidad: 'UD.',
        cantidad: 1
    },
    {
        ubicacion: 'S1/A1/P2/H1/D5/F1',
        referencia: '16885',
        refFabricante: '85093638',
        descripcion: 'MOTORREDUCTOR SA47/T DRN80M4/BE1 M1A 0,75KW 1440/133 RPM',
        clasificacion: 'MOTORES',
        tipoUnidad: 'UD.',
        cantidad: 1
    },
    {
        ubicacion: 'S1/A10/P1/H1/D1/F1',
        referencia: '8390',
        refFabricante: '00197003',
        descripcion: 'CAUTIVO - RODILLO 50X650mm - ACANALADO',
        clasificacion: 'SUMINISTROS INDUSTRIALES',
        tipoUnidad: 'UD.',
        cantidad: 49
    },
    {
        ubicacion: 'S1/A10/P2/H1/D1/F1',
        referencia: '8694',
        refFabricante: '00038614',
        descripcion: 'CAUTIVO - RODILLO 50X1.5X650mm SK.11',
        clasificacion: 'SUMINISTROS INDUSTRIALES',
        tipoUnidad: 'UD.',
        cantidad: 131
    },
    {
        ubicacion: 'S1/A10/P3/H1/D1/F1',
        referencia: '47140',
        refFabricante: '00198413',
        descripcion: 'CAUTIVO - RODILLO CONICO NB=450 COMPLETO',
        clasificacion: 'SUMINISTROS INDUSTRIALES',
        tipoUnidad: 'UD.',
        cantidad: 70
    }
];

// ========== GESTOR DE REPUESTOS (STOCK) ==========

class StockLoader {
    constructor() {
        this.datos = [];
        this.filtrados = [];
        this.estaCargando = false;
        this.categorias = [];
        this.usaEjemplo = false;
        // Datos normalizados para búsqueda rápida
        this.datosNormalizados = [];
    }

    async cargar(ruta = './data/Almacen.xlsx') {
        if (this.estaCargando) return;
        this.estaCargando = true;

        try {
            const rutas = [
                ruta,
                '/QR-Cards-Generator/data/Almacen.xlsx',
                './data/Almacen.xlsx',
                'data/Almacen.xlsx',
                '../data/Almacen.xlsx'
            ];

            let dataCargada = null;

            for (const testRuta of rutas) {
                try {
                    console.log('[StockLoader] Probando ruta:', testRuta);
                    const response = await fetch(testRuta);
                    if (response.ok) {
                        const data = await response.arrayBuffer();
                        dataCargada = data;
                        console.log('[StockLoader] ✅ Cargado desde:', testRuta);
                        break;
                    }
                } catch (e) {
                    console.warn('[StockLoader] Falló ruta:', testRuta);
                }
            }

            if (!dataCargada) {
                console.warn('[StockLoader] ⚠️ No se pudo cargar el Excel. Usando datos de ejemplo.');
                this.usaEjemplo = true;
                this.datos = [...DATOS_EJEMPLO];
                this._normalizarDatos();
                this.categorias = [...new Set(this.datos.map(item => item.clasificacion))].sort();
                this.estaCargando = false;
                mostrarMensaje(`⚠️ Usando ${this.datos.length} datos de ejemplo (Excel no encontrado)`, 'info', 5000);
                return this.datos;
            }

            // LEER EL EXCEL FILA POR FILA
            const workbook = XLSX.read(dataCargada, { type: 'array' });
            const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
            
            const filas = XLSX.utils.sheet_to_json(primeraHoja, { 
                defval: '',
                header: 1
            });

            console.log('[StockLoader] 📊 Total de filas en Excel:', filas.length);

            if (filas.length < 2) {
                console.warn('[StockLoader] ⚠️ El archivo tiene menos de 2 filas. Usando datos de ejemplo.');
                this.usaEjemplo = true;
                this.datos = [...DATOS_EJEMPLO];
                this._normalizarDatos();
                this.categorias = [...new Set(this.datos.map(item => item.clasificacion))].sort();
                this.estaCargando = false;
                mostrarMensaje(`⚠️ Usando ${this.datos.length} datos de ejemplo (archivo sin datos)`, 'info', 5000);
                return this.datos;
            }

            // Buscar la fila de cabeceras
            let cabeceras = null;
            let inicioDatos = 0;

            const primeraFila = filas[0] || [];
            const esTitulo = primeraFila.some(celda => 
                typeof celda === 'string' && 
                (celda.includes('Listado') || celda.includes('mapa') || celda.includes('almacén'))
            );

            if (esTitulo) {
                cabeceras = filas[1] || [];
                inicioDatos = 2;
                console.log('[StockLoader] 📋 Cabeceras encontradas en fila 2:', cabeceras);
            } else {
                cabeceras = filas[0] || [];
                inicioDatos = 1;
                console.log('[StockLoader] 📋 Cabeceras encontradas en fila 1:', cabeceras);
            }

            // Mapeo de índices de columna
            const idxUbicacion = cabeceras.indexOf('Ubicación');
            const idxReferencia = cabeceras.indexOf('Referencia');
            const idxRefFabricante = cabeceras.indexOf('Referencia Fabricante');
            const idxDescripcion = cabeceras.indexOf('Descripción');
            const idxClasificacion = cabeceras.indexOf('Clasificación');
            const idxTipoUnidad = cabeceras.indexOf('Tipo Unidad');
            const idxCantidad = cabeceras.indexOf('Cantidad');

            console.log('[StockLoader] 📌 Índices - Ubicación:', idxUbicacion, 'Referencia:', idxReferencia, 'Descripción:', idxDescripcion);

            // Procesar datos
            this.datos = [];

            for (let i = inicioDatos; i < filas.length; i++) {
                const row = filas[i];
                if (!row || row.length === 0) continue;

                const ubicacion = idxUbicacion >= 0 ? String(row[idxUbicacion] || '').trim() : '';
                const referencia = idxReferencia >= 0 ? String(row[idxReferencia] || '').trim() : '';
                const refFabricante = idxRefFabricante >= 0 ? String(row[idxRefFabricante] || '').trim() : '';
                const descripcion = idxDescripcion >= 0 ? String(row[idxDescripcion] || '').trim() : '';
                const clasificacion = idxClasificacion >= 0 ? String(row[idxClasificacion] || '').trim() : '';
                const tipoUnidad = idxTipoUnidad >= 0 ? String(row[idxTipoUnidad] || '').trim() : 'UD.';
                const cantidad = idxCantidad >= 0 ? parseFloat(row[idxCantidad]) || 0 : 0;

                if (referencia || descripcion) {
                    this.datos.push({
                        ubicacion: ubicacion,
                        referencia: referencia,
                        refFabricante: refFabricante,
                        descripcion: descripcion,
                        clasificacion: clasificacion,
                        tipoUnidad: tipoUnidad,
                        cantidad: cantidad
                    });
                }
            }

            if (this.datos.length === 0) {
                console.warn('[StockLoader] ⚠️ No se procesaron datos del Excel. Usando datos de ejemplo.');
                this.usaEjemplo = true;
                this.datos = [...DATOS_EJEMPLO];
                this._normalizarDatos();
                mostrarMensaje(`⚠️ Usando ${this.datos.length} datos de ejemplo (Excel vacío)`, 'info', 5000);
            } else {
                this._normalizarDatos();
                console.log(`[StockLoader] ✅ ${this.datos.length} repuestos procesados desde Excel`);
                mostrarMensaje(`✅ ${this.datos.length} repuestos cargados`, 'success', 3000);
            }

            this.categorias = [...new Set(this.datos.map(item => item.clasificacion).filter(c => c))].sort();
            this.estaCargando = false;
            return this.datos;

        } catch (error) {
            console.error('[StockLoader] ❌ Error:', error);
            this.usaEjemplo = true;
            this.datos = [...DATOS_EJEMPLO];
            this._normalizarDatos();
            this.categorias = [...new Set(this.datos.map(item => item.clasificacion))].sort();
            this.estaCargando = false;
            mostrarMensaje(`⚠️ Usando ${this.datos.length} datos de ejemplo (error: ${error.message})`, 'info', 5000);
            return this.datos;
        }
    }

    /**
     * Normaliza todos los textos de los datos para búsqueda
     */
    _normalizarDatos() {
        this.datosNormalizados = this.datos.map(item => ({
            ...item,
            _normalizado: {
                ubicacion: normalizarTexto(item.ubicacion),
                referencia: normalizarTexto(item.referencia),
                refFabricante: normalizarTexto(item.refFabricante),
                descripcion: normalizarTexto(item.descripcion),
                clasificacion: normalizarTexto(item.clasificacion),
                // Guardamos el texto original para mostrar en los resultados
                _original: item
            }
        }));
    }

    /**
     * Busca y filtra los datos según los criterios (búsqueda insensible a acentos y mayúsculas)
     */
    buscar(termino, categoria = '') {
        if (!termino && !categoria) {
            this.filtrados = [];
            return [];
        }

        const busquedaNormalizada = normalizarTexto(termino);
        const categoriaNormalizada = normalizarTexto(categoria);

        this.filtrados = this.datosNormalizados
            .filter(item => {
                const norm = item._normalizado;

                // Si hay término de búsqueda, buscar en todos los campos
                if (busquedaNormalizada) {
                    const cumpleBusqueda = 
                        norm.referencia.includes(busquedaNormalizada) ||
                        norm.refFabricante.includes(busquedaNormalizada) ||
                        norm.descripcion.includes(busquedaNormalizada) ||
                        norm.ubicacion.includes(busquedaNormalizada) ||
                        norm.clasificacion.includes(busquedaNormalizada);

                    if (!cumpleBusqueda) return false;
                }

                // Si hay categoría, filtrar
                if (categoriaNormalizada) {
                    if (norm.clasificacion !== categoriaNormalizada) return false;
                }

                return true;
            })
            .map(item => item._original); // Devolver los datos originales

        return this.filtrados;
    }

    obtenerDatos() {
        return this.filtrados;
    }

    obtenerCategorias() {
        return this.categorias;
    }
}

// ========== CONTROLADOR DE STOCK ==========

class StockApp {
    constructor() {
        this.loader = new StockLoader();
        this.datos = [];
        this.filtrados = [];
        this.busquedaRealizada = false;

        this.container = document.getElementById('stockPage');
        this.elements = {};
        this.messageEl = null;

        this.init();
    }

    async init() {
        this._buildUI();
        this._setupEventListeners();
        await this._cargarDatos();
        this._poblarFiltros();
    }

    _buildUI() {
        this.container.innerHTML = `
            <div class="stock-header">
                <h1>🔧 Búsqueda de Repuestos</h1>
                <p>Consulta el stock del almacén</p>
            </div>

            <div id="stockMessage" class="message" role="alert" aria-live="polite"></div>

            <div class="search-section">
                <label for="stockSearchInput">🔍 Buscar</label>
                <input 
                    type="text" 
                    id="stockSearchInput" 
                    placeholder="Buscar por referencia, fabricante, descripción o ubicación..." 
                    autocomplete="off"
                >
            </div>

            <div class="filters-section">
                <div class="filter-group">
                    <label for="categoryFilter">🏷️ Clasificación</label>
                    <select id="categoryFilter">
                        <option value="">-- Todas --</option>
                    </select>
                </div>
            </div>

            <button class="btn btn-primary" id="searchBtn">
                🔍 Buscar Repuestos
            </button>

            <div id="resultsContainer" style="display: none;">
                <div class="results-header">
                    <span id="resultsCount">0 resultados</span>
                    <button class="btn btn-secondary btn-small" id="clearResultsBtn">
                        ✖ Limpiar
                    </button>
                </div>
                <div class="stock-table-container" id="tableContainer">
                    <table class="stock-table">
                        <thead>
                            <tr>
                                <th>📍 Ubicación</th>
                                <th>Referencia</th>
                                <th>Fabricante</th>
                                <th>Descripción</th>
                                <th>Clasificación</th>
                                <th>Cantidad</th>
                            </tr>
                        </thead>
                        <tbody id="stockTableBody">
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                                    Introduce un criterio de búsqueda y pulsa "Buscar"
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.elements = {
            searchInput: this.container.querySelector('#stockSearchInput'),
            categoryFilter: this.container.querySelector('#categoryFilter'),
            searchBtn: this.container.querySelector('#searchBtn'),
            clearBtn: this.container.querySelector('#clearResultsBtn'),
            resultsContainer: this.container.querySelector('#resultsContainer'),
            tableBody: this.container.querySelector('#stockTableBody'),
            resultsCount: this.container.querySelector('#resultsCount'),
        };
        this.messageEl = this.container.querySelector('#stockMessage');
    }

    _setupEventListeners() {
        this.elements.searchBtn.addEventListener('click', () => this._buscar());

        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this._buscar();
            }
        });

        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => this._limpiar());
        }
    }

    async _cargarDatos() {
        this._showMessage('📂 Cargando datos de repuestos...', 'info', 0);
        this.datos = await this.loader.cargar();
        if (this.loader.usaEjemplo) {
            this._showMessage(`⚠️ Usando datos de ejemplo (${this.datos.length} repuestos)`, 'info', 4000);
        }
    }

    _poblarFiltros() {
        const select = this.elements.categoryFilter;
        const categorias = this.loader.obtenerCategorias();
        
        select.innerHTML = '<option value="">-- Todas --</option>';
        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });
    }

    _buscar() {
        const termino = this.elements.searchInput.value;
        const categoria = this.elements.categoryFilter.value;

        if (!termino && !categoria) {
            this._showMessage('⚠️ Introduce un término de búsqueda o selecciona una categoría', 'info', 3000);
            return;
        }

        this.filtrados = this.loader.buscar(termino, categoria);
        this.busquedaRealizada = true;
        this._renderResultados();
    }

    _renderResultados() {
        const container = this.elements.resultsContainer;
        const tbody = this.elements.tableBody;
        const count = this.elements.resultsCount;

        container.style.display = 'block';

        if (this.filtrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                        🔍 No se encontraron resultados
                        <br><span style="font-size: 0.8rem;">Prueba con otros términos de búsqueda</span>
                    </td>
                </tr>
            `;
            count.textContent = '0 resultados';
            return;
        }

        tbody.innerHTML = this.filtrados.map(item => {
            const cantidad = item.cantidad;
            const stockClass = cantidad > 10 ? 'high' : cantidad > 5 ? 'medium' : 'low';
            const unidad = item.tipoUnidad || 'UD.';

            return `
                <tr>
                    <td><code style="font-size: 0.7rem; background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${item.ubicacion}</code></td>
                    <td><strong>${item.referencia}</strong></td>
                    <td style="font-size: 0.75rem; color: #666;">${item.refFabricante}</td>
                    <td>${item.descripcion.substring(0, 60)}${item.descripcion.length > 60 ? '...' : ''}</td>
                    <td><span style="font-size: 0.75rem; background: #e8e8e8; padding: 2px 8px; border-radius: 12px;">${item.clasificacion}</span></td>
                    <td><span class="stock-badge ${stockClass}">${cantidad} ${unidad}</span></td>
                </tr>
            `;
        }).join('');

        count.textContent = `${this.filtrados.length} resultados`;
        this._showMessage(`✅ ${this.filtrados.length} repuestos encontrados`, 'success', 2000);
    }

    _limpiar() {
        this.filtrados = [];
        this.busquedaRealizada = false;
        this.elements.searchInput.value = '';
        this.elements.categoryFilter.value = '';
        this.elements.resultsContainer.style.display = 'none';
        this._showMessage('🔄 Búsqueda limpiada', 'info', 2000);
    }

    _showMessage(texto, tipo = 'info', duration = 3000) {
        if (!this.messageEl) return;
        this.messageEl.textContent = texto;
        this.messageEl.className = `message message-${tipo}`;
        this.messageEl.style.display = 'block';
        
        if (duration > 0) {
            setTimeout(() => {
                this.messageEl.style.display = 'none';
            }, duration);
        }
    }
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.stockApp = new StockApp();
    }, 150);
});
