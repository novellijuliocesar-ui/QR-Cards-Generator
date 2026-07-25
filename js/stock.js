import { mostrarMensaje, debounce } from './utils.js';

// ========== GESTOR DE REPUESTOS (STOCK) ==========

class StockLoader {
    constructor() {
        this.datos = [];
        this.filtrados = [];
        this.estaCargando = false;
        this.categorias = [];
        this.usaEjemplo = false;
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
                this.categorias = [...new Set(this.datos.map(item => item.clasificacion))].sort();
                this.estaCargando = false;
                mostrarMensaje(`⚠️ Usando ${this.datos.length} datos de ejemplo (Excel no encontrado)`, 'info', 5000);
                return this.datos;
            }

            const workbook = XLSX.read(dataCargada, { type: 'array' });
            const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
            
            // IMPORTANTE: La fila de cabeceras está en la fila 2 (índice 1 en JavaScript)
            // Usamos 'header: 1' para que la primera fila de datos sea la cabecera
            // Y luego saltamos la primera fila (que es el título)
            const json = XLSX.utils.sheet_to_json(primeraHoja, { 
                defval: '',
                header: 1  // Leer como array de arrays
            });

            console.log('[StockLoader] 📊 Registros encontrados en Excel:', json.length);

            // La primera fila es el título "Listado de mapa de almacén"
            // La segunda fila (índice 1) es la cabecera con los nombres de columna
            // Las siguientes filas son los datos
            const cabeceras = json[1] || [];
            console.log('[StockLoader] 📋 Cabeceras encontradas:', cabeceras);

            // Mapeo de índices de columna
            const idxUbicacion = cabeceras.indexOf('Ubicación');
            const idxHabilit = cabeceras.indexOf('Habilit.');
            const idxComportamiento = cabeceras.indexOf('Comportamiento');
            const idxMaxRef = cabeceras.indexOf('Nº Max. Ref.');
            const idxUltModif = cabeceras.indexOf('Últ. Modific.');
            const idxReferencia = cabeceras.indexOf('Referencia');
            const idxRefFabricante = cabeceras.indexOf('Referencia Fabricante');
            const idxDescripcion = cabeceras.indexOf('Descripción');
            const idxClasificacion = cabeceras.indexOf('Clasificación');
            const idxCriticidad = cabeceras.indexOf('Criticidad');
            const idxTipoUnidad = cabeceras.indexOf('Tipo Unidad');
            const idxCantidad = cabeceras.indexOf('Cantidad');
            const idxTraspaso = cabeceras.indexOf('Traspaso');

            console.log('[StockLoader] 📌 Índices - Ubicación:', idxUbicacion, 'Referencia:', idxReferencia, 'Descripción:', idxDescripcion);

            // Procesar datos desde la fila 3 (índice 2)
            this.datos = [];

            for (let i = 2; i < json.length; i++) {
                const row = json[i];
                if (!row || row.length === 0) continue;

                const ubicacion = idxUbicacion >= 0 ? String(row[idxUbicacion] || '').trim() : '';
                const referencia = idxReferencia >= 0 ? String(row[idxReferencia] || '').trim() : '';
                const refFabricante = idxRefFabricante >= 0 ? String(row[idxRefFabricante] || '').trim() : '';
                const descripcion = idxDescripcion >= 0 ? String(row[idxDescripcion] || '').trim() : '';
                const clasificacion = idxClasificacion >= 0 ? String(row[idxClasificacion] || '').trim() : '';
                const tipoUnidad = idxTipoUnidad >= 0 ? String(row[idxTipoUnidad] || '').trim() : 'UD.';
                const cantidad = idxCantidad >= 0 ? parseFloat(row[idxCantidad]) || 0 : 0;
                const habilitado = idxHabilit >= 0 ? String(row[idxHabilit] || '').trim() : '';
                const comportamiento = idxComportamiento >= 0 ? String(row[idxComportamiento] || '').trim() : '';
                const maxRef = idxMaxRef >= 0 ? parseFloat(row[idxMaxRef]) || 0 : 0;
                const ultModif = idxUltModif >= 0 ? String(row[idxUltModif] || '').trim() : '';
                const criticidad = idxCriticidad >= 0 ? String(row[idxCriticidad] || '').trim() : '';
                const traspaso = idxTraspaso >= 0 ? String(row[idxTraspaso] || '').trim() : '';

                // Solo agregar si tiene referencia o descripción
                if (referencia || descripcion) {
                    this.datos.push({
                        ubicacion: ubicacion,
                        habilitado: habilitado,
                        comportamiento: comportamiento,
                        maxRef: maxRef,
                        ultModif: ultModif,
                        referencia: referencia,
                        refFabricante: refFabricante,
                        descripcion: descripcion,
                        clasificacion: clasificacion,
                        criticidad: criticidad,
                        tipoUnidad: tipoUnidad,
                        cantidad: cantidad,
                        traspaso: traspaso
                    });
                }
            }

