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
                throw new Error('No se pudo cargar el archivo Almacen.xlsx');
            }

            const workbook = XLSX.read(dataCargada, { type: 'array' });
            const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(primeraHoja);

            console.log('[StockLoader] 📊 Registros encontrados en Excel:', json.length);
            
            // MOSTRAR LAS COLUMNAS DISPONIBLES
            if (json.length > 0) {
                const columnas = Object.keys(json[0]);
                console.log('[StockLoader] 📋 Columnas disponibles:', columnas);
                console.log('[StockLoader] 📄 Primer registro (muestra):', json[0]);
                console.log('[StockLoader] 📄 Segundo registro (muestra):', json[1] || 'No hay segundo registro');
            }

            // PROCESAR REGISTROS - Usar las columnas exactas del archivo
            this.datos = json
                .filter(r => {
                    // Verificar que tenga al menos una columna con datos
                    const tieneDatos = 
                        r.Ubicación || r['Ubicación'] || 
                        r.Referencia || r['Referencia'] || 
                        r.Descripción || r['Descripción'] ||
                        r['Referencia Fabricante'] || 
                        r.Clasificación || r['Clasificación'];
                    return tieneDatos;
                })
                .map((r, index) => {
                    // Extraer valores - USAR EXACTAMENTE LOS NOMBRES DEL ARCHIVO
                    const ubicacion = r.Ubicación || r['Ubicación'] || '';
                    const referencia = r.Referencia || r['Referencia'] || '';
                    const refFabricante = r['Referencia Fabricante'] || '';
                    const descripcion = r.Descripción || r['Descripción'] || '';
                    const clasificacion = r.Clasificación || r['Clasificación'] || '';
                    const criticidad = r.Criticidad || r['Criticidad'] || '';
                    const tipoUnidad = r['Tipo Unidad'] || 'UD.';
                    const cantidad = parseFloat(r.Cantidad || r['Cantidad'] || 0);
                    const habilitado = r.Habilit || r['Habilit.'] || '';
                    const comportamiento = r.Comportamiento || r['Comportamiento'] || '';
                    const maxRef = r['Nº Max. Ref.'] || 0;
                    const ultModif = r['Últ. Modific.'] || '';
                    const traspaso = r.Traspaso || r['Traspaso'] || '';

                    const item = {
                        ubicacion: String(ubicacion).trim(),
                        habilitado: String(habilitado).trim(),
                        comportamiento: String(comportamiento).trim(),
                        maxRef: parseFloat(maxRef) || 0,
                        ultModif: String(ultModif).trim(),
                        referencia: String(referencia).trim(),
                        refFabricante: String(refFabricante).trim(),
                        descripcion: String(descripcion).trim(),
                        clasificacion: String(clasificacion).trim(),
                        criticidad: String(criticidad).trim(),
                        tipoUnidad: String(tipoUnidad).trim(),
                        cantidad: isNaN(cantidad) ? 0 : cantidad,
                        traspaso: String(traspaso).trim()
                    };

                    // Mostrar los primeros 5 registros procesados
                    if (index < 5) {
                        console.log(`[StockLoader] 🔍 Registro ${index + 1} procesado:`, item);
                    }

                    return item;
                })
                .filter(item => {
                    // Filtrar filas vacías
                    const tieneDatos = 
                        item.referencia || 
                        item.descripcion || 
                        item.refFabricante || 
                        item.ubicacion;
                    return tieneDatos;
                });

            // Extraer categorías únicas
            this.categorias = [...new Set(this.datos.map(item => item.clasificacion).filter(c => c))].sort();

            this.estaCargando = false;
            console.log(`[StockLoader] ✅ ${this.datos.length} repuestos procesados`);
            console.log(`[StockLoader] 🏷️ Categorías encontradas:`, this.categorias);
            
            if (this.datos.length === 0) {
                console.warn('[StockLoader] ⚠️ No se procesó ningún registro. Verifica las columnas del Excel.');
                mostrarMensaje('⚠️ No se encontraron datos. Revisa la consola para ver las columnas disponibles.', 'error', 5000);
            } else {
                mostrarMensaje(`✅ ${this.datos.length} repuestos cargados`, 'success', 3000);
            }
            
            return this.datos;

        } catch (error) {
            this.estaCargando = false;
            console.error('[StockLoader] ❌ Error:', error);
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
            if (!busqueda) {
                if (categoria && item.clasificacion !== categoria) return false;
                return true;
            }

            const cumpleBusqueda = 
                item.referencia.toLowerCase().includes(busqueda) ||
                item.refFabricante.toLowerCase().includes(busqueda) ||
                item.descripcion.toLowerCase().includes(busqueda) ||
                item.ubicacion.toLowerCase().includes(busqueda) ||
                item.clasificacion.toLowerCase().includes(busqueda);

            if (!cumpleBusqueda) return false;
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
