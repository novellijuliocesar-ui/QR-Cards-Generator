import { ExcelLoader } from './excel-loader.js';
import { mostrarMensaje, debounce } from './utils.js';

// ========== CONTROLADOR DE STOCK ==========

class StockApp {
    constructor() {
        this.excelLoader = new ExcelLoader();
        this.datos = [];
        this.categorias = new Map();
        this.currentCategory = '';
        this.container = document.getElementById('stockPage');
        this.searchInput = null;
        this.categorySelect = null;
        this.tableBody = null;
        this.resultsCount = null;
        this.messageEl = null;

        this.init();
    }

    async init() {
        this._buildUI();
        this._setupEventListeners();
        await this._cargarDatos();
        this._poblarCategorias();
        this._renderTabla();
    }

    _buildUI() {
        if (!this.container) {
            console.error('[StockApp] No se encontró el contenedor stockPage');
            return;
        }

        this.container.innerHTML = `
            <div class="stock-header">
                <h1>📦 Búsqueda Stock Almacén</h1>
                <p>Consulta el stock de los activos por categoría</p>
            </div>

            <div id="stockMessage" class="message" role="alert" aria-live="polite"></div>

            <div class="category-selector">
                <label for="categorySelect">🏷️ Filtrar por categoría</label>
                <select id="categorySelect">
                    <option value="">-- Todas las categorías --</option>
                </select>
            </div>

            <div class="category-selector">
                <label for="stockSearchInput">🔍 Buscar en stock</label>
                <input 
                    type="text" 
                    id="stockSearchInput" 
                    placeholder="Buscar por código o descripción..." 
                    autocomplete="off"
                >
            </div>

            <div class="stock-table-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <strong id="resultsCount">Total: 0 activos</strong>
                    <span style="font-size: 0.8rem; color: #666;">⬅️ Desliza para volver</span>
                </div>
                <table class="stock-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody id="stockTableBody">
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 40px;">
                                ⏳ Cargando datos...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        this.searchInput = document.getElementById('stockSearchInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.tableBody = document.getElementById('stockTableBody');
        this.resultsCount = document.getElementById('resultsCount');
        this.messageEl = document.getElementById('stockMessage');
    }

    _setupEventListeners() {
        const debouncedSearch = debounce(() => this._renderTabla(), 300);
        if (this.searchInput) {
            this.searchInput.addEventListener('input', debouncedSearch);
        }
        if (this.categorySelect) {
            this.categorySelect.addEventListener('change', () => {
                this.currentCategory = this.categorySelect.value;
                this._renderTabla();
            });
        }
    }

    async _cargarDatos() {
        this.datos = await this.excelLoader.cargar();
        this._extraerCategorias();
        this._showMessage(`✅ ${this.datos.length} activos cargados`, 'success');
    }

    _extraerCategorias() {
        this.categorias = new Map();
        
        this.datos.forEach(item => {
            let categoria = 'General';
            if (item.desc) {
                const match = item.desc.match(/^([A-ZÁÉÍÓÚÑ\s]+?)(?:\s|$)/);
                if (match) {
                    categoria = match[1].trim();
                } else {
                    categoria = item.codigo.substring(0, 4) || 'General';
                }
            }
            
            if (!this.categorias.has(categoria)) {
                this.categorias.set(categoria, []);
            }
            this.categorias.get(categoria).push(item);
        });
    }

    _poblarCategorias() {
        if (!this.categorySelect) return;
        
        const select = this.categorySelect;
        const categoriasOrdenadas = Array.from(this.categorias.keys()).sort();
        
        select.innerHTML = '<option value="">-- Todas las categorías --</option>';
        
        categoriasOrdenadas.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = `${cat} (${this.categorias.get(cat).length})`;
            select.appendChild(opt);
        });
    }

    _renderTabla() {
        if (!this.tableBody || !this.resultsCount) return;
        
        const searchTerm = this.searchInput?.value?.toLowerCase().trim() || '';
        const category = this.currentCategory;
        
        let filtered = this.datos;
        
        if (category) {
            filtered = this.categorias.get(category) || [];
        }
        
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.codigo.toLowerCase().includes(searchTerm) ||
                item.desc.toLowerCase().includes(searchTerm) ||
                item.id.includes(searchTerm)
            );
        }

        if (filtered.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="no-results">
                            <div class="icon">🔍</div>
                            <p>No se encontraron resultados</p>
                            <p style="font-size: 0.8rem; color: #999;">Prueba con otro término de búsqueda</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            this.tableBody.innerHTML = filtered.map(item => {
                const estado = this._getEstado(item);
                const badgeClass = estado === 'Alto' ? 'high' : estado === 'Medio' ? 'medium' : 'low';
                return `
                    <tr>
                        <td><strong>${item.id}</strong></td>
                        <td><code>${item.codigo}</code></td>
                        <td>${item.desc}</td>
                        <td>${this._getCategoria(item)}</td>
                        <td><span class="stock-badge ${badgeClass}">${estado}</span></td>
                    </tr>
                `;
            }).join('');
        }

        this.resultsCount.textContent = `Total: ${filtered.length} activos`;
    }

    _getEstado(item) {
        const seed = parseInt(item.id) || 0;
        const remainder = seed % 3;
        return remainder === 0 ? 'Alto' : remainder === 1 ? 'Medio' : 'Bajo';
    }

    _getCategoria(item) {
        for (const [cat, items] of this.categorias) {
            if (items.some(i => i.id === item.id && i.codigo === item.codigo)) {
                return cat;
            }
        }
        return 'General';
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
