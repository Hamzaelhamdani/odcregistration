// Gestionnaires de formulaires pour les formations et événements
async function handleFormationSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const formationData = Object.fromEntries(formData);
    
        // Ajouter les champs manquants
        formationData.id = currentEditId || generateId();
        formationData.currentParticipants = currentEditId ? 
            formations.find(f => f.id === currentEditId)?.currentParticipants || 0 : 0;
        formationData.maxParticipants = parseInt(formationData.maxParticipants);
        formationData.price = 0;
        formationData.createdAt = currentEditId ? 
            formations.find(f => f.id === currentEditId)?.createdAt : new Date().toISOString();
        formationData.updatedAt = new Date().toISOString();

        // Gérer l'upload d'image si présent
        if (formationData.imageFile && formationData.imageFile.size > 0) {
            const imageUrl = await window.SupabaseAPI.uploadImage(formationData.imageFile, 'formations');
            formationData.image = imageUrl;
        }
        delete formationData.imageFile;

        const savedFormation = await window.SupabaseAPI.saveFormation(formationData);
        
        if (currentEditId) {
            const index = formations.findIndex(f => f.id === currentEditId);
            formations[index] = savedFormation;
            showNotification('Formation mise à jour avec succès', 'success');
        } else {
            formations.push(savedFormation);
            showNotification('Formation ajoutée avec succès', 'success');
        }

        closeModal();
        await displayFormations();
        updateDashboardStats();
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la formation:', error);
        showNotification('Erreur lors de la sauvegarde de la formation', 'error');
    }
}

async function handleEventSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const eventData = Object.fromEntries(formData);
    
        // Ajouter les champs manquants
        eventData.id = currentEditId || generateId();
        eventData.category = 'orange-fab';
        eventData.currentParticipants = currentEditId ? 
            events.find(e => e.id === currentEditId)?.currentParticipants || 0 : 0;
        eventData.maxParticipants = parseInt(eventData.maxParticipants);
        eventData.price = 0;
        eventData.tags = [];
        eventData.createdAt = currentEditId ? 
            events.find(e => e.id === currentEditId)?.createdAt : new Date().toISOString();
        eventData.updatedAt = new Date().toISOString();

        // Gérer l'upload d'image si présent
        if (eventData.imageFile && eventData.imageFile.size > 0) {
            const imageUrl = await window.SupabaseAPI.uploadImage(eventData.imageFile, 'events');
            eventData.image = imageUrl;
        }
        delete eventData.imageFile;

        const savedEvent = await window.SupabaseAPI.saveEvent(eventData);
        
        if (currentEditId) {
            const index = events.findIndex(e => e.id === currentEditId);
            events[index] = savedEvent;
            showNotification('Événement mis à jour avec succès', 'success');
        } else {
            events.push(savedEvent);
            showNotification('Événement ajouté avec succès', 'success');
        }

        closeModal();
        await displayEvents();
        updateDashboardStats();
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'événement:', error);
        showNotification('Erreur lors de la sauvegarde de l\'événement', 'error');
    }
}

// Fonctions auxiliaires
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Gestionnaires d'édition
function editFormation(id) {
    const formation = formations.find(f => f.id === id);
    if (!formation) {
        showNotification('Formation non trouvée', 'error');
        return;
    }

    currentEditId = id;
    showFormationModal(formation);
}

function editEvent(id) {
    const event = events.find(e => e.id === id);
    if (!event) {
        showNotification('Événement non trouvé', 'error');
        return;
    }

    currentEditId = id;
    if (window.eventsManager) {
        window.eventsManager.showEventModal(event);
    } else {
        showEventModal(event);
    }
}