// Fonctions de gestion des images pour l'interface admin

// Gestion des images de formation
async function handleFormationImageUpload(input) {
    try {
        const file = input.files ? input.files[0] : input;
        if (!file) {
            console.error('❌ Aucun fichier sélectionné');
            return;
        }

        console.log('📸 Traitement de l\'image:', file.name);

        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            showNotification('Le fichier doit être une image (JPG, PNG, GIF, WEBP)', 'error');
            return;
        }

        // Vérifier la taille du fichier (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('L\'image ne doit pas dépasser 5MB', 'error');
            return;
        }

        showNotification('Upload de l\'image en cours...', 'info');

        // Upload vers Supabase
        try {
            const imageUrl = await window.SupabaseAPI.uploadImage(file, 'formations');
            console.log('✅ Image uploadée:', imageUrl);

            // Mettre à jour l'aperçu
            const preview = document.getElementById('formationImagePreview');
            const previewImg = document.getElementById('formationPreviewImg');
            const imageField = document.getElementById('formationImage');
            const uploadArea = document.getElementById('formationUploadArea');

            if (preview && previewImg && imageField) {
                previewImg.src = imageUrl;
                preview.style.display = 'block';
                imageField.value = imageUrl;
                
                if (uploadArea) {
                    uploadArea.style.display = 'none';
                }
            }

            showNotification('Image uploadée avec succès !', 'success');
            return imageUrl;

        } catch (error) {
            console.error('❌ Erreur lors de l\'upload:', error);
            showNotification('Erreur lors de l\'upload de l\'image: ' + error.message, 'error');
            return null;
        }

    } catch (error) {
        console.error('❌ Erreur lors du traitement de l\'image:', error);
        showNotification('Erreur lors du traitement de l\'image', 'error');
        return null;
    }
}

function removeFormationImage() {
    const preview = document.getElementById('formationImagePreview');
    const previewImg = document.getElementById('formationPreviewImg');
    const imageField = document.getElementById('formationImage');
    const uploadArea = document.getElementById('formationUploadArea');

    if (imageField && imageField.value) {
        // Supprimer l'image de Supabase si elle existe
        window.SupabaseAPI.deleteImage(imageField.value)
            .then(() => {
                console.log('✅ Image supprimée du stockage');
            })
            .catch(error => {
                console.warn('⚠️ Erreur lors de la suppression de l\'image:', error);
            });
    }

    if (preview) preview.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (imageField) imageField.value = '';
    if (uploadArea) uploadArea.style.display = 'flex';
}

function changeFormationImage() {
    const input = document.getElementById('formationImageFile');
    if (input) {
        input.click();
    }
}

// Gestion des images d'événement
async function handleEventImageUpload(input) {
    try {
        const file = input.files ? input.files[0] : input;
        if (!file) {
            console.error('❌ Aucun fichier sélectionné');
            return;
        }

        console.log('📸 Traitement de l\'image:', file.name);

        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            showNotification('Le fichier doit être une image (JPG, PNG, GIF, WEBP)', 'error');
            return;
        }

        // Vérifier la taille du fichier (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('L\'image ne doit pas dépasser 5MB', 'error');
            return;
        }

        showNotification('Upload de l\'image en cours...', 'info');

        // Upload vers Supabase
        try {
            const imageUrl = await window.SupabaseAPI.uploadImage(file, 'events');
            console.log('✅ Image uploadée:', imageUrl);

            // Mettre à jour l'aperçu
            const preview = document.getElementById('eventImagePreview');
            const previewImg = document.getElementById('eventPreviewImg');
            const imageField = document.getElementById('eventImage');
            const uploadArea = document.getElementById('eventUploadArea');

            if (preview && previewImg && imageField) {
                previewImg.src = imageUrl;
                preview.style.display = 'block';
                imageField.value = imageUrl;
                
                if (uploadArea) {
                    uploadArea.style.display = 'none';
                }
            }

            showNotification('Image uploadée avec succès !', 'success');
            return imageUrl;

        } catch (error) {
            console.error('❌ Erreur lors de l\'upload:', error);
            showNotification('Erreur lors de l\'upload de l\'image: ' + error.message, 'error');
            return null;
        }

    } catch (error) {
        console.error('❌ Erreur lors du traitement de l\'image:', error);
        showNotification('Erreur lors du traitement de l\'image', 'error');
        return null;
    }
}

function removeEventImage() {
    const preview = document.getElementById('eventImagePreview');
    const previewImg = document.getElementById('eventPreviewImg');
    const imageField = document.getElementById('eventImage');
    const uploadArea = document.getElementById('eventUploadArea');

    if (imageField && imageField.value) {
        // Supprimer l'image de Supabase si elle existe
        window.SupabaseAPI.deleteImage(imageField.value)
            .then(() => {
                console.log('✅ Image supprimée du stockage');
            })
            .catch(error => {
                console.warn('⚠️ Erreur lors de la suppression de l\'image:', error);
            });
    }

    if (preview) preview.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (imageField) imageField.value = '';
    if (uploadArea) uploadArea.style.display = 'flex';
}

function changeEventImage() {
    const input = document.getElementById('eventImageFile');
    if (input) {
        input.click();
    }
}

// Fonctions utilitaires
function initFloatingLabels() {
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
        
        // Initialiser l'état au chargement
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });
}

// Exposer les fonctions globalement
window.handleFormationImageUpload = handleFormationImageUpload;
window.removeFormationImage = removeFormationImage;
window.changeFormationImage = changeFormationImage;
window.handleEventImageUpload = handleEventImageUpload;
window.removeEventImage = removeEventImage;
window.changeEventImage = changeEventImage;
window.initFloatingLabels = initFloatingLabels;