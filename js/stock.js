import { mostrarMensaje, debounce, sanitizarNombre } from './utils.js';

// ========== FUNCIÓN DE NORMALIZACIÓN DE TEXTO ==========

function normalizarTexto(texto) {
    if (!texto) return '';
    return String(texto)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
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

            const idxUbicacion = cabeceras.indexOf('Ubicación');
            const idxReferencia = cabeceras.indexOf('Referencia');
            const idxRefFabricante = cabeceras.indexOf('Referencia Fabricante');
            const idxDescripcion = cabeceras.indexOf('Descripción');
            const idxClasificacion = cabeceras.indexOf('Clasificación');
            const idxTipoUnidad = cabeceras.indexOf('Tipo Unidad');
            const idxCantidad = cabeceras.indexOf('Cantidad');

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
                        ubicacion: ubicacion || '—',
                        referencia: referencia || '—',
                        refFabricante: refFabricante || '—',
                        descripcion: descripcion || '—',
                        clasificacion: clasificacion || '—',
                        tipoUnidad: tipoUnidad || 'UD.',
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

            this.categorias = [...new Set(this.datos.map(item => item.clasificacion).filter(c => c && c !== '—'))].sort();
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

    _normalizarDatos() {
        if (!this.datos || this.datos.length === 0) {
            this.datosNormalizados = [];
            return;
        }
        
        this.datosNormalizados = this.datos.map(item => ({
            ...item,
            _normalizado: {
                ubicacion: normalizarTexto(item.ubicacion || ''),
                referencia: normalizarTexto(item.referencia || ''),
                refFabricante: normalizarTexto(item.refFabricante || ''),
                descripcion: normalizarTexto(item.descripcion || ''),
                clasificacion: normalizarTexto(item.clasificacion || ''),
                _original: { ...item }
            }
        }));
    }

    buscar(termino, categoria = '') {
        if (!this.datos || this.datos.length === 0) {
            this.filtrados = [];
            return [];
        }

        if (!this.datosNormalizados || this.datosNormalizados.length === 0) {
            this.filtrados = [];
            return [];
        }

        if (!termino && !categoria) {
            this.filtrados = [];
            return [];
        }

        const busquedaNormalizada = normalizarTexto(termino);
        const categoriaNormalizada = normalizarTexto(categoria);

        if (termino && !busquedaNormalizada) {
            this.filtrados = [];
            return [];
        }

        if (categoria && !categoriaNormalizada) {
            this.filtrados = [];
            return [];
        }

        const resultados = this.datosNormalizados
            .filter(item => {
                const norm = item._normalizado;
                if (!norm) return false;

                if (busquedaNormalizada) {
                    const cumpleBusqueda = 
                        (norm.referencia || '').includes(busquedaNormalizada) ||
                        (norm.refFabricante || '').includes(busquedaNormalizada) ||
                        (norm.descripcion || '').includes(busquedaNormalizada) ||
                        (norm.ubicacion || '').includes(busquedaNormalizada) ||
                        (norm.clasificacion || '').includes(busquedaNormalizada);

                    if (!cumpleBusqueda) return false;
                }

                if (categoriaNormalizada) {
                    if ((norm.clasificacion || '') !== categoriaNormalizada) return false;
                }

                return true;
            })
            .map(item => {
                const original = item._original || item;
                return {
                    ubicacion: original.ubicacion || '—',
                    referencia: original.referencia || '—',
                    refFabricante: original.refFabricante || '—',
                    descripcion: original.descripcion || '—',
                    clasificacion: original.clasificacion || '—',
                    tipoUnidad: original.tipoUnidad || 'UD.',
                    cantidad: typeof original.cantidad === 'number' ? original.cantidad : 0
                };
            });

        this.filtrados = resultados;
        console.log(`[StockLoader] ✅ ${this.filtrados.length} resultados encontrados`);
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
        this.terminoBusqueda = '';
        this.categoriaBusqueda = '';
        this.paginaActual = 1;
        this.resultadosPorPagina = 25;

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
            <!-- ====== PANTALLA DE BÚSQUEDA ====== -->
            <div id="searchScreen" class="search-screen">
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
            </div>

            <!-- ====== PANTALLA DE RESULTADOS ====== -->
            <div id="resultsScreen" class="results-screen" style="display: none;">
                <div class="stock-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h1 style="margin: 0; font-size: 1.2rem;">📊 Resultados de Búsqueda</h1>
                        <p id="resultsSubtitle" style="margin: 4px 0 0; font-size: 0.8rem;">0 resultados encontrados</p>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn btn-back btn-small" id="backSearchBtn" style="margin: 0; padding: 6px 14px; font-size: 0.75rem;">
                            ◀ Volver
                        </button>
                        <button class="btn btn-secondary btn-small" id="exportCsvBtn" style="margin: 0; padding: 6px 14px; font-size: 0.75rem;">
                            📥 CSV
                        </button>
                    </div>
                </div>

                <div class="stock-table-container" id="tableContainer">
                    <div id="resultsTableWrapper" style="overflow-x: auto;">
                        <table class="stock-table" id="resultsTable">
                            <thead>
                                <tr>
                                    <th data-sort="ubicacion" style="cursor: pointer;">📍 Ubicación</th>
                                    <th data-sort="referencia" style="cursor: pointer;">Referencia</th>
                                    <th data-sort="refFabricante" style="cursor: pointer;">Fabricante</th>
                                    <th data-sort="descripcion" style="cursor: pointer;">Descripción</th>
                                    <th data-sort="clasificacion" style="cursor: pointer;">Clasificación</th>
                                    <th data-sort="cantidad" style="cursor: pointer;">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody id="resultsTableBody">
                                <tr>
                                    <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                                        No hay resultados para mostrar
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Paginación -->
                    <div id="paginationControls" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0 0; flex-wrap: wrap; gap: 8px;">
                        <span id="paginationInfo" style="font-size: 0.8rem; color: #666;">Mostrando 0 de 0</span>
                        <div style="display: flex; gap: 6px;">
                            <button class="btn btn-small btn-back" id="prevPageBtn" style="padding: 4px 12px; font-size: 0.7rem; margin: 0;">◀ Anterior</button>
                            <span id="pageIndicator" style="font-size: 0.8rem; color: #333; display: flex; align-items: center; padding: 0 8px;">Página 1</span>
                            <button class="btn btn-small btn-back" id="nextPageBtn" style="padding: 4px 12px; font-size: 0.7rem; margin: 0;">Siguiente ▶</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.elements = {
            searchScreen: this.container.querySelector('#searchScreen'),
            resultsScreen: this.container.querySelector('#resultsScreen'),
            resultsSubtitle: this.container.querySelector('#resultsSubtitle'),
            resultsTableBody: this.container.querySelector('#resultsTableBody'),
            resultsTable: this.container.querySelector('#resultsTable'),
            searchInput: this.container.querySelector('#stockSearchInput'),
            categoryFilter: this.container.querySelector('#categoryFilter'),
            searchBtn: this.container.querySelector('#searchBtn'),
            backBtn: this.container.querySelector('#backSearchBtn'),
            exportCsvBtn: this.container.querySelector('#exportCsvBtn'),
            prevPageBtn: this.container.querySelector('#prevPageBtn'),
            nextPageBtn: this.container.querySelector('#nextPageBtn'),
            pageIndicator: this.container.querySelector('#pageIndicator'),
            paginationInfo: this.container.querySelector('#paginationInfo'),
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
        this.elements.backBtn.addEventListener('click', () => this._volver());
        this.elements.exportCsvBtn.addEventListener('click', () => this._exportarCSV());
        this.elements.prevPageBtn.addEventListener('click', () => this._cambiarPagina(-1));
        this.elements.nextPageBtn.addEventListener('click', () => this._cambiarPagina(1));

        // Ordenación de columnas
        this.elements.resultsTable.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const key = th.dataset.sort;
                this._ordenarPor(key);
            });
        });
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

    async _buscar() {
        const termino = this.elements.searchInput.value.trim();
        const categoria = this.elements.categoryFilter.value;

        if (!termino && !categoria) {
            this._showMessage('⚠️ Introduce un término de búsqueda o selecciona una categoría', 'info', 3000);
            return;
        }

        this.terminoBusqueda = termino;
        this.categoriaBusqueda = categoria;

        this.filtrados = this.loader.buscar(termino, categoria);
        this.paginaActual = 1;

        if (this.filtrados.length === 0) {
            this._showMessage(`🔍 No se encontraron resultados para "${termino || categoria}"`, 'info', 3000);
            this.elements.resultsScreen.style.display = 'block';
            this.elements.searchScreen.style.display = 'none';
            this.elements.resultsSubtitle.textContent = `🔍 0 resultados encontrados para "${termino || categoria}"`;
            this.elements.resultsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                        🔍 No se encontraron resultados
                        <br><span style="font-size: 0.8rem;">Prueba con otros términos de búsqueda</span>
                    </td>
                </tr>
            `;
            this.elements.paginationInfo.textContent = 'Mostrando 0 de 0';
            this.elements.pageIndicator.textContent = 'Página 1';
            this.elements.prevPageBtn.style.display = 'none';
            this.elements.nextPageBtn.style.display = 'none';
            return;
        }

        await this._mostrarResultados();
    }

    async _mostrarResultados() {
        this.elements.searchScreen.style.display = 'none';
        this.elements.resultsScreen.style.display = 'block';

        this.elements.resultsSubtitle.textContent = 
            `🔍 ${this.filtrados.length} resultados encontrados${this.terminoBusqueda ? ` para "${this.terminoBusqueda}"` : ''}${this.categoriaBusqueda ? ` en ${this.categoriaBusqueda}` : ''}`;

        this._renderPagina();
        this._showMessage(`✅ ${this.filtrados.length} resultados encontrados`, 'success', 2000);
    }

    _renderPagina() {
        const total = this.filtrados.length;
        const porPagina = this.resultadosPorPagina;
        const totalPaginas = Math.ceil(total / porPagina);
        
        if (this.paginaActual > totalPaginas) {
            this.paginaActual = totalPaginas || 1;
        }
        
        const inicio = (this.paginaActual - 1) * porPagina;
        const fin = Math.min(inicio + porPagina, total);
        const paginaResultados = this.filtrados.slice(inicio, fin);

        const tbody = this.elements.resultsTableBody;
        
        if (paginaResultados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                        No hay resultados en esta página
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = paginaResultados.map(item => {
                const cantidad = item.cantidad || 0;
                const stockClass = cantidad > 10 ? 'high' : cantidad > 5 ? 'medium' : 'low';
                const unidad = item.tipoUnidad || 'UD.';
                
                return `
                    <tr>
                        <td><code style="font-size: 0.7rem; background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${item.ubicacion}</code></td>
                        <td><strong>${item.referencia}</strong></td>
                        <td style="font-size: 0.75rem; color: #666;">${item.refFabricante}</td>
                        <td>${item.descripcion}</td>
                        <td><span style="font-size: 0.75rem; background: #e8e8e8; padding: 2px 8px; border-radius: 12px;">${item.clasificacion}</span></td>
                        <td><span class="stock-badge ${stockClass}">${cantidad} ${unidad}</span></td>
                    </tr>
                `;
            }).join('');
        }

        // Actualizar paginación
        this.elements.paginationInfo.textContent = `Mostrando ${inicio + 1}-${fin} de ${total} resultados`;
        this.elements.pageIndicator.textContent = `Página ${this.paginaActual} de ${totalPaginas || 1}`;
        
        this.elements.prevPageBtn.style.display = this.paginaActual > 1 ? 'inline-block' : 'none';
        this.elements.nextPageBtn.style.display = this.paginaActual < totalPaginas ? 'inline-block' : 'none';
    }

    _cambiarPagina(delta) {
        const total = this.filtrados.length;
        const totalPaginas = Math.ceil(total / this.resultadosPorPagina);
        const nuevaPagina = this.paginaActual + delta;
        
        if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
        
        this.paginaActual = nuevaPagina;
        this._renderPagina();
        
        // Scroll al inicio de la tabla
        const tableContainer = this.container.querySelector('#tableContainer');
        if (tableContainer) {
            tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    _ordenarPor(key) {
        if (this.filtrados.length === 0) return;
        
        // Alternar orden
        if (this._ultimaOrden === key) {
            this._ordenAscendente = !this._ordenAscendente;
        } else {
            this._ultimaOrden = key;
            this._ordenAscendente = true;
        }
        
        const asc = this._ordenAscendente;
        
        this.filtrados.sort((a, b) => {
            let valA = a[key] || '';
            let valB = b[key] || '';
            
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            
            if (valA < valB) return asc ? -1 : 1;
            if (valA > valB) return asc ? 1 : -1;
            return 0;
        });
        
        this.paginaActual = 1;
        this._renderPagina();
        
        // Actualizar indicadores de orden
        this.elements.resultsTable.querySelectorAll('th[data-sort]').forEach(th => {
            th.style.color = th.dataset.sort === key ? '#F2C200' : '';
        });
    }

    _exportarCSV() {
        if (this.filtrados.length === 0) {
            this._showMessage('⚠️ No hay datos para exportar', 'info', 3000);
            return;
        }

        try {
            // Crear contenido CSV
            const cabeceras = ['Ubicación', 'Referencia', 'Fabricante', 'Descripción', 'Clasificación', 'Cantidad', 'Unidad'];
            const filas = this.filtrados.map(item => [
                item.ubicacion,
                item.referencia,
                item.refFabricante,
                `"${item.descripcion.replace(/"/g, '""')}"`,
                item.clasificacion,
                item.cantidad || 0,
                item.tipoUnidad || 'UD.'
            ]);
            
            const csvContent = [cabeceras.join(','), ...filas.map(f => f.join(','))].join('\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const nombre = `stock-${new Date().toISOString().slice(0, 10)}`;
            link.href = URL.createObjectURL(blob);
            link.download = `${nombre}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
            
            this._showMessage('📥 CSV exportado correctamente', 'success', 2000);
        } catch (error) {
            console.error('[StockApp] Error exportando CSV:', error);
            this._showMessage('❌ Error al exportar CSV', 'error', 3000);
        }
    }

    _volver() {
        this.elements.resultsScreen.style.display = 'none';
        this.elements.searchScreen.style.display = 'block';
        this.filtrados = [];
        this.paginaActual = 1;
        this._ultimaOrden = null;
        this._ordenAscendente = true;
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