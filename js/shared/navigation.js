// ========== NAVEGACIÓN ENTRE PANTALLAS ==========

export class Navigation {
    constructor() {
        this.screens = [];
        this.currentIndex = 0;
        this.totalScreens = 0;
        
        // Elementos DOM
        this.navPrev = document.getElementById('navPrev');
        this.navNext = document.getElementById('navNext');
        this.screenIndicator = document.getElementById('screenIndicator');
        this.screenTitle = document.getElementById('screenTitle');
        
        // Títulos de las pantallas
        this.screenTitles = [
            'Generador de QR',
            'Buscador de Stock'
        ];
        
        this.init();
    }
    
    init() {
        // Obtener todas las pantallas
        this.screens = document.querySelectorAll('.screen');
        this.totalScreens = this.screens.length;
        
        // Configurar eventos
        this.navPrev.addEventListener('click', () => this.goTo(this.currentIndex - 1));
        this.navNext.addEventListener('click', () => this.goTo(this.currentIndex + 1));
        
        // Mostrar la primera pantalla
        this.goTo(0);
    }
    
    goTo(index) {
        // Validar índice
        if (index < 0 || index >= this.totalScreens) return;
        
        // Ocultar todas las pantallas
        this.screens.forEach(screen => screen.classList.remove('active'));
        
        // Mostrar la pantalla seleccionada
        this.screens[index].classList.add('active');
        this.currentIndex = index;
        
        // Actualizar indicadores
        this.screenIndicator.textContent = `${index + 1}/${this.totalScreens}`;
        this.screenTitle.textContent = this.screenTitles[index] || `Pantalla ${index + 1}`;
        
        // Actualizar botones de navegación
        this.navPrev.disabled = (index === 0);
        this.navNext.disabled = (index === this.totalScreens - 1);
        
        // Disparar evento personalizado para que los módulos sepan que están activos
        const event = new CustomEvent('screenChange', {
            detail: { 
                screen: this.screens[index].dataset.screen,
                index: index
            }
        });
        document.dispatchEvent(event);
    }
    
    // Método para ir a una pantalla específica por nombre
    goToScreen(screenName) {
        const screen = document.querySelector(`.screen[data-screen="${screenName}"]`);
        if (!screen) return;
        const index = Array.from(this.screens).indexOf(screen);
        if (index !== -1) this.goTo(index);
    }
}