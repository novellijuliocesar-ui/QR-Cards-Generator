// ========== NAVEGACIÓN POR SWIPE ==========

export class SwipeNavigation {
    constructor() {
        this.wrapper = document.getElementById('pagesWrapper');
        this.pages = this.wrapper.querySelectorAll('.page');
        this.dots = document.querySelectorAll('.dot');
        this.currentPage = 0;
        this.totalPages = this.pages.length;
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.isAnimating = false;

        this._init();
    }

    _init() {
        // Configurar contenedor para swipe
        this.wrapper.style.display = 'flex';
        this.wrapper.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.wrapper.style.willChange = 'transform';

        // Aplicar anchos
        this.pages.forEach(page => {
            page.style.flex = '0 0 100%';
            page.style.width = '100%';
            page.style.minHeight = '100vh';
        });

        // Eventos táctiles
        this.wrapper.addEventListener('touchstart', this._handleTouchStart.bind(this));
        this.wrapper.addEventListener('touchmove', this._handleTouchMove.bind(this));
        this.wrapper.addEventListener('touchend', this._handleTouchEnd.bind(this));

        // Eventos mouse (para desarrollo en escritorio)
        this.wrapper.addEventListener('mousedown', this._handleMouseDown.bind(this));
        this.wrapper.addEventListener('mousemove', this._handleMouseMove.bind(this));
        this.wrapper.addEventListener('mouseup', this._handleMouseUp.bind(this));
        this.wrapper.addEventListener('mouseleave', this._handleMouseUp.bind(this));

        // Dots click
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToPage(index));
        });

        // Ir a primera página
        this.goToPage(0, false);
    }

    _handleTouchStart(e) {
        if (this.isAnimating) return;
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.currentX = this.startX;
        this.wrapper.style.transition = 'none';
    }

    _handleTouchMove(e) {
        if (!this.isDragging || this.isAnimating) return;
        this.currentX = e.touches[0].clientX;
        const diff = this.currentX - this.startX;
        const offset = -this.currentPage * window.innerWidth + diff;
        this.wrapper.style.transform = `translateX(${offset}px)`;
    }

    _handleTouchEnd(e) {
        if (!this.isDragging || this.isAnimating) return;
        this.isDragging = false;
        this.wrapper.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        const diff = this.currentX - this.startX;
        const threshold = window.innerWidth * 0.2;

        if (diff < -threshold && this.currentPage < this.totalPages - 1) {
            this.goToPage(this.currentPage + 1);
        } else if (diff > threshold && this.currentPage > 0) {
            this.goToPage(this.currentPage - 1);
        } else {
            this.goToPage(this.currentPage);
        }
    }

    _handleMouseDown(e) {
        if (this.isAnimating) return;
        this.isDragging = true;
        this.startX = e.clientX;
        this.currentX = this.startX;
        this.wrapper.style.transition = 'none';
        this.wrapper.style.cursor = 'grabbing';
    }

    _handleMouseMove(e) {
        if (!this.isDragging || this.isAnimating) return;
        this.currentX = e.clientX;
        const diff = this.currentX - this.startX;
        const offset = -this.currentPage * window.innerWidth + diff;
        this.wrapper.style.transform = `translateX(${offset}px)`;
    }

    _handleMouseUp(e) {
        if (!this.isDragging || this.isAnimating) return;
        this.isDragging = false;
        this.wrapper.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.wrapper.style.cursor = 'grab';
        
        const diff = this.currentX - this.startX;
        const threshold = window.innerWidth * 0.2;

        if (diff < -threshold && this.currentPage < this.totalPages - 1) {
            this.goToPage(this.currentPage + 1);
        } else if (diff > threshold && this.currentPage > 0) {
            this.goToPage(this.currentPage - 1);
        } else {
            this.goToPage(this.currentPage);
        }
    }

    goToPage(index, animate = true) {
        if (this.isAnimating) return;
        if (index < 0 || index >= this.totalPages) return;

        this.isAnimating = true;
        this.currentPage = index;

        if (!animate) {
            this.wrapper.style.transition = 'none';
        } else {
            this.wrapper.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }

        const offset = -index * window.innerWidth;
        this.wrapper.style.transform = `translateX(${offset}px)`;

        // Actualizar dots
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        // Disparar evento personalizado
        const event = new CustomEvent('pagechange', { 
            detail: { page: index, pageId: this.pages[index].id }
        });
        document.dispatchEvent(event);

        setTimeout(() => {
            this.isAnimating = false;
        }, 350);
    }

    // Método para navegar programáticamente
    next() {
        if (this.currentPage < this.totalPages - 1) {
            this.goToPage(this.currentPage + 1);
        }
    }

    prev() {
        if (this.currentPage > 0) {
            this.goToPage(this.currentPage - 1);
        }
    }
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', () => {
    window.navigation = new SwipeNavigation();
});