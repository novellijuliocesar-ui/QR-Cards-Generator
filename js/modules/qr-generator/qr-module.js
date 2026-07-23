import { ExcelLoader } from './excel-loader.js';
import { QRGenerator } from './qr-generator.js';
import { CardRenderer } from './card-renderer.js';
import { mostrarMensaje, sanitizarNombre, debounce } from './qr-utils.js';

export class QRModule {
    constructor() {
        // Estado
        this.excelLoader = new ExcelLoader('messageQR');
        this.datos = [];
        this.currentItem = null;
        this.cachedImage = null;

        // Elementos DOM específicos del módulo QR
        this.elements = {
            searchInput: document.getElementById('searchInputQR'),
            activoSelect: document.getElementById('activoSelectQR'),
            generateBtn: document.getElementById('generateBtnQR'),
            downloadBtn: document.getElementById('downloadCardBtnQR'),
            shareBtn: document.getElementById('shareCardBtnQR'),
            cardContainer: document.getElementById('cardContainerQR'),
            cardNumber: document.getElementById('cardNumberQR'),
            cardQr: document.getElementById('cardQrQR'),
            cardCode: document.getElementById('cardCodeQR'),
            cardDesc: document.getElementById('cardDescQR'),
            loading: document.getElementById('loadingQR'),
            messageId: 'messageQR'
        };

        this.init();
    }

    async init() {
        this._setupEventListeners();
        await this._cargarDatos();
    }

    _setupEventListeners() {
        const debouncedSearch = debounce(this._handleSearch.bind(this), 300);
        this.elements.searchInput.addEventListener('input', debouncedSearch);
        this.elements.activoSelect.addEventListener('change', this._handleSelect.bind(this));
        this.elements.generateBtn.addEventListener('click', this._handleGenerate.bind(this));
        this.elements.downloadBtn.addEventListener('click', this._handleDownload.bind(this));
        this.elements.shareBtn.addEventListener('click', this._handleShare.bind(this));
    }

    async _cargarDatos() {
        this.datos = await this.excelLoader.cargar();
        this._poblarSelect();
    }

    _poblarSelect() {
        const select = this.elements.activoSelect;
        const data = this.excelLoader.obtenerDatos();
        
        select.innerHTML = '<option value="">-- Seleccionar --</option>';
        
        if (data.length === 0) {
            select.innerHTML = '<option value="">-- Sin datos --</option>';
            return;
        }

        data.forEach((item) => {
            const opt = document.createElement('option');
            const realIndex = this.datos.findIndex(d => d.id === item.id && d.codigo === item.codigo);
            opt.value = realIndex;
            const label = item.desc.length > 50 ? item.desc.substring(0, 50) + '...' : item.desc;
            opt.textContent = `${item.codigo} - ${label}`;
            select.appendChild(opt);
        });
    }

    _handleSearch() {
        const term = this.elements.searchInput.value;
        this.excelLoader.filtrar(term);
        this._poblarSelect();

        const count = this.excelLoader.obtenerDatos().length;
        if (term.trim() && count > 0) {
            mostrarMensaje(this.elements.messageId, `🔍 ${count} resultados encontrados`, 'success');
        } else if (term.trim() && count === 0) {
            mostrarMensaje(this.elements.messageId, '🔍 No se encontraron resultados', 'info');
        }
    }

    _handleSelect() {
        const index = parseInt(this.elements.activoSelect.value);
        this.currentItem = this.excelLoader.obtenerPorIndice(index);
        
        if (this.currentItem) {
            mostrarMensaje(this.elements.messageId, `✅ Seleccionado: ${this.currentItem.codigo}`, 'success');
        }
    }

    async _handleGenerate() {
        if (!this.currentItem) {
            mostrarMensaje(this.elements.messageId, '❌ Primero selecciona un activo de la lista', 'error');
            return;
        }

        this.elements.loading.style.display = 'block';
        this.elements.cardContainer.style.display = 'none';

        try {
            const { id, codigo, desc } = this.currentItem;
            await this._mostrarQR(id);
            this.cachedImage = await CardRenderer.generarImagen(id, codigo, desc);
            this.elements.cardNumber.textContent = id;
            this.elements.cardCode.textContent = codigo;
            this.elements.cardDesc.textContent = desc || 'Sin descripción';
            this.elements.cardContainer.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje(this.elements.messageId, '❌ Error al generar la tarjeta', 'error');
        } finally {
            this.elements.loading.style.display = 'none';
        }
    }

    async _mostrarQR(id) {
        const container = this.elements.cardQr;
        container.innerHTML = '';
        const canvas = await QRGenerator.generarQR(id, 200, 1);
        container.appendChild(canvas);
    }

    async _handleDownload() {
        if (!this.currentItem) return;

        try {
            let img = this.cachedImage;
            if (!img) {
                const { id, codigo, desc } = this.currentItem;
                img = await CardRenderer.generarImagen(id, codigo, desc);
            }

            const link = document.createElement('a');
            const nombre = sanitizarNombre(this.currentItem.codigo);
            link.download = `tarjeta-${nombre}.png`;
            link.href = img;
            link.click();
            mostrarMensaje(this.elements.messageId, '📥 Tarjeta descargada', 'success');
        } catch (error) {
            mostrarMensaje(this.elements.messageId, '❌ Error al descargar', 'error');
        }
    }

    async _handleShare() {
        if (!this.currentItem) return;

        try {
            let img = this.cachedImage;
            if (!img) {
                const { id, codigo, desc } = this.currentItem;
                img = await CardRenderer.generarImagen(id, codigo, desc);
            }

            const blob = await (await fetch(img)).blob();
            const file = new File([blob], 'tarjeta.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Tarjeta QR',
                    text: `Tarjeta para ${this.currentItem.codigo}`,
                    files: [file]
                });
                mostrarMensaje(this.elements.messageId, '📤 Compartido correctamente', 'success');
            } else {
                mostrarMensaje(this.elements.messageId, '📱 Compartir no soportado, se descargará', 'info');
                this._handleDownload();
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                mostrarMensaje(this.elements.messageId, '❌ Error al compartir', 'error');
            }
        }
    }
}