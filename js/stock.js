import { mostrarMensaje, debounce } from './utils.js';

// ========== GESTOR DE REPUESTOS (STOCK) ==========

class StockLoader {
    constructor() {
        this.datos = [];
        this.filtrados = [];
        this.estaCargando = false;
        this.categorias = [];
    }

    /**
     * Carga el archivo Excel de Almacén
     */
    async cargar(ruta = './data/Almacen.xlsx') {
        if (this.estaCargando) return;
        this.estaCargando = true;

        try {
            // Intentar con diferentes rutas
            const rutas = [
                ruta,
                '/QR-Cards-Generator/data/Almacen.xlsx',
                './data/Almacen.xlsx',
                'data/Almacen.xlsx',
                '../data/Almacen.xlsx',
                './Almacen.xlsx',
                '/data/Almacen.xlsx'
            ];

            let dataCargada = null;
            let rutaExitosa = '';

            for (const testRuta of rutas) {
                try {
                    console.log('[StockLoader] Probando ruta:', testRuta);
                    const response = await fetch(testRuta);
                    if (response.ok) {
                        const data = await response.arrayBuffer();
                        dataCargada = data;
                        rutaExitosa = testRuta;
                        console.log('[StockLoader] ✅ Cargado desde:', testRuta);
                        break;
                    }
                } catch (e) {
                    console.warn('[StockLoader] Falló ruta:', testRuta, e.message);
                }
            }

            if (!dataCargada) {
                // Intentar con el nombre del archivo original (con doble punto)
                const rutasAlternativas = [
                    './data/DOC-20251215-WA0003..xlsx',
                    '/QR-Cards-Generator/data/DOC-20251215-WA0003..xlsx'
                ];
                
                for (const testRuta of rutasAlternativas) {
                    try {
                        console.log('[StockLoader] Probando ruta alternativa:', testRuta);
                        const response = await fetch(testRuta);
                        if (response.ok) {
                            const data = await response.arrayBuffer();
                            dataCargada = data;
                            rutaExitosa = testRuta;
                            console.log('[StockLoader] ✅ Cargado desde:', testRuta);
                            break;
                        }
                    } catch (e) {
                        console.warn('[StockLoader] Falló ruta:', testRuta);
                    }
                }
            }

            if (!dataCargada) {
                throw new Error('No se pudo cargar el archivo Almacen.xlsx. Verifica que el archivo existe en /data/');
            }

            const workbook = XLSX.read(dataCargada, { type: 'array' });
            const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(primeraHoja);

            console.log('[StockLoader] Registros encontrados:', json.length);

            this.datos = json
                .filter(r => r.Ubicación || r.Referencia || r.Descripción)
                .map(r => ({
                    ubicacion: String(r.Ubicación || '').trim(),
                    habilitado: String(r.Habilit || '').trim(),
                    comportamiento: String(r.Comportamiento || '').trim(),
                    maxRef: r['Nº Max. Ref.'] || 0,
                    ultModif: r['Últ. Modific.'] || '',
                    referencia: String(r.Referencia || '').trim(),
                    refFabricante: String(r['Referencia Fabricante'] || '').trim(),
                    descripcion: String(r.Descripción || '').trim(),
                    clasificacion: String(r.Clasificación || '').trim(),
                    criticidad: String(r.Criticidad || '').trim(),
                    tipoUnidad: String(r['Tipo Unidad'] || '').trim(),
                    cantidad: parseFloat(r.Cantidad) || 0,
                    traspaso: String(r.Traspaso || '').trim()
                }))
                .filter(item => item.referencia || item.descripcion);

            // Extraer categorías únicas
            this.categorias = [...new Set(this.datos.map(item => item.clasificacion).filter(c => c))].sort();

            this.estaCargando = false;
            console.log(`[StockLoader] ✅ ${this.datos.length} repuestos cargados`);
            mostrarMensaje(`✅ ${this.datos.length} repuestos cargados`, 'success', 3000);
            return this.datos;

        } catch (error) {
            this.estaCargando = false;
            console.error('[StockLoader] Error:', error);
            mostrarMensaje(`⚠️ Error: ${error.message}`, 'error', 5000);
            return [];
        }
    }

    /**
     * Busca y filtra los datos según los criterios
     */
    buscar(termino, categoria = '') {
        if (!termino && !categoria) {
            this.filtrados = [];
            return [];
        }

        const busqueda = termino.toLowerCase().trim();
        
        this.filtrados = this.datos.filter(item => {
            // Si no hay término de búsqueda, solo aplicar filtro de categoría
            if (!busqueda) {
                if (categoria && item.clasificacion !== categoria) return false;
                return true;
            }

            // Búsqueda en múltiples campos
            const cumpleBusqueda = 
                item.referencia.toLowerCase().includes(busqueda) ||
                item.refFabricante.toLowerCase().includes(busqueda) ||
                item.descripcion.toLowerCase().includes(busqueda) ||
                item.ubicacion.toLowerCase().includes(busqueda) ||
                item.clasificacion.toLowerCase().includes(busqueda);

            if (!cumpleBusqueda) return false;

            // Aplicar filtro de categoría
            if (categoria && item.clasificacion !== categoria) return false;

            return true;
        });

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
        // Botón de búsqueda
        this.elements.searchBtn.addEventListener('click', () => this._buscar());

        // Enter en el campo de búsqueda
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this._buscar();
            }
        });

        // Limpiar resultados
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => this._limpiar());
        }
    }

    async _cargarDatos() {
        this._showMessage('📂 Cargando datos de repuestos...', 'info', 0);
        this.datos = await this.loader.cargar();
        if (this.datos.length === 0) {
            this._showMessage('⚠️ No se pudieron cargar los datos. Verifica que el archivo Almacen.xlsx existe en /data/', 'error', 5000);
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

        // Validar que haya algún criterio
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

        // Mostrar resultados con la ubicación en primer lugar
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
