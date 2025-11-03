// Gestion des labels flottants
document.querySelectorAll('.floating-label .form-control').forEach(input => {
    const updateFloatingLabel = () => {
        input.classList.toggle('has-value', input.value.trim() !== '');
    };
    
    input.addEventListener('input', updateFloatingLabel);
    input.addEventListener('change', updateFloatingLabel);
    updateFloatingLabel(); // État initial
});

// Gestion des uploads d'images
class ImageUploader {
    constructor(containerSelector) {
        // Accept either a selector string, a DOM element, a NodeList or an array-like collection
        if (typeof containerSelector === 'string') {
            this.container = document.querySelector(containerSelector);
        } else if (containerSelector instanceof Element) {
            this.container = containerSelector;
        } else if (containerSelector && (containerSelector instanceof NodeList || Array.isArray(containerSelector))) {
            this.container = containerSelector[0];
        } else if (containerSelector && containerSelector.length && containerSelector[0] instanceof Element) {
            // jQuery-style or array-like
            this.container = containerSelector[0];
        } else {
            console.warn('ImageUploader: container not found or invalid:', containerSelector);
            return;
        }

    if (!this.container) return;

    console.log('ImageUploader: constructor called with container:', containerSelector, 'resolved container:', this.container);

        // Support multiple possible upload zone class names used in templates
        // The container passed may be either the upload-zone itself or a parent containing it.
        if (this.container.matches && (this.container.matches('.image-upload-zone') || this.container.matches('.upload-zone') || this.container.matches('.file-upload') || this.container.matches('.upload-placeholder'))) {
            this.uploadZone = this.container;
        } else {
            this.uploadZone = this.container.querySelector('.image-upload-zone') ||
                              this.container.querySelector('.upload-zone') ||
                              this.container.querySelector('.file-upload') ||
                              this.container.querySelector('.upload-placeholder');
        }
    this.fileInput = this.container.querySelector('input[type="file"]') || (this.uploadZone && this.uploadZone.querySelector('input[type="file"]'));
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        
        this.initializeUploader();
    }

