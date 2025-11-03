// Gestion des formulaires modernes
window.showFormationModal = function(formation = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.innerHTML = `
        <i class="fas fa-graduation-cap"></i>
        ${formation ? 'Modifier la formation' : 'Ajouter une formation'}
    `;

    const formHTML = `
        <form id="formationForm" class="modern-form">
            <div class="form-section">
                <h4><i class="fas fa-info-circle"></i> Informations générales</h4>
                
                <div class="form-group floating-label">
                    <input type="text" id="title" name="title" value="${formation?.title || ''}" required
                           class="form-control" placeholder=" ">
                    <label for="title">Titre de la formation <span class="required">*</span></label>
                    <div class="form-icon"><i class="fas fa-graduation-cap"></i></div>
                </div>
                
                <div class="form-row">
                    <div class="form-group floating-label">
                        <select id="category" name="category" required class="form-control">
                            <option value="">Choisir une catégorie</option>
                            <option value="ecole-du-code" ${formation?.category === 'ecole-du-code' ? 'selected' : ''}>École du Code</option>
                            <option value="fablab" ${formation?.category === 'fablab' ? 'selected' : ''}>FabLab</option>
                        </select>
                        <label for="category">Catégorie <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-layer-group"></i></div>
                    </div>
                    <div class="form-group floating-label">
                        <select id="status" name="status" class="form-control">
                            <option value="active" ${formation?.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${formation?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                        <label for="status">Statut</label>
                        <div class="form-icon"><i class="fas fa-toggle-on"></i></div>
                    </div>
                </div>
                
                <div class="form-group floating-label">
                    <textarea id="description" name="description" rows="4" class="form-control" 
                              placeholder=" ">${formation?.description || ''}</textarea>
                    <label for="description">Description</label>
                    <div class="form-icon"><i class="fas fa-align-left"></i></div>
                </div>
            </div>
            
            <div class="form-section">
                <h4><i class="fas fa-calendar-alt"></i> Planning</h4>
                
                <div class="form-row">
                    <div class="form-group floating-label">
                        <input type="date" id="dateStart" name="dateStart" 
                               value="${formation?.dateStart || ''}" required class="form-control">
                        <label for="dateStart">Date de début <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-calendar-plus"></i></div>
                    </div>
                    <div class="form-group floating-label">
                        <input type="date" id="dateEnd" name="dateEnd" 
                               value="${formation?.dateEnd || ''}" required class="form-control">
                        <label for="dateEnd">Date de fin <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-calendar-minus"></i></div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group floating-label">
                        <input type="time" id="timeStart" name="timeStart" 
                               value="${formation?.timeStart || ''}" required class="form-control">
                        <label for="timeStart">Heure de début <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-clock"></i></div>
                    </div>
                    <div class="form-group floating-label">
                        <input type="time" id="timeEnd" name="timeEnd" 
                               value="${formation?.timeEnd || ''}" required class="form-control">
                        <label for="timeEnd">Heure de fin <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-clock"></i></div>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h4><i class="fas fa-map-marker-alt"></i> Localisation</h4>
                
                <div class="form-row">
                    <div class="form-group floating-label">
                        <select id="city" name="city" required class="form-control">
                            <option value="">Choisir une ville</option>
                            <option value="rabat" ${formation?.city === 'rabat' ? 'selected' : ''}>Rabat</option>
                            <option value="agadir" ${formation?.city === 'agadir' ? 'selected' : ''}>Agadir</option>
                            <option value="benmisk" ${formation?.city === 'benmisk' ? 'selected' : ''}>Ben M'sik</option>
                            <option value="sidimaarouf" ${formation?.city === 'sidimaarouf' ? 'selected' : ''}>Sidi Maarouf</option>
                        </select>
                        <label for="city">Ville <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-city"></i></div>
                    </div>
                    <div class="form-group floating-label">
                        <input type="number" id="maxParticipants" name="maxParticipants" 
                               value="${formation?.maxParticipants || ''}" min="1" max="100" required class="form-control" placeholder=" ">
                        <label for="maxParticipants">Participants max <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-users"></i></div>
                    </div>
                </div>
                
                <div class="form-group floating-label">
                    <input type="text" id="location" name="location" value="${formation?.location || ''}"
                           class="form-control" placeholder=" ">
                    <label for="location">Lieu exact</label>
                    <div class="form-icon"><i class="fas fa-map-pin"></i></div>
                </div>
            </div>
            
            <div class="form-section">
                <h4><i class="fas fa-image"></i> Image de la formation</h4>
                <div class="image-upload-zone" id="formationImageUploader">
                    <div class="file-upload" style="display: ${formation?.image ? 'none' : 'flex'}">
                        <input type="file" id="formationImageFile" accept="image/*" onchange="handleFormationImageUpload(this)">
                        <label for="formationImageFile">
                            <div class="upload-content">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Cliquez ou glissez une image ici</p>
                                <small>PNG, JPG, JPEG jusqu'à 5MB</small>
                            </div>
                        </label>
                    </div>
                    <div class="image-preview" id="formationImagePreview" style="display: ${formation?.image ? 'block' : 'none'}">
                        <img id="formationPreviewImg" src="${formation?.image || ''}" alt="Aperçu">
                        <div class="image-actions">
                            <button type="button" class="btn btn-sm btn-outline" onclick="changeFormationImage()" title="Changer l'image">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-danger" onclick="removeFormationImage()" title="Supprimer l'image">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="upload-progress" style="display: none;">
                        <div class="progress-bar"></div>
                        <div class="progress-text">Upload en cours... 0%</div>
                    </div>
                </div>
                <input type="hidden" id="image" name="image" value="${formation?.image || ''}">
            </div>
            
            <div class="form-section">
                <h4><i class="fas fa-link"></i> Inscription</h4>
                
                <div class="form-group floating-label">
                    <input type="url" id="registrationLink" name="registrationLink" 
                           value="${formation?.registrationLink || ''}" class="form-control" placeholder=" ">
                    <label for="registrationLink">Lien d'inscription</label>
                    <div class="form-icon"><i class="fas fa-external-link-alt"></i></div>
                    <small class="form-help">Lien vers le formulaire d'inscription Google Forms ou autre</small>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                    <i class="fas fa-times"></i> Annuler
                </button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i>
                    ${formation ? 'Mettre à jour la formation' : 'Créer la formation'}
                </button>
            </div>
        </form>
    `;

    modalBody.innerHTML = formHTML;
    
    // Activer les labels flottants
    document.querySelectorAll('.floating-label input, .floating-label textarea, .floating-label select').forEach(input => {
        if (input.value) {
            input.classList.add('has-value');
        }
        
        input.addEventListener('focus', () => {
            input.classList.add('has-focus');
        });
        
        input.addEventListener('blur', () => {
            input.classList.remove('has-focus');
            if (input.value) {
                input.classList.add('has-value');
            } else {
                input.classList.remove('has-value');
            }
        });
        
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', () => {
                if (input.value) {
                    input.classList.add('has-value');
                } else {
                    input.classList.remove('has-value');
                }
            });
        }
    });

    // Configuration du drag & drop pour l'upload d'images
    const dropZone = document.getElementById('formationImageUploader');
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            dropZone.classList.add('drag-over');
        }

        function unhighlight(e) {
            dropZone.classList.remove('drag-over');
        }

        dropZone.addEventListener('drop', handleDrop, false);
    }

    modal.classList.add('show');
    
    // Configuration de la soumission du formulaire
    const form = document.getElementById('formationForm');
    form.addEventListener('submit', handleFormationSubmit);
};

