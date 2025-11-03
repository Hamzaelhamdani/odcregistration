// Gestionnaire du bouton "Ajouter"
async function handleAddNew(e) {
    if (e) e.preventDefault();
    console.log('📝 Ajout d\'un nouvel élément');

    // Réinitialiser l'ID d'édition
    window.currentEditId = null;
    
    // S'assurer que eventsManager est initialisé
    await window.eventsManager?.initPromise;

    try {
        const currentPage = document.querySelector('.content-page.active')?.id;
        console.log('Page courante:', currentPage);

        if (currentPage === 'formations-page') {
            console.log('➕ Affichage du formulaire de formation');
            showFormationModal();
        } else if (currentPage === 'events-page') {
            console.log('➕ Affichage du formulaire d\'événement');
            if (window.eventsManager && typeof window.eventsManager.showEventModal === 'function') {
                window.eventsManager.showEventModal();
            } else {
                console.error('❌ EventsManager non initialisé ou méthode manquante');
                showNotification('Erreur lors de l\'affichage du formulaire d\'événement', 'error');
            }
        } else {
            console.warn('⚠️ Page non reconnue pour l\'ajout');
            showNotification('Sélectionnez d\'abord la section Formations ou Événements', 'warning');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'affichage du formulaire:', error);
        showNotification('Erreur lors de l\'affichage du formulaire', 'error');
    }
}

// Fallback helper: if user clicks "Ajouter" from another page, switch to formations then open modal
async function handleAddNewFallback(e) {
    if (e) e.preventDefault();
    // If already on formations page, regular handler will open modal
    const currentPage = document.querySelector('.content-page.active')?.id;
    if (currentPage === 'formations-page') {
        return handleAddNew(e);
    }

    // Otherwise, navigate to formations, wait a bit for DOM to update, then open the modal
    if (typeof showPage === 'function') {
        showPage('formations');
    }

    // Wait a short time for the page content to render (small debounce)
    await new Promise(resolve => setTimeout(resolve, 120));

    try {
        console.log('🔁 Fallback: switched to formations page, opening modal');
        showFormationModal();
    } catch (err) {
        console.error('❌ Fallback failed to open formation modal:', err);
        showNotification('Impossible d\'ouvrir le formulaire. Regardez la console pour plus de détails.', 'error');
    }
}

// Attach fallback handler if not already attached
try {
    const addBtn = document.getElementById('addNewBtn');
    if (addBtn) {
        // Remove previous click listeners by replacing the element listener
        addBtn.removeEventListener('click', handleAddNew);
        addBtn.addEventListener('click', handleAddNewFallback);
    }
} catch (e) {
    console.warn('⚠️ Impossible d\'attacher le fallback pour addNewBtn:', e);
}

// Exposer la fonction fallback globalement pour que d'autres scripts puissent l'appeler
try {
    window.handleAddNewFallback = handleAddNewFallback;
} catch (e) {
    // ignore
}

// Gestionnaire du bouton "Ajouter Formation"
function showFormationModal(formation = null) {
    console.log('🎓 Affichage du modal de formation', formation);
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalTitle || !modalBody) {
        console.error('❌ Éléments du modal non trouvés');
        showNotification('Erreur lors de l\'affichage du formulaire', 'error');
        return;
    }

    modalTitle.innerHTML = `
        <i class="fas fa-graduation-cap"></i>
        ${formation ? 'Modifier la formation' : 'Nouvelle formation'}
    `;

    // Construire le formulaire
    modalBody.innerHTML = buildFormationForm(formation);

    // Afficher le modal
    modal.classList.add('show');

    // Initialiser les gestionnaires du formulaire
    initFormationFormHandlers(formation);
}

