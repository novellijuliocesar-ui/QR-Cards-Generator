import { StockLoader } from './stock-loader.js';
import { mostrarMensajeStock, formatearCantidad, getStockLevel } from './stock-utils.js';

export class StockFinder {
    constructor() {
        this.stockLoader = new StockLoader('messageStock');
        this.datos = [];
        this.resultados = [];

        // Elementos DOM específicos del módulo Stock
        this.elements = {
            searchInput: document.getElementById('searchInputStock'),
            searchBtn: document.getElementById('searchStockBtn'),
            resultsContainer: document.getElementById('resultsContainerStock'),
            resultsList: document.getElementById('stockResultsList'),
            loading: document.getElementById('loadingStock'),
            messageId: 'messageStock'
        };

        this.init();
    }

    async init() {
        this._setupEventListeners();
        await this._cargarDatos();
    }

    _setupEventListeners() {
        this.elements.searchBtn.addEventListener('click', this._handleSearch.bind(this));
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this._handleSearch();
            }
        });
    }

    async _cargarDatos() {
        this.datos = await this.stockLoader.cargar();
    }

    async _handleSearch() {
        const term = this.elements.searchInput.value.trim();
        
        if (!term) {
            mostrarMensajeStock(this.elements.messageId, '📝 Escribe un código o descripción para buscar', 'info');
            this.elements.resultsContainer.style.display = 'none';
            return;
        }

        this.elements.loading.style.display = 'block';
        this.elements.resultsContainer.style.display = 'none';

        try {
            // Simular un pequeño retraso para la búsqueda
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.resultados = this.stockLoader.buscar(term);
            this._mostrarResultados();
            
            if (this.resultados.length === 0) {
                mostrarMensajeStock(this.elements.messageId, `🔍 No se encontraron productos con "${term}"`, 'info');
            } else {
                mostrarMensajeStock(this.elements.messageId, `✅ ${this.resultados.length} productos encontrados`, 'success');
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            mostrarMensajeStock(this.elements.messageId, '❌ Error al buscar en el stock', 'error');
        } finally {
            this.elements.loading.style.display = 'none';
        }
    }

    _mostrarResultados() {
        const container = this.elements.resultsContainer;
        const list = this.elements.resultsList;
        
        if (this.resultados.length === 0) {
            list.innerHTML = `
                <div class="stock-not-found">
                    <div class="icon">🔍</div>
                    <p>No se encontraron productos</p>
                    <small>Intenta con otro término de búsqueda</small>
                </div>
            `;
            container.style.display = 'block';
            return;
        }

        list.innerHTML = this.resultados.map(item => {
            const stockLevel = getStockLevel(item.stock);
            const stockClass = stockLevel === 'high' ? '' : stockLevel;
            const stockLabel = stockLevel === 'high' ? '✓ Stock' : 
                              stockLevel === 'medium' ? '⚠️ Bajo' : '❌ Agotado';
            
            return `
                <div class="stock-item">
                    <span class="code">${item.codigo}</span>
                    <span class="desc">${item.desc}</span>
                    <span class="stock-qty ${stockClass}">
                        ${formatearCantidad(item.stock)} ${stockLabel}
                    </span>
                </div>
            `;
        }).join('');

        container.style.display = 'block';
    }
}