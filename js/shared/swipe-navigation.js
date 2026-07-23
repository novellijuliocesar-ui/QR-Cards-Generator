// ========== NAVEGACIÓN POR DESLIZAMIENTO ==========

export function initSwipeNavigation(goToCallback, getCurrentIndex, getTotalScreens) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let isSwiping = false;
    const SWIPE_THRESHOLD = 50;

    const container = document.querySelector('.screens-container');
    if (!container) return;

    // ===== EVENTOS TÁCTILES =====
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        isSwiping = true;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.screenX - touchStartX);
        const deltaY = Math.abs(touch.screenY - touchStartY);
        // Si el movimiento es más horizontal que vertical, prevenir scroll
        if (deltaX > deltaY && deltaX > 10) {
            e.preventDefault();
            // Feedback visual de arrastre
            const diff = touchStartX - touch.screenX;
            const maxDrag = 60;
            const drag = Math.min(Math.abs(diff), maxDrag);
            const screens = document.querySelectorAll('.screen.active');
            screens.forEach(screen => {
                screen.style.transform = `translateX(${-diff * 0.3}px)`;
                screen.style.opacity = 1 - (Math.abs(diff) / (maxDrag * 2));
            });
        }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        touchEndX = e.changedTouches[0].screenX;
        
        // Resetear transformaciones
        document.querySelectorAll('.screen.active').forEach(screen => {
            screen.style.transform = '';
            screen.style.opacity = '';
        });
        
        handleSwipe();
    }, { passive: true });

    // ===== EVENTOS DE RATÓN (escritorio) =====
    let mouseStartX = 0;
    let isMouseDown = false;

    container.addEventListener('mousedown', (e) => {
        mouseStartX = e.screenX;
        isMouseDown = true;
        container.classList.add('dragging');
    });

    container.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        const diff = e.screenX - mouseStartX;
        if (Math.abs(diff) > 10) {
            container.style.cursor = 'grabbing';
            const screens = document.querySelectorAll('.screen.active');
            screens.forEach(screen => {
                screen.style.transform = `translateX(${-diff * 0.2}px)`;
                screen.style.opacity = 1 - (Math.abs(diff) / 120);
            });
        }
    });

    container.addEventListener('mouseup', (e) => {
        if (!isMouseDown) return;
        isMouseDown = false;
        container.classList.remove('dragging');
        container.style.cursor = '';
        
        document.querySelectorAll('.screen.active').forEach(screen => {
            screen.style.transform = '';
            screen.style.opacity = '';
        });
        
        const diff = mouseStartX - e.screenX;
        if (Math.abs(diff) > SWIPE_THRESHOLD) {
            if (diff > 0) {
                goToCallback(getCurrentIndex() + 1);
            } else {
                goToCallback(getCurrentIndex() - 1);
            }
        }
    });

    // ===== FUNCIÓN PRINCIPAL =====
    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) < SWIPE_THRESHOLD) return;

        const currentIndex = getCurrentIndex();
        const totalScreens = getTotalScreens();

        // Determinar dirección y aplicar animación
        const isNext = diff > 0;
        const targetIndex = isNext ? currentIndex + 1 : currentIndex - 1;
        
        if (targetIndex < 0 || targetIndex >= totalScreens) return;

        // Aplicar animación de entrada
        const screens = document.querySelectorAll('.screen');
        const currentScreen = screens[currentIndex];
        const targetScreen = screens[targetIndex];
        
        if (currentScreen && targetScreen) {
            // Salida de la pantalla actual
            currentScreen.style.animation = isNext ? 'slideOutLeft 0.25s ease forwards' : 'slideOutRight 0.25s ease forwards';
            // Entrada de la nueva pantalla
            targetScreen.style.animation = isNext ? 'slideInFromRight 0.3s ease forwards' : 'slideInFromLeft 0.3s ease forwards';
            
            // Limpiar animaciones después de que terminen
            setTimeout(() => {
                currentScreen.style.animation = '';
                targetScreen.style.animation = '';
            }, 400);
        }

        // Navegar
        goToCallback(targetIndex);
        
        // Feedback háptico
        if (navigator.vibrate) navigator.vibrate(8);
    }

    // ===== AÑADIR ANIMACIONES CSS =====
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes slideOutLeft {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(-30px); }
        }
        @keyframes slideOutRight {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(30px); }
        }
        @keyframes slideInFromRight {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
        }
    `;
    document.head.appendChild(styleSheet);

    return {
        destroy: () => {
            container.removeEventListener('touchstart', null);
            container.removeEventListener('touchmove', null);
            container.removeEventListener('touchend', null);
            container.removeEventListener('mousedown', null);
            container.removeEventListener('mousemove', null);
            container.removeEventListener('mouseup', null);
            styleSheet.remove();
        }
    };
}