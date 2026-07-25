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

// ========== GENERADOR DE IMAGEN DE RESULTADOS ==========

class ResultsRenderer {
    static async generarImagen(resultados, termino = '', categoria = '') {
        return new Promise((resolve, reject) => {
            try {
                // Validar resultados
                if (!resultados || !Array.isArray(resultados) || resultados.length === 0) {
                    reject(new Error('No hay resultados para mostrar'));
                    return;
                }

                // Filtrar resultados válidos
                const datosValidos = resultados.filter(item => 
                    item && typeof item === 'object' && (item.referencia || item.descripcion)
                );

                if (datosValidos.length === 0) {
                    reject(new Error('No hay datos válidos para mostrar'));
                    return;
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const maxWidth = 600;
                const padding = 20;
                const rowHeight = 28;
                
                const resultsCount = Math.min(datosValidos.length, 30);
                const totalHeight = 140 + (resultsCount * rowHeight) + padding * 2 + 40;
                
                canvas.width = maxWidth;
                canvas.height = totalHeight;
                
                const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradiente.addColorStop(0, '#F2C200');
                gradiente.addColorStop(0.3, '#F5D530');
                gradiente.addColorStop(1, '#1a1a2e');
                ctx.fillStyle = gradiente;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
                ResultsRenderer._dibujarRectRedondeado(ctx, padding, padding, canvas.width - padding * 2, canvas.height - padding * 2, 16);
                ctx.fill();
                
                let y = padding + 15;
                
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 18px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('📦 Resultados de Búsqueda', canvas.width / 2, y + 20);
                y += 35;
                
                ctx.font = '12px "Segoe UI", sans-serif';
                ctx.fillStyle = '#666';
                let subtitulo = `🔍 ${datosValidos.length} resultados encontrados`;
                if (termino) subtitulo += ` - "${termino}"`;
                if (categoria) subtitulo += ` - ${categoria}`;
                ctx.fillText(subtitulo, canvas.width / 2, y + 12);
                y += 30;
                
                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padding + 15, y);
                ctx.lineTo(canvas.width - padding - 15, y);
                ctx.stroke();
                y += 10;
                
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 11px "Courier New", monospace';
                ctx.textAlign = 'left';
                
                const colores = ['#1a1a2e', '#F2C200', '#1a1a2e', '#1a1a2e', '#1a1a2e', '#1a1a2e'];
                const textos = ['📍 Ubicación', 'Ref.', 'Fabricante', 'Descripción', 'Clasif.', 'Cant.'];
                const xInicial = padding + 15;
                const colWidths = [90, 70, 70, 160, 70, 55];
                
                let x = xInicial;
                textos.forEach((text, i) => {
                    ctx.fillStyle = colores[i];
                    ctx.fillText(text, x, y + 12);
                    x += colWidths[i];
                });
                y += 18;
                
                ctx.strokeStyle = '#1a1a2e';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(xInicial, y - 4);
                ctx.lineTo(xInicial + colWidths.reduce((a, b) => a + b, 0), y - 4);
                ctx.stroke();
                
                const maxDisplay = Math.min(datosValidos.length, 30);
                ctx.font = '10px "Segoe UI", sans-serif';
                
                for (let i = 0; i < maxDisplay; i++) {
                    const item = datosValidos[i];
                    if (!item) continue;
                    
                    x = xInicial;
                    
                    ctx.fillStyle = '#333';
                    ctx.textAlign = 'left';
                    let texto = item.ubicacion || '—';
                    if (texto.length > 10) texto = texto.substring(0, 9) + '…';
                    ctx.fillText(texto, x, y + 10);
                    x += colWidths[0];
                    
                    ctx.fillStyle = '#1a1a2e';
                    ctx.font = 'bold 10px "Courier New", monospace';
                    texto = item.referencia || '—';
                    if (texto.length > 8) texto = texto.substring(0, 7) + '…';
                    ctx.fillText(texto, x, y + 10);
                    x += colWidths[1];
                    ctx.font = '10px "Segoe UI", sans-serif';
                    
                    ctx.fillStyle = '#555';
                    ctx.font = '9px "Segoe UI", sans-serif';
                    texto = item.refFabricante || '—';
                    if (texto.length > 10) texto = texto.substring(0, 9) + '…';
                    ctx.fillText(texto, x, y + 10);
                    x += colWidths[2];
                    
                    ctx.fillStyle = '#333';
                    ctx.font = '10px "Segoe UI", sans-serif';
                    texto = item.descripcion || '—';
                    if (texto.length > 18) texto = texto.substring(0, 17) + '…';
                    ctx.fillText(texto, x, y + 10);
                    x += colWidths[3];
                    
                    ctx.fillStyle = '#1a1a2e';
                    ctx.font = '9px "Segoe UI", sans-serif';
                    texto = item.clasificacion || '—';
                    if (texto.length > 9) texto = texto.substring(0, 8) + '…';
                    ctx.fillText(texto, x, y + 10);
                    x += colWidths[4];
                    
                    const cantidad = typeof item.cantidad === 'number' ? item.cantidad : 0;
                    const badgeColor = cantidad > 10 ? '#28a745' : cantidad > 5 ? '#ffc107' : '#dc3545';
                    ctx.fillStyle = badgeColor;
                    ctx.font = 'bold 10px "Courier New", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${cantidad}`, x + colWidths[5] / 2, y + 10);
                    
                    y += rowHeight;
                }
                
                if (datosValidos.length > 30) {
                    ctx.fillStyle = '#999';
                    ctx.font = '10px "Segoe UI", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`... y ${datosValidos.length - 30} resultados más`, canvas.width / 2, y + 10);
                }
                
                y += 15;
                ctx.fillStyle = 'rgba(26, 26, 46, 0.5)';
                ctx.font = '9px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                const fecha = new Date().toLocaleDateString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                ctx.fillText(`Generado: ${fecha} · QR-Cards-Generator`, canvas.width / 2, y + 8);
                
                resolve(canvas.toDataURL('image/png'));
            } catch (error) {
                console.error('[ResultsRenderer] Error:', error);
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
}

// ========== DATOS DE EJEMPLO (expandidos para pruebas) ==========

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
                _original: item
            }
        }));
    }

    buscar(termino, categoria = '') {
        // Validar que haya datos
        if (!this.datos || this.datos.length === 0) {
            console.warn('[StockLoader] No hay datos cargados');
            this.filtrados = [];
            return [];
        }

        // Validar que haya datos normalizados
        if (!this.datosNormalizados || this.datosNormalizados.length === 0) {
            console.warn('[StockLoader] No hay datos normalizados');
            this.filtrados = [];
            return [];
        }

        // Si no hay término ni categoría, devolver vacío
        if (!termino && !categoria) {
            console.log('[StockLoader] Sin criterios de búsqueda');
            this.filtrados = [];
            return [];
        }

        const busquedaNormalizada = normalizarTexto(termino);
        const categoriaNormalizada = normalizarTexto(categoria);

        console.log('[StockLoader] Buscando:', { 
            termino, 
            busquedaNormalizada: busquedaNormalizada || '(vacío)', 
            categoria, 
            categoriaNormalizada: categoriaNormalizada || '(vacío)',
            totalDatos: this.datosNormalizados.length 
        });

        // Si hay término de búsqueda pero está vacío después de normalizar
        if (termino && !busquedaNormalizada) {
            console.log('[StockLoader] El término se normalizó a vacío');
            this.filtrados = [];
            return [];
        }

        // Si solo hay categoría y está vacía
        if (categoria && !categoriaNormalizada) {
            console.log('[StockLoader] La categoría se normalizó a vacío');
            this.filtrados = [];
            return [];
        }

        this.filtrados = this.datosNormalizados
            .filter(item => {
                const norm = item._normalizado;
                if (!norm) return false;

                // Si hay término de búsqueda, buscar en todos los campos
                if (busquedaNormalizada) {
                    const cumpleBusqueda = 
                        (norm.referencia || '').includes(busquedaNormalizada) ||
                        (norm.refFabricante || '').includes(busquedaNormalizada) ||
                        (norm.descripcion || '').includes(busquedaNormalizada) ||
                        (norm.ubicacion || '').includes(busquedaNormalizada) ||
                        (norm.clasificacion || '').includes(busquedaNormalizada);

                    if (!cumpleBusqueda) return false;
                }

                // Si hay categoría, filtrar
                if (categoriaNormalizada) {
                    if ((norm.clasificacion || '') !== categoriaNormalizada) return false;
                }

                return true;
            })
            .map(item => item._original);

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
        this.cachedImage = null;

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
                <div class="stock-header">
                    <h1>📊 Resultados de Búsqueda</h1>
                    <p id="resultsSubtitle">0 resultados encontrados</p>
                </div>

                <div class="results-preview" id="resultsPreview">
                    <div id="resultsContainer" style="width: 100%;"></div>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-secondary" id="downloadResultsBtn">
                        📥 Descargar imagen
                    </button>
                    <button class="btn btn-success" id="shareResultsBtn">
                        📤 Compartir
                    </button>
                    <button class="btn btn-back" id="backSearchBtn">
                        ◀ Volver a buscar
                    </button>
                </div>
            </div>
        `;

        this.elements = {
            searchScreen: this.container.querySelector('#searchScreen'),
            resultsScreen: this.container.querySelector('#resultsScreen'),
            resultsSubtitle: this.container.querySelector('#resultsSubtitle'),
            resultsPreview: this.container.querySelector('#resultsPreview'),
            resultsContainer: this.container.querySelector('#resultsContainer'),
            searchInput: this.container.querySelector('#stockSearchInput'),
            categoryFilter: this.container.querySelector('#categoryFilter'),
            searchBtn: this.container.querySelector('#searchBtn'),
            backBtn: this.container.querySelector('#backSearchBtn'),
            downloadBtn: this.container.querySelector('#downloadResultsBtn'),
            shareBtn: this.container.querySelector('#shareResultsBtn'),
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
        this.elements.downloadBtn.addEventListener('click', () => this._descargar());
        this.elements.shareBtn.addEventListener('click', () => this._compartir());
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

        console.log('[StockApp] 🔍 Buscando:', { termino, categoria });

        if (!termino && !categoria) {
            this._showMessage('⚠️ Introduce un término de búsqueda o selecciona una categoría', 'info', 3000);
            return;
        }

        this.terminoBusqueda = termino;
        this.categoriaBusqueda = categoria;

        this.filtrados = this.loader.buscar(termino, categoria);
        this.cachedImage = null;

        console.log('[StockApp] 📊 Resultados:', this.filtrados.length);

        if (this.filtrados.length === 0) {
            this._showMessage(`🔍 No se encontraron resultados para "${termino || categoria}"`, 'info', 3000);
            // Mostrar mensaje en la pantalla de resultados también
            this.elements.resultsScreen.style.display = 'block';
            this.elements.searchScreen.style.display = 'none';
            this.elements.resultsSubtitle.textContent = `🔍 0 resultados encontrados para "${termino || categoria}"`;
            this.elements.resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <p style="font-size: 48px; margin: 0;">🔍</p>
                    <p>No se encontraron resultados</p>
                    <p style="font-size: 0.8rem;">Prueba con otros términos de búsqueda</p>
                </div>
            `;
            return;
        }

        await this._mostrarResultados();
    }

    async _mostrarResultados() {
        // Mostrar pantalla de resultados
        this.elements.searchScreen.style.display = 'none';
        this.elements.resultsScreen.style.display = 'block';

        // Actualizar subtítulo
        this.elements.resultsSubtitle.textContent = 
            `🔍 ${this.filtrados.length} resultados encontrados${this.terminoBusqueda ? ` para "${this.terminoBusqueda}"` : ''}${this.categoriaBusqueda ? ` en ${this.categoriaBusqueda}` : ''}`;

        // Mostrar loading
        this.elements.resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div class="spinner" style="margin: 0 auto 15px;"></div>
                <p>Generando vista de resultados...</p>
            </div>
        `;

        try {
            console.log('[StockApp] 🖼️ Generando imagen para', this.filtrados.length, 'resultados');
            
            this.cachedImage = await ResultsRenderer.generarImagen(
                this.filtrados, 
                this.terminoBusqueda, 
                this.categoriaBusqueda
            );

            this.elements.resultsContainer.innerHTML = `
                <img src="${this.cachedImage}" alt="Resultados de búsqueda" style="width: 100%; max-width: 600px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            `;

            this._showMessage(`✅ ${this.filtrados.length} resultados encontrados`, 'success', 2000);

        } catch (error) {
            console.error('[StockApp] ❌ Error generando imagen:', error);
            
            // Mostrar los resultados en texto plano como fallback
            let html = '<div style="padding: 10px; text-align: left; font-size: 12px;">';
            html += `<p style="font-weight: bold; text-align: center;">${this.filtrados.length} resultados encontrados</p>`;
            html += '<ul style="list-style: none; padding: 0;">';
            const maxDisplay = Math.min(this.filtrados.length, 20);
            for (let i = 0; i < maxDisplay; i++) {
                const item = this.filtrados[i];
                html += `<li style="padding: 4px 0; border-bottom: 1px solid #eee;">
                    <strong>${item.ubicacion || '—'}</strong> - 
                    ${item.referencia || '—'} - 
                    ${item.descripcion ? item.descripcion.substring(0, 40) : '—'}
                    <span style="float: right; font-weight: bold; color: ${item.cantidad > 10 ? '#28a745' : item.cantidad > 5 ? '#ffc107' : '#dc3545'};">${item.cantidad || 0}</span>
                </li>`;
            }
            if (this.filtrados.length > 20) {
                html += `<li style="padding: 4px 0; text-align: center; color: #999;">... y ${this.filtrados.length - 20} más</li>`;
            }
            html += '</ul></div>';
            
            this.elements.resultsContainer.innerHTML = html;
            this._showMessage('⚠️ Vista simplificada (error al generar imagen)', 'info', 3000);
        }
    }

    _volver() {
        this.elements.resultsScreen.style.display = 'none';
        this.elements.searchScreen.style.display = 'block';
        this.cachedImage = null;
        this.elements.resultsContainer.innerHTML = '';
    }

    async _descargar() {
        if (!this.cachedImage) {
            this._showMessage('❌ Generando imagen...', 'info', 2000);
            return;
        }

        try {
            const link = document.createElement('a');
            const nombre = `resultados-stock-${new Date().toISOString().slice(0, 10)}`;
            link.download = `${nombre}.png`;
            link.href = this.cachedImage;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this._showMessage('📥 Imagen descargada', 'success', 2000);
        } catch (error) {
            console.error('[StockApp] Error descargando:', error);
            this._showMessage('❌ Error al descargar', 'error', 3000);
        }
    }

    async _compartir() {
        if (!this.cachedImage) {
            this._showMessage('❌ Generando imagen...', 'info', 2000);
            return;
        }

        try {
            const blob = await (await fetch(this.cachedImage)).blob();
            const file = new File([blob], 'resultados-stock.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: 'Resultados de stock',
                    text: `📦 ${this.filtrados.length} repuestos encontrados${this.terminoBusqueda ? ` para "${this.terminoBusqueda}"` : ''}`,
                    files: [file]
                });
                this._showMessage('📤 Compartido correctamente', 'success', 2000);
            } else {
                this._showMessage('📱 Compartir no soportado, se descargará', 'info', 2000);
                this._descargar();
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('[StockApp] Error compartiendo:', error);
                this._showMessage('❌ Error al compartir', 'error', 3000);
            }
        }
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