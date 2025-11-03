// Image Zoom Feature
class ImageZoom {
    constructor() {
        this.init();
    }

    init() {
        // Create zoom container
        this.zoomContainer = document.createElement('div');
        this.zoomContainer.className = 'event-image-zoom';
        document.body.appendChild(this.zoomContainer);

        // Create close button
        this.closeButton = document.createElement('div');
        this.closeButton.className = 'event-image-zoom-close';
        this.closeButton.innerHTML = '<i class="fas fa-times"></i>';
        this.zoomContainer.appendChild(this.closeButton);

        // Create zoom image
        this.zoomImage = document.createElement('img');
        this.zoomContainer.appendChild(this.zoomImage);

        this.bindEvents();
    }

    bindEvents() {
        // Close on button click
        this.closeButton.addEventListener('click', () => this.close());

        // Close on background click
        this.zoomContainer.addEventListener('click', (e) => {
            if (e.target === this.zoomContainer) {
                this.close();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });

        // Delegate event listeners for event images
        document.addEventListener('click', (e) => {
            const img = e.target.closest('.event-image');
            if (img && !img.closest('.event-image-container').classList.contains('error')) {
                this.open(img.getAttribute('data-original') || img.src);
            }
        });
    }

    open(src) {
        // Show the container
        this.zoomContainer.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Load the high resolution image
        const img = new Image();
        img.onload = () => {
            this.zoomImage.src = src;
            this.zoomImage.classList.add('loaded');
        };
        img.src = src;
    }

    close() {
        this.zoomContainer.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            this.zoomImage.src = '';
            this.zoomImage.classList.remove('loaded');
        }, 300);
    }
}

// Initialize the zoom feature
document.addEventListener('DOMContentLoaded', () => {
    window.imageZoom = new ImageZoom();
});