    initializeUploader() {
        // Drag & Drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            if (this.uploadZone) {
                this.uploadZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            if (this.uploadZone) {
                this.uploadZone.addEventListener(eventName, () => {
                    this.uploadZone.classList.add('drag-over');
                });
            }
        });

        ['dragleave', 'drop'].forEach(eventName => {
            if (this.uploadZone) {
                this.uploadZone.addEventListener(eventName, () => {
                    this.uploadZone.classList.remove('drag-over');
                });
            }
        });

        if (!this.uploadZone) {
            console.warn('ImageUploader: upload zone not found inside container', this.container);
            return;
        }

        // Prevent double-instantiation if an uploader was already attached to this zone
        try {
            if (this.uploadZone && this.uploadZone.dataset && this.uploadZone.dataset.uploaderAttached) {
                console.log('ImageUploader: uploadZone already has uploader attached, skipping initialization');
                return;
            }
        } catch (e) { /* ignore */ }

        console.log('ImageUploader: uploadZone found:', this.uploadZone, 'fileInput:', this.fileInput);

        if (this.uploadZone) {
            // Handle file drop
            this.uploadZone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length) {
                    this.handleFiles(files);
                }
            });

            // Make the upload zone clickable to open file selector
            this.uploadZone.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('ImageUploader: uploadZone clicked');
                if (this.fileInput) {
                    try {
                        // Prevent multiple file dialog openings across multiple uploader instances
                        if (window.__fileDialogOpen) {
                            console.log('ImageUploader: file dialog already open, skipping click');
                            return;
                        }
                        console.log('ImageUploader: triggering file input click');
                        // Some browsers block programmatic click when the input is display:none.
                        // Ensure the input is temporarily visible (off-screen) before clicking.
                        const input = this.fileInput;
                        const computed = window.getComputedStyle(input);
                        // store previous inline styles
                        input.dataset._prevDisplay = input.style.display || '';
                        input.dataset._prevPosition = input.style.position || '';
                        input.dataset._prevLeft = input.style.left || '';

                        if (computed.display === 'none') {
                            input.style.display = 'block';
                            input.style.position = 'absolute';
                            input.style.left = '-9999px';
                            input.dataset._tempShown = '1';
                        }

                        // Attach a one-time change listener and a fallback timer: if no change occurs
                        // within 800ms, create a temporary input in body and click it (workaround for some blockers).
                        let fallbackTimer = null;
                        const changeHandler = () => {
                            if (fallbackTimer) clearTimeout(fallbackTimer);
                            try {
                                // restore will be handled in the normal change handler below
                            } catch (e) {}
                        };

                        if (this.fileInput) {
                            this.fileInput.addEventListener('change', changeHandler, { once: true });
                        }

                        // mark dialog as open for a short window to avoid duplicates
                        try { window.__fileDialogOpen = true; } catch(e){}
                        input.click();
                        setTimeout(() => { try { window.__fileDialogOpen = false; } catch(e){} }, 2000);

                        // Fallback: if no file selected within timeout, create a temp input and trigger it
                        fallbackTimer = setTimeout(() => {
                            try {
                                console.warn('ImageUploader: primary file input did not receive change event; using temporary input fallback');
                                const temp = document.createElement('input');
                                temp.type = 'file';
                                temp.accept = this.acceptedTypes.join(',') || this.fileInput.accept || 'image/*';
                                temp.style.position = 'absolute';
                                temp.style.left = '-9999px';
                                temp.style.top = '0';
                                document.body.appendChild(temp);
                                temp.addEventListener('change', () => {
                                    try {
                                        if (temp.files && temp.files.length) {
                                            this.handleFiles(temp.files);
                                        }
                                    } catch(err) { console.warn('ImageUploader: temp input change handler error', err); }
                                    // ensure flag cleared when change happens
                                    try { window.__fileDialogOpen = false; } catch(e){}
                                    setTimeout(() => temp.remove(), 200);
                                }, { once: true });
                                // Always trigger the fallback temporary input if fallback timer fires
                                try { window.__fileDialogOpen = true; } catch(e){}
                                temp.click();
                                setTimeout(() => { try { window.__fileDialogOpen = false; } catch(e){} }, 2000);
                            } catch (err) {
                                console.error('ImageUploader: fallback temporary input failed', err);
                            }
                        }, 800);
                    } catch (err) {
                        console.warn('ImageUploader: error triggering file input click', err);
                    }
                }
            });
        }

        // Handle file selection
        if (this.fileInput) {
            this.fileInput.addEventListener('change', () => {
                console.log('ImageUploader: fileInput change, files=', this.fileInput.files);
                if (this.fileInput.files.length) {
                    this.handleFiles(this.fileInput.files);
                }

                // If we temporarily changed the input's display to trigger the dialog, restore styles
                try {
                    const input = this.fileInput;
                    if (input && input.dataset && input.dataset._tempShown) {
                        input.style.display = input.dataset._prevDisplay || '';
                        input.style.position = input.dataset._prevPosition || '';
                        input.style.left = input.dataset._prevLeft || '';
                        delete input.dataset._tempShown;
                        delete input.dataset._prevDisplay;
                        delete input.dataset._prevPosition;
                        delete input.dataset._prevLeft;
                    }
                    // Clear the global file dialog flag since a change event occurred
                    try { window.__fileDialogOpen = false; } catch(e){}
                } catch (e) {
                    console.warn('ImageUploader: error restoring file input styles', e);
                }
            });
        }

        // mark attached to avoid duplicate initializations
        try { if (this.uploadZone) this.uploadZone.dataset.uploaderAttached = '1'; } catch(e){}
    }

    async handleFiles(files) {
        for (const file of files) {
            if (!this.validateFile(file)) continue;
            
            try {
                const compressedFile = await this.compressImage(file);
                await this.uploadFile(compressedFile);
                this.displayPreview(URL.createObjectURL(compressedFile));
            } catch (error) {
                console.error('Error processing file:', error);
                this.showError('Une erreur est survenue lors du traitement du fichier');
            }
        }
    }

    validateFile(file) {
        if (!this.acceptedTypes.includes(file.type)) {
            this.showError('Type de fichier non supporté. Utilisez JPG, PNG ou WebP.');
            return false;
        }

        if (file.size > this.maxFileSize) {
            this.showError('Fichier trop volumineux. Maximum 5MB.');
            return false;
        }

        return true;
    }

    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions while maintaining aspect ratio
                    let width = img.width;
                    let height = img.height;
                    const maxDimension = 1200;
                    
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height *= maxDimension / width;
                            width = maxDimension;
                        } else {
                            width *= maxDimension / height;
                            height = maxDimension;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: new Date().getTime()
                            }));
                        } else {
                            reject(new Error('Compression failed'));
                        }
                    }, 'image/jpeg', 0.8);
                };
                img.onerror = () => reject(new Error('Image loading failed'));
            };
            reader.onerror = () => reject(new Error('File reading failed'));
        });
    }

    async uploadFile(file) {
        // Créer un conteneur pour la progression
        const progressContainer = document.createElement('div');
        progressContainer.className = 'upload-progress';
        progressContainer.innerHTML = `
            <div class="progress-bar">
                <div style="width: 0%"></div>
            </div>
            <div class="progress-text">Préparation de l'upload...</div>
        `;
        this.uploadZone.appendChild(progressContainer);

        try {
            // Prefer real upload via SupabaseAPI when available
            let uploadedUrl = null;
            const uploadFolder = this.container.dataset.folder || this.container.dataset.type || 'formations';

            if (window.SupabaseAPI && typeof window.SupabaseAPI.uploadImage === 'function') {
                progressContainer.querySelector('.progress-text').textContent = 'Upload vers le serveur...';
                try {
                    uploadedUrl = await window.SupabaseAPI.uploadImage(file, uploadFolder);
                    console.log('✅ Uploaded URL reçu depuis SupabaseAPI:', uploadedUrl);
                    progressContainer.querySelector('.progress-bar > div').style.width = '100%';
                    progressContainer.querySelector('.progress-text').textContent = 'Upload terminé !';
                } catch (err) {
                    console.error('❌ Erreur upload Supabase:', err);
                    throw err;
                }
            } else {
                // Fallback to simulated upload
                await this.simulateUpload(progressContainer);
                // For fallback, create an object URL so callers can use it as a preview/uploadedUrl
                try {
                    uploadedUrl = URL.createObjectURL(file);
                    console.log('ImageUploader: fallback simulated upload, using object URL as uploadedUrl:', uploadedUrl);
                } catch (e) {
                    console.warn('ImageUploader: cannot create object URL for fallback:', e);
                }
            }

            // Clean up progress UI
            setTimeout(() => {
                progressContainer.remove();
            }, 500);

            // If we have an uploaded URL, propagate it to any hidden inputs
            if (uploadedUrl) {
                // Try common hidden input selectors
                const hiddenUrlInput = this.container.querySelector('#imageUrl') ||
                                       this.container.querySelector('input[name="imageUrl"]') ||
                                       this.container.querySelector('input[type="hidden"]');
                if (hiddenUrlInput) hiddenUrlInput.value = uploadedUrl;

                // Also store it on the file input dataset for later retrieval
                if (this.fileInput) this.fileInput.dataset.uploadedUrl = uploadedUrl;

                // If the container has a preview img element, update it
                const previewImg = this.container.querySelector('img');
                if (previewImg) previewImg.src = uploadedUrl;
                // Dispatch a custom event on the container so other modules can react
                try {
                    console.log('ImageUploader: dispatching imageUploaded on container with url=', uploadedUrl);
                    this.container.dispatchEvent(new CustomEvent('imageUploaded', { detail: { url: uploadedUrl } }));
                } catch (e) {
                    // ignore if dispatch fails
                }
            }

        } catch (error) {
            progressContainer.remove();
            this.showError('Erreur lors de l\'upload: ' + (error.message || error));
            throw error;
        }
    }

    // À remplacer par l'upload réel vers Supabase
    simulateUpload(progressContainer) {
        return new Promise((resolve) => {
            const progressBar = progressContainer.querySelector('.progress-bar > div');
            const progressText = progressContainer.querySelector('.progress-text');
            let progress = 0;
            
            const interval = setInterval(() => {
                progress += 5;
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `Upload en cours... ${progress}%`;
                
                if (progress >= 100) {
                    clearInterval(interval);
                    progressText.textContent = 'Upload terminé !';
                    resolve();
                }
            }, 100);
        });
    }

    displayPreview(url) {
        // Create preview element but do not wipe out the upload zone (preserve hidden inputs)
        const existingPreview = this.uploadZone.querySelector('.image-preview');
        if (existingPreview) existingPreview.remove();

        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.innerHTML = `
            <img src="${url}" alt="Aperçu">
            <div class="image-actions">
                <button class="btn btn-danger" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Gérer la suppression
        const deleteBtn = preview.querySelector('.btn-danger');
        deleteBtn.addEventListener('click', () => {
            preview.remove();
            this.resetUpload();
        });

        // Append preview while preserving inputs (hidden inputs remain)
        // Hide any placeholder if present
        const placeholder = this.uploadZone.querySelector('.upload-placeholder') || this.uploadZone.querySelector('.file-upload');
        if (placeholder) placeholder.style.display = 'none';

        this.uploadZone.appendChild(preview);
    }

    resetUpload() {
        try {
            if (this.fileInput) {
                this.fileInput.value = '';
                delete this.fileInput.dataset.uploadedUrl;
            }
            // Remove only the preview element and show placeholder again
            const preview = this.uploadZone.querySelector('.image-preview');
            if (preview) preview.remove();
            const placeholder = this.uploadZone.querySelector('.upload-placeholder') || this.uploadZone.querySelector('.file-upload');
            if (placeholder) placeholder.style.display = '';

            // Also clear any hidden inputs within this container (commonly #imageUrl)
            const hidden = this.uploadZone.querySelector('#imageUrl') || this.uploadZone.querySelector('input[name="imageUrl"]') || this.uploadZone.querySelector('input[type="hidden"]');
            if (hidden) hidden.value = '';
        } catch (err) {
            console.warn('ImageUploader.resetUpload error', err);
        }
    }

    showError(message) {
        // TODO: Implémenter un système de notification plus élégant
        alert(message);
    }
}

// Initialisation des uploaders d'images
document.addEventListener('DOMContentLoaded', () => {
    const uploaders = document.querySelectorAll('.image-upload-container');
    uploaders.forEach(container => {
        new ImageUploader(container);
    });
});