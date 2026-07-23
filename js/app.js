import { initQR } from './modules/qr-generator.js';
import { initStock } from './modules/stock-finder.js';
import { initSwipeNavigation } from './shared/swipe-navigation.js';

// ========== CONTROLADOR PRINCIPAL ==========

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando QR Cards Generator...');
    
    // Inicializar navegación
    const nav = initNavigation();
    
    // Inicializar swipe
    initSwipeNavigation(
        nav.goTo,
        () => nav.currentIndex,
        () => nav.totalScreens
    );
    
    // Inicializar módulos
    initQR();
    initStock();
    
    console.log('✅ Aplicación inicializada');
});

function initNavigation() {
    const screens = document.querySelectorAll('.screen');
    const navPrev = document.getElementById('navPrev');
    const navNext = document.getElementById('navNext');
    const screenIndicator = document.getElementById('screenIndicator');
    const screenTitle = document.getElementById('screenTitle');
    const screenTitles = ['Generador de QR', 'Buscador de Stock'];
    let currentIndex = 0;
    const totalScreens = screens.length;

    function goTo(index) {
        if (index < 0 || index >= screens.length) return;
        screens.forEach(s => s.classList.remove('active'));
        screens[index].classList.add('active');
        currentIndex = index;
        screenIndicator.textContent = `${index + 1}/${screens.length}`;
        screenTitle.textContent = screenTitles[index];
        navPrev.disabled = (index === 0);
        navNext.disabled = (index === screens.length - 1);
    }

    navPrev.addEventListener('click', () => goTo(currentIndex - 1));
    navNext.addEventListener('click', () => goTo(currentIndex + 1));
    goTo(0);

    return {
        goTo,
        currentIndex,
        totalScreens
    };
}