// Construction du formulaire de formation
function buildFormationForm(formation) {
    return `
        <form id="formationForm" class="modern-form">
            <div class="form-section">
                <h4><i class="fas fa-info-circle"></i> Informations générales</h4>
                
                <div class="form-group floating-label">
                    <input type="text" id="title" name="title" value="${formation?.title || ''}" required class="form-control">
                    <label for="title">Titre de la formation <span class="required">*</span></label>
                    <div class="form-icon"><i class="fas fa-graduation-cap"></i></div>
                </div>
                
                <div class="form-row">
                    <div class="form-group floating-label">
                        <select id="category" name="category" required class="form-control">
                            <option value="">Sélectionner une catégorie</option>
                            <option value="ecole-du-code" ${formation?.category === 'ecole-du-code' ? 'selected' : ''}>École du Code</option>
                            <option value="fablab" ${formation?.category === 'fablab' ? 'selected' : ''}>FabLab</option>
                        </select>
                        <label for="category">Catégorie <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-tag"></i></div>
                    </div>
                    
                    <div class="form-group floating-label">
                        <select id="status" name="status" required class="form-control">
                            <option value="active" ${formation?.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${formation?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                        <label for="status">Statut</label>
                        <div class="form-icon"><i class="fas fa-toggle-on"></i></div>
                    </div>
                </div>
                
                <div class="form-group floating-label">
                    <textarea id="description" name="description" rows="3" required class="form-control">${formation?.description || ''}</textarea>
                    <label for="description">Description <span class="required">*</span></label>
                    <div class="form-icon"><i class="fas fa-align-left"></i></div>
                </div>
            </div>
            
            <div class="form-section">
                <h4><i class="fas fa-calendar"></i> Planning</h4>
                
                <div class="form-row">
                    <div class="form-group floating-label">
                        <input type="date" id="dateStart" name="dateStart" value="${formation?.dateStart || ''}" required class="form-control">
                        <label for="dateStart">Date de début <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-calendar-plus"></i></div>
                    </div>
                    <div class="form-group floating-label">
                        <input type="date" id="dateEnd" name="dateEnd" value="${formation?.dateEnd || ''}" required class="form-control">
                        <label for="dateEnd">Date de fin <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-calendar-minus"></i></div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group floating-label">
                        <input type="time" id="timeStart" name="timeStart" value="${formation?.timeStart || ''}" required class="form-control">
                        <label for="timeStart">Heure de début <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-clock"></i></div>
                    </div>
                    <div class="form-group floating-label">
                        <input type="time" id="timeEnd" name="timeEnd" value="${formation?.timeEnd || ''}" required class="form-control">
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
                            <option value="">Sélectionner une ville</option>
                            <option value="rabat" ${formation?.city === 'rabat' ? 'selected' : ''}>Rabat</option>
                            <option value="agadir" ${formation?.city === 'agadir' ? 'selected' : ''}>Agadir</option>
                            <option value="benmisk" ${formation?.city === 'benmisk' ? 'selected' : ''}>Ben M'sik</option>
                            <option value="sidimaarouf" ${formation?.city === 'sidimaarouf' ? 'selected' : ''}>Sidi Maarouf</option>
                        </select>
                        <label for="city">Ville <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-city"></i></div>
                    </div>
                    <div class="form-group floating-label">
                        <input type="text" id="location" name="location" value="${formation?.location || ''}" required class="form-control">
                        <label for="location">Lieu exact <span class="required">*</span></label>
                        <div class="form-icon"><i class="fas fa-map-pin"></i></div>
                    </div>
                </div>
                
                <div class="form-group floating-label">
                    <input type="number" id="maxParticipants" name="maxParticipants" value="${formation?.maxParticipants || ''}" min="1" required class="form-control">
                    <label for="maxParticipants">Nombre max de participants <span class="required">*</span></label>
                    <div class="form-icon"><i class="fas fa-users"></i></div>
                </div>
            </div>
            
            <div class="form-section">
                <h4><i class="fas fa-image"></i> Image de la formation</h4>
                <div class="image-upload-container">
                    <div class="image-preview" id="imagePreview" style="display: none;">
                        <img src="${formation?.image || ''}" alt="Aperçu" id="previewImg">
                        <div class="image-preview-overlay">
                            <button type="button" class="btn-icon" onclick="changeImage()">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn-icon btn-danger" onclick="removeImage()">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="upload-zone" id="uploadZone">
                        <input type="file" id="image" name="image" accept="image/*" style="display: none;">
                        <div class="upload-message">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>Glissez une image ici ou cliquez pour parcourir</p>
                            <small>JPG, PNG ou GIF - Max 5MB</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h4><i class="fas fa-link"></i> Inscription</h4>
                <div class="form-group floating-label">
                    <input type="url" id="registrationLink" name="registrationLink" value="${formation?.registrationLink || ''}" class="form-control" placeholder="https://forms.google.com/...">
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
                    <i class="fas fa-save"></i> ${formation ? 'Mettre à jour' : 'Créer la formation'}
                </button>
            </div>
        </form>
    `;
}

// Initialisation des gestionnaires du formulaire de formation
function initFormationFormHandlers(formation) {
    const form = document.getElementById('formationForm');
    const imageInput = document.getElementById('image');
    const uploadZone = document.getElementById('uploadZone');
    const imagePreview = document.getElementById('imagePreview');

    if (formation?.image) {
        imagePreview.style.display = 'block';
        uploadZone.style.display = 'none';
    }

    // Gestion du drag & drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    });

    uploadZone.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormationSubmit(e);
    });
}

// Exposer les fonctions nécessaires globalement
window.handleAddNew = handleAddNew;
window.showFormationModal = showFormationModal;
window.closeModal = function() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('show');
    }
};