            // Si no se procesaron datos, usar ejemplo
            if (this.datos.length === 0) {
                console.warn('[StockLoader] ⚠️ No se procesaron datos del Excel. Usando datos de ejemplo.');
                this.usaEjemplo = true;
                this.datos = [...DATOS_EJEMPLO];
                mostrarMensaje(`⚠️ Usando ${this.datos.length} datos de ejemplo (Excel vacío)`, 'info', 5000);
            } else {
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
            this.categorias = [...new Set(this.datos.map(item => item.clasificacion))].sort();
            this.estaCargando = false;
            mostrarMensaje(`⚠️ Usando ${this.datos.length} datos de ejemplo (error: ${error.message})`, 'info', 5000);
            return this.datos;
        }
    }

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

// ========== DATOS DE EJEMPLO (extraídos de tu archivo Almacen.xlsx) ==========

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
    },
    {
        ubicacion: 'S1/A11/P1/H1/D1/F1',
        referencia: '45391',
        refFabricante: 'MI-DMI AC113I-KAA0AA',
        descripcion: 'CAUTIVO - MOTO-TAMBOR INTERROLL-MI-DMI AC113I-KAA0AA4E0EHB-409mm',
        clasificacion: 'MOTORES',
        tipoUnidad: 'UD.',
        cantidad: 1
    },
    {
        ubicacion: 'S1/A11/P4/H1/D1/F1',
        referencia: '768',
        refFabricante: '1FK7063-5AH71-1UH0',
        descripcion: 'SERVOMOTOR SIEMENS',
        clasificacion: 'MOTORES',
        tipoUnidad: 'UD.',
        cantidad: 2
    },
    {
        ubicacion: 'S1/A12/P1/H1/D1/F1',
        referencia: '8388',
        refFabricante: '00197922',
        descripcion: 'CAUTIVO - RODILLO 50X1.5X450mm - ACANALADO',
        clasificacion: 'SUMINISTROS INDUSTRIALES',
        tipoUnidad: 'UD.',
        cantidad: 68
    },
    {
        ubicacion: 'S1/A15/P1/H1/D1/F1',
        referencia: '46663',
        refFabricante: '101101009',
        descripcion: 'MUELLES BANDEJAS Sorter 1 y 2',
        clasificacion: 'SUMINISTROS INDUSTRIALES',
        tipoUnidad: 'UD.',
        cantidad: 126
    },
    {
        ubicacion: 'S1/A15/P1/H1/D3/F1',
        referencia: '47252',
        refFabricante: '00001572',
        descripcion: 'RUEDAS BANDEJAS (DISTRISORT)',
        clasificacion: 'RODAMIENTO',
        tipoUnidad: 'UD.',
        cantidad: 3
    },
    {
        ubicacion: 'S1/A16/P3/H5/D6/F1',
        referencia: '8762',
        refFabricante: '00013585',
        descripcion: 'CIRCLIP GRUPILLA ARANDELA SUJECION 6mm RUEDA TENTE',
        clasificacion: 'FERRETERIA',
        tipoUnidad: 'UD.',
        cantidad: 2308
    },
    {
        ubicacion: 'S1/A20/P1/H3/D1/F1',
        referencia: '10',
        refFabricante: '[PLE]-00010469',
        descripcion: 'MUELLE TENSOR RUEDA INERCIA 0,5X10X34 MM',
        clasificacion: 'SUMINISTROS INDUSTRIALES',
        tipoUnidad: 'UD.',
        cantidad: 1048
    },
    {
        ubicacion: 'S1/A21/P2/H4/D1/F1',
        referencia: '22719',
        refFabricante: 'S330053993Z',
        descripcion: 'PERNO SOPORTE RODILLO D10x115 K12 SIAT',
        clasificacion: 'FERRETERIA',
        tipoUnidad: 'UD.',
        cantidad: 49
    }
];

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