// Gestion de l'upload d'images
async function handleFormationImageUpload(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('Veuillez sélectionner un fichier image (PNG, JPG, JPEG)', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('L\'image ne doit pas dépasser 5MB', 'error');
        return;
    }

    try {
        const uploader = document.getElementById('formationImageUploader');
        const progressBar = uploader.querySelector('.progress-bar');
        const progressText = uploader.querySelector('.progress-text');
        const uploadProgress = uploader.querySelector('.upload-progress');
        const fileUpload = uploader.querySelector('.file-upload');
        
        // Afficher la barre de progression
        uploadProgress.style.display = 'block';
        fileUpload.style.display = 'none';

        // Fonction pour mettre à jour la progression
        const updateProgress = (percent) => {
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `Upload en cours... ${percent}%`;
        };

        // Simuler le début de l'upload
        updateProgress(0);
        
        // Compression de l'image
        const compressedFile = await window.SupabaseAPI.compressImage(file);
        updateProgress(50);

        // Upload vers Supabase
        const imageUrl = await window.SupabaseAPI.uploadImage(compressedFile, 'formations');
        updateProgress(100);

        // Mettre à jour l'aperçu
        const preview = document.getElementById('formationImagePreview');
        const previewImg = document.getElementById('formationPreviewImg');
        const imageInput = document.getElementById('image');

        if (imageUrl) {
            previewImg.src = imageUrl;
            preview.style.display = 'block';
            imageInput.value = imageUrl;
            
            // Cacher la progression et afficher le succès
            setTimeout(() => {
                uploadProgress.style.display = 'none';
                showNotification('Image uploadée avec succès', 'success');
            }, 500);
        }

    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        showNotification('Erreur lors de l\'upload de l\'image', 'error');
        
        // Réinitialiser l'interface
        const uploader = document.getElementById('formationImageUploader');
        const uploadProgress = uploader.querySelector('.upload-progress');
        const fileUpload = uploader.querySelector('.file-upload');
        
        uploadProgress.style.display = 'none';
        fileUpload.style.display = 'flex';
    }
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        const input = document.getElementById('formationImageFile');
        input.files = files;
        handleFormationImageUpload(input);
    }
}

function changeFormationImage() {
    const preview = document.getElementById('formationImagePreview');
    const fileUpload = document.querySelector('.file-upload');
    
    preview.style.display = 'none';
    fileUpload.style.display = 'flex';
    
    // Déclencher le sélecteur de fichier
    document.getElementById('formationImageFile').click();
}

function removeFormationImage() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;

    const preview = document.getElementById('formationImagePreview');
    const fileUpload = document.querySelector('.file-upload');
    const imageInput = document.getElementById('image');
    const previewImg = document.getElementById('formationPreviewImg');

    // Supprimer l'image de Supabase si nécessaire
    const imageUrl = previewImg.src;
    if (imageUrl.includes('supabase')) {
        window.SupabaseAPI.deleteImage(imageUrl).catch(console.error);
    }

    // Réinitialiser l'interface
    preview.style.display = 'none';
    fileUpload.style.display = 'flex';
    imageInput.value = '';
    previewImg.src = '';

    showNotification('Image supprimée', 'success');
}