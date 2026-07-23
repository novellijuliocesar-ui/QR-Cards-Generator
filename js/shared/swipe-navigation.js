// ============================================================
//  NAVEGACIÓN POR DESLIZAMIENTO
// ============================================================

export function initSwipeNavigation(goToCallback, getCurrentIndex, getTotalScreens) {
    const container = document.getElementById('screensContainer');
    if (!container) return;

    let touchStartX = 0;
    let touchEndX = 0;
    const SWIPE_THRESHOLD = 50;

    // ===== TÁCTIL =====
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) < SWIPE_THRESHOLD) return;
        const current = getCurrentIndex();
        const total = getTotalScreens();
        if (diff > 0 && current < total - 1) {
            goToCallback(current + 1);
        } else if (diff < 0 && current > 0) {
            goToCallback(current - 1);
        }
    }, { passive: true });

    // ===== RATÓN (escritorio) =====
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
        if (Math.abs(diff) < SWIPE_THRESHOLD) return;
        const current = getCurrentIndex();
        const total = getTotalScreens();
        if (diff > 0 && current < total - 1) {
            goToCallback(current + 1);
        } else if (diff < 0 && current > 0) {
            goToCallback(current - 1);
        }
    });

    return {
        destroy: () => {
            container.removeEventListener('touchstart', null);
            container.removeEventListener('touchend', null);
            container.removeEventListener('mousedown', null);
            container.removeEventListener('mouseup', null);
        }
    };
}
