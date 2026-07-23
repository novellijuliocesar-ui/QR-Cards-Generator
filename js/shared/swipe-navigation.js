// ========== NAVEGACIÓN POR DESLIZAMIENTO ==========

export function initSwipeNavigation(goToCallback, getCurrentIndex, getTotalScreens) {
    let touchStartX = 0;
    let touchEndX = 0;
    const SWIPE_THRESHOLD = 50;

    const container = document.querySelector('.screens-container');
    if (!container) return;

    // ===== EVENTOS TÁCTILES =====
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    // ===== EVENTOS DE RATÓN (escritorio) =====
    let mouseStartX = 0;
    let isMouseDown = false;

    container.addEventListener('mousedown', (e) => {
        mouseStartX = e.screenX;
        isMouseDown = true;
    });

    container.addEventListener('mouseup', (e) => {
        if (!isMouseDown) return;
        isMouseDown = false;
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

        if (diff > 0) {
            if (currentIndex < totalScreens - 1) {
                goToCallback(currentIndex + 1);
                if (navigator.vibrate) navigator.vibrate(10);
            }
        } else {
            if (currentIndex > 0) {
                goToCallback(currentIndex - 1);
                if (navigator.vibrate) navigator.vibrate(10);
            }
        }
    }

    return {
        destroy: () => {
            container.removeEventListener('touchstart', null);
            container.removeEventListener('touchend', null);
            container.removeEventListener('mousedown', null);
            container.removeEventListener('mouseup', null);
        }
    };
}
