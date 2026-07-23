import { Navigation } from './shared/navigation.js';
import { QRModule } from './modules/qr-generator/qr-module.js';
import { StockFinder } from './modules/stock-finder/stock-finder.js';

// ========== CONTROLADOR PRINCIPAL ==========

class App {
    constructor() {
        console.log('🚀 Iniciando QR Cards Generator...');
        
        // Inicializar navegación
        this.navigation = new Navigation();
        
        // Inicializar módulos
        this.qrModule = new QRModule();
        this.stockFinder = new StockFinder();
        
        // Escuchar cambios de pantalla
        document.addEventListener('screenChange', this._onScreenChange.bind(this));
        
        console.log('✅ Aplicación inicializada correctamente');
    }
    
    _onScreenChange(event) {
        const { screen, index } = event.detail;
        console.log(`📱 Pantalla activa: ${screen} (${index + 1})`);
        
        // Si cambiamos a la pantalla de stock, asegurarse de que los datos estén cargados
        if (screen === 'stock' && this.stockFinder.datos.length === 0) {
            this.stockFinder._cargarDatos();
        }
    }
}

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', () => {
    new App();
});