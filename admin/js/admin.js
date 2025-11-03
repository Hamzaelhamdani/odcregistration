
let formations = [];
let events = [];
let settings = {};
let currentPage = 'dashboard';
let currentEditId = null;


document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Attendre l'initialisation de SupabaseAPI
        if (!window.SupabaseAPI?.initialized) {
            console.log('⏳ Attente de l\'initialisation de SupabaseAPI...');
            let attempts = 0;
            while (!window.SupabaseAPI?.initialized && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            if (!window.SupabaseAPI?.initialized) {
                throw new Error('SupabaseAPI non initialisé après 5 secondes');
            }
            console.log('✅ SupabaseAPI initialisé avec succès');
        }

        await initializeAdmin();
        await loadAllData();
        setupEventListeners(); 
        showPage('dashboard');
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors de l\'initialisation', 'error');
    }
});

async function initializeAdmin() {
    console.log('🚀 Initialisation du back-office ODC');

    // Test de connexion à Supabase
    try {
        await window.SupabaseAPI.ping();
        console.log('✅ Connexion à Supabase établie');
    } catch (error) {
        console.error('❌ Erreur de connexion à Supabase:', error);
        throw new Error('Impossible de se connecter à Supabase. Veuillez vérifier votre connexion internet et les paramètres de configuration.');
    }
}


async function loadAllData() {
    try {
        await Promise.all([
            loadFormations(),
            loadEvents(),
            loadSettings()
        ]);
        
        updateDashboardStats();
        updateRecentActivities();
        updateUpcomingEvents();
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

async function loadFormations() {
    try {
        const data = await window.SupabaseAPI.getFormations();
        formations = data || [];
        console.log('✅ Formations chargées:', formations.length);
        return formations;
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des formations:', error);
        throw error;
    }
}

async function loadEvents() {
    try {
        const data = await window.SupabaseAPI.getEvents();
        events = data || [];
        console.log('✅ Événements chargés:', events.length);
        return events;
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des événements:', error);
        throw error;
    }
}

async function loadSettings() {
    try {
        const data = await window.SupabaseAPI.getSettings();
        settings = data || {};
        console.log('✅ Paramètres chargés:', settings);
        return settings;
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des paramètres:', error);
        throw error;
    }
}


function setupEventListeners() {
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });

    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    const addNewBtn = document.getElementById('addNewBtn');
    if (addNewBtn) {
        addNewBtn.addEventListener('click', handleAddNew);
    }

    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    setupSearchAndFilters();
}

function showPage(pageName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-page="${pageName}"]`);
    if (activeLink) {
        activeLink.closest('.nav-item').classList.add('active');
    }

    document.querySelectorAll('.content-page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        'dashboard': 'Tableau de bord',
        'formations': 'Gestion des Formations',
        'events': 'Gestion des Événements',
        'settings': 'Paramètres'
    };
    
    if (pageTitle) {
        pageTitle.textContent = titles[pageName] || 'Administration';
    }

    currentPage = pageName;

    switch(pageName) {
        case 'formations':
            displayFormations();
            break;
        case 'events':
            displayEvents();
            break;
        case 'settings':
            displaySettings();
            break;
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}


function updateDashboardStats() {
    const totalFormationsEl = document.getElementById('totalFormations');
    const totalEventsEl = document.getElementById('totalEvents');
    const totalParticipantsEl = document.getElementById('totalParticipants');

    if (totalFormationsEl) {
        totalFormationsEl.textContent = formations.length;
    }
    
    if (totalEventsEl) {
        totalEventsEl.textContent = events.length;
    }

    if (totalParticipantsEl) {
        const totalParticipants = formations.reduce((sum, f) => sum + (f.currentParticipants || 0), 0) +
                                 events.reduce((sum, e) => sum + (e.currentParticipants || 0), 0);
        totalParticipantsEl.textContent = totalParticipants;
    }
}

function updateRecentActivities() {
    const container = document.getElementById('recentActivities');
    if (!container) return;

    const allActivities = [
        ...formations.map(f => ({...f, type: 'formation', date: f.createdAt})),
        ...events.map(e => ({...e, type: 'event', date: e.createdAt}))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))
     .slice(0, 5);

    const activitiesHTML = allActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas ${activity.type === 'formation' ? 'fa-graduation-cap' : 'fa-calendar-alt'}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.type === 'formation' ? 'Formation' : 'Événement'} ajouté(e)</p>
                <small>${new Date(activity.date).toLocaleDateString('fr-FR')}</small>
            </div>
        </div>
    `).join('');

    container.innerHTML = activitiesHTML || '<p class="text-muted">Aucune activité récente</p>';
}

function updateUpcomingEvents() {
    const container = document.getElementById('upcomingEvents');
    if (!container) return;

    const today = new Date();
    const upcoming = [
        ...formations.filter(f => new Date(f.dateStart) > today),
        ...events.filter(e => new Date(e.date) > today)
    ].sort((a, b) => {
        const dateA = new Date(a.dateStart || a.date);
        const dateB = new Date(b.dateStart || b.date);
        return dateA - dateB;
    }).slice(0, 5);

    const upcomingHTML = upcoming.map(item => {
        const itemDate = new Date(item.dateStart || item.date);
        return `
            <div class="upcoming-item">
                <h4>${item.title}</h4>
                <p><i class="fas fa-calendar"></i> ${itemDate.toLocaleDateString('fr-FR')}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${item.location}</p>
            </div>
        `;
    }).join('');

    container.innerHTML = upcomingHTML || '<p class="text-muted">Aucun événement à venir</p>';
}

function displayFormations() {
    filterFormations();
}


function editFormation(id) {
    const formation = formations.find(f => f.id === id);
    if (!formation) return;

    currentEditId = id;
    showFormationModal(formation);
}

async function deleteFormation(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
        try {
            await window.SupabaseAPI.deleteFormation(id);
            formations = formations.filter(f => f.id !== id);
            displayFormations();
            updateDashboardStats();
            showNotification('Formation supprimée avec succès', 'success');
        } catch (error) {
            console.error('❌ Erreur lors de la suppression de la formation:', error);
            showNotification('Erreur lors de la suppression de la formation', 'error');
        }
    }
}


async function displayEvents() {
    try {
        if (typeof window.loadEventsTable === 'function') {
            await window.loadEventsTable();
        } else {
            console.error('❌ loadEventsTable non disponible');
            filterEvents();
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des événements:', error);
        showNotification('Erreur lors du chargement des événements', 'error');
        filterEvents(); // Fallback to local filtering if remote loading fails
    }
}

function editEvent(id) {
    // Prefer delegating to the EventsManager instance when present (single source of truth)
    try {
        if (window.eventsManager && typeof window.eventsManager.editEvent === 'function') {
            window.eventsManager.editEvent(id);
            return;
        }
    } catch (err) {
        console.warn('⚠️ Erreur lors de la délégation vers eventsManager.editEvent:', err);
    }

    // Fallback: use legacy behavior
    const event = events.find(e => e.id === id);
    if (!event) return;

    currentEditId = id;
    showEventModal(event);
}

async function deleteEvent(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
        try {
            // Prefer delegating to eventsManager if available
            if (window.eventsManager && typeof window.eventsManager.deleteEvent === 'function') {
                await window.eventsManager.deleteEvent(id);
            } else {
                await window.SupabaseAPI.deleteEvent(id);
            }
            events = events.filter(e => e.id !== id);
            displayEvents();
            updateDashboardStats();
            showNotification('Événement supprimé avec succès', 'success');
        } catch (error) {
            console.error('❌ Erreur lors de la suppression de l\'événement:', error);
            showNotification('Erreur lors de la suppression de l\'événement', 'error');
        }
    }
}


function showFormationModal(formation = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    // Reset currentEditId if no formation is provided
    if (!formation) {
        currentEditId = null;
    }
    
    modalTitle.innerHTML = `
        <i class="fas fa-graduation-cap"></i>
        ${formation ? 'Modifier la formation' : 'Nouvelle formation'}
    `;

    if (!window.FormationModalTemplate) {
        // Définir le template dans une constante globale pour éviter de le recréer à chaque fois
        window.FormationModalTemplate = function(formation) {
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
                            <textarea id="description" name="description" rows="3" required class="form-control" maxlength="2000">${formation?.description || ''}</textarea>
                            <label for="description">Description <span class="required">*</span></label>
                            <div class="form-icon"><i class="fas fa-align-left"></i></div>
                            <small class="form-help char-count" id="formationDescriptionHelp">${(formation?.description||'').length}/2000 caractères</small>
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
                        <div class="upload-zone">
                            <div class="image-preview" id="formationImagePreview" style="display: none;">
                                <img src="" alt="Aperçu" id="formationImagePreviewImg">
                                <div class="image-preview-overlay">
                                    <button type="button" class="btn-icon" onclick="changeFormationImage()">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button type="button" class="btn-icon btn-danger" onclick="removeFormationImage()">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="upload-placeholder" id="formationImagePlaceholder">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Glissez une image ici ou cliquez pour parcourir</p>
                                <small>JPG, PNG ou GIF - Max 5MB</small>
                            </div>
                            <input type="file" id="image" name="image" accept="image/*" style="display: none;">
                            <input type="hidden" id="imageUrl" name="imageUrl" value="${formation?.image || ''}">
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
        };
    }

    modalBody.innerHTML = window.FormationModalTemplate(formation);
    modal.classList.add('show');

    // Initialiser l'upload d'image si une image existe
    if (formation?.image) {
        const preview = document.getElementById('formationImagePreview');
        const previewImg = document.getElementById('formationImagePreviewImg');
        if (preview && previewImg) {
            previewImg.src = formation.image;
            preview.style.display = 'block';
            document.getElementById('formationImagePlaceholder').style.display = 'none';
        }
    }

    const form = document.getElementById('formationForm');
    // Character counter for formation description
    try {
        const descF = document.getElementById('description');
        const helpF = document.getElementById('formationDescriptionHelp');
        if (descF && helpF) {
            const updateF = () => { helpF.textContent = `${descF.value.length}/2000 caractères`; };
            descF.addEventListener('input', updateF);
            updateF();
        }
    } catch (err) { console.warn('Erreur init compteur de caractères formation:', err); }

    form.addEventListener('submit', handleFormationSubmit);

    // Initialize floating labels and image uploader for the dynamically-inserted modal
    try {
        if (typeof initFloatingLabels === 'function') initFloatingLabels();

        const uploadContainer = modalBody.querySelector('.upload-zone') ||
                                modalBody.querySelector('.image-upload-container') ||
                                modalBody.querySelector('.file-upload') ||
                                modalBody.querySelector('.upload-placeholder');

        // Initialize ImageUploader for this modal if not already attached to this container
        if (uploadContainer) {
            // prevent double-instantiation on same DOM node
            if (!uploadContainer.dataset.uploaderAttached) {
                const uploader = new ImageUploader(uploadContainer);
                uploadContainer.dataset.uploaderAttached = '1';

                // When uploader completes upload it should dispatch `imageUploaded` with { detail: { url } }
                uploadContainer.addEventListener('imageUploaded', (ev) => {
                    try {
                        const url = ev?.detail?.url;
                        const hidden = modalBody.querySelector('#imageUrl') || modalBody.querySelector('input[name="imageUrl"]');
                        const preview = modalBody.querySelector('#formationImagePreview');
                        const previewImg = modalBody.querySelector('#formationImagePreviewImg');
                        const placeholder = modalBody.querySelector('#formationImagePlaceholder');
                        if (hidden && url) hidden.value = url;
                        if (preview && previewImg && url) {
                            previewImg.src = url;
                            preview.style.display = 'block';
                        }
                        if (placeholder) placeholder.style.display = 'none';
                    } catch (err) {
                        console.warn('Erreur lors du traitement de imageUploaded (formation):', err);
                    }
                });

                // Expose helper functions for template buttons
                window.changeFormationImage = function() {
                    const input = uploadContainer.querySelector('input[type="file"]');
                    if (input) input.click();
                };

                window.removeFormationImage = function() {
                    try {
                        if (uploader && typeof uploader.resetUpload === 'function') {
                            uploader.resetUpload();
                        } else {
                            const preview = modalBody.querySelector('.image-preview');
                            const previewImg = modalBody.querySelector('#formationImagePreviewImg');
                            const hidden = modalBody.querySelector('#imageUrl') || modalBody.querySelector('input[name="imageUrl"]');
                            const placeholder = modalBody.querySelector('#formationImagePlaceholder');
                            if (preview) preview.style.display = 'none';
                            if (previewImg) previewImg.src = '';
                            if (hidden) hidden.value = '';
                            if (placeholder) placeholder.style.display = 'block';
                        }
                    } catch (err) { console.warn('Erreur removeFormationImage:', err); }
                };
            } else {
                // uploader already attached: just (re)define helpers that operate on this container
                window.changeFormationImage = function() {
                    const input = uploadContainer.querySelector('input[type="file"]');
                    if (input) input.click();
                };

                window.removeFormationImage = function() {
                    try {
                        const preview = modalBody.querySelector('.image-preview');
                        const previewImg = modalBody.querySelector('#formationImagePreviewImg');
                        const hidden = modalBody.querySelector('#imageUrl') || modalBody.querySelector('input[name="imageUrl"]');
                        const placeholder = modalBody.querySelector('#formationImagePlaceholder');
                        if (preview) preview.style.display = 'none';
                        if (previewImg) previewImg.src = '';
                        if (hidden) hidden.value = '';
                        if (placeholder) placeholder.style.display = 'block';
                    } catch (err) { console.warn('Erreur removeFormationImage (no uploader):', err); }
                };
            }
        }
    } catch (err) {
        console.warn('⚠️ Erreur lors de l\'initialisation de l\'uploader du modal:', err);
    }
}

function showEventModal(event = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = event ? 'Modifier l\'événement' : 'Ajouter un événement';

    const formHTML = `
        <form id="eventForm">
            <div class="form-group">
                <label for="eventTitle">Titre de l'événement</label>
                <input type="text" id="eventTitle" name="title" value="${event?.title || ''}" required>
            </div>
            
            <div class="form-group">
                <label for="eventDescription">Description</label>
                <textarea id="eventDescription" name="description" rows="3" required maxlength="1000">${event?.description || ''}</textarea>
                <small class="form-help char-count" id="eventDescriptionHelp">${(event?.description||'').length}/1000 caractères</small>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="eventDate">Date</label>
                    <input type="date" id="eventDate" name="date" value="${event?.date || ''}" required>
                </div>
                <div class="form-group">
                    <label for="eventTimeStart">Heure de début</label>
                    <input type="time" id="eventTimeStart" name="timeStart" value="${event?.timeStart || ''}" required>
                </div>
                <div class="form-group">
                    <label for="eventTimeEnd">Heure de fin</label>
                    <input type="time" id="eventTimeEnd" name="timeEnd" value="${event?.timeEnd || ''}" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="eventCity">Ville</label>
                    <select id="eventCity" name="city" required>
                        <option value="">Sélectionner une ville</option>
                        <option value="rabat" ${event?.city === 'rabat' ? 'selected' : ''}>Rabat</option>
                        <option value="agadir" ${event?.city === 'agadir' ? 'selected' : ''}>Agadir</option>
                        <option value="benmisk" ${event?.city === 'benmisk' ? 'selected' : ''}>Ben M'sik</option>
                        <option value="sidimaarouf" ${event?.city === 'sidimaarouf' ? 'selected' : ''}>Sidi Maarouf</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="eventLocation">Lieu exact</label>
                    <input type="text" id="eventLocation" name="location" value="${event?.location || ''}" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="eventOrganizer">Organisateur</label>
                    <input type="text" id="eventOrganizer" name="organizer" value="${event?.organizer || ''}">
                </div>
                <div class="form-group">
                    <label for="eventMaxParticipants">Nombre max de participants</label>
                    <input type="number" id="eventMaxParticipants" name="maxParticipants" value="${event?.maxParticipants || ''}" min="1" required>
                </div>
            </div>

            <div class="form-section">
                <h4><i class="fas fa-image"></i> Image de l'événement</h4>
                <div class="upload-zone">
                    <div class="image-preview" id="eventImagePreview" style="display: ${event?.image ? 'block' : 'none'};">
                        <img src="${event?.image || ''}" alt="Aperçu" id="eventImagePreviewImg">
                        <div class="image-preview-overlay">
                            <button type="button" class="btn-icon" onclick="changeEventImage()">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn-icon btn-danger" onclick="removeEventImage()">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="upload-placeholder" id="eventImagePlaceholder" style="display: ${event?.image ? 'none' : 'block'};">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Glissez une image ici ou cliquez pour parcourir</p>
                        <small>JPG, PNG ou GIF - Max 5MB</small>
                    </div>
                    <input type="file" id="eventImageFile" name="imageFile" accept="image/*" style="display: none;">
                    <input type="hidden" id="eventImageUrl" name="image" value="${event?.image || ''}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="eventStatus">Statut</label>
                    <select id="eventStatus" name="status" required>
                        <option value="active" ${event?.status === 'active' ? 'selected' : ''}>Actif</option>
                        <option value="inactive" ${event?.status === 'inactive' ? 'selected' : ''}>Inactif</option>
                    </select>
                </div>
            </div>

            <div class="d-flex gap-1">
                <button type="submit" class="btn btn-primary">
                    ${event ? 'Mettre à jour' : 'Ajouter'}
                </button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
            </div>
        </form>
    `;

    modalBody.innerHTML = formHTML;
    modal.classList.add('show');

    const form = document.getElementById('eventForm');

    // Initialize ImageUploader for event modal's upload zone only if there is
    // no centralized EventsManager handling modals/uploaders. This prevents
    // two upload dialogues opening when both modules try to attach an uploader.
    try {
        if (!window.eventsManager) {
            const uploadContainer = modalBody.querySelector('.upload-zone');
            if (uploadContainer) {
                const uploader = new ImageUploader(uploadContainer);

                // Expose helpers for template buttons
                window.changeEventImage = function() {
                    const input = uploadContainer.querySelector('input[type="file"]');
                    if (input) input.click();
                };

                window.removeEventImage = function() {
                    if (uploader && typeof uploader.resetUpload === 'function') {
                        uploader.resetUpload();
                    } else {
                        const preview = modalBody.querySelector('#eventImagePreview');
                        const previewImg = modalBody.querySelector('#eventImagePreviewImg');
                        const hidden = modalBody.querySelector('#eventImageUrl');
                        if (preview) preview.style.display = 'none';
                        if (previewImg) previewImg.src = '';
                        if (hidden) hidden.value = '';
                        const placeholder = modalBody.querySelector('#eventImagePlaceholder');
                        if (placeholder) placeholder.style.display = 'block';
                    }
                };

                // When uploader emits imageUploaded, update hidden input and preview
                uploadContainer.addEventListener('imageUploaded', (ev) => {
                    try {
                        const url = ev?.detail?.url;
                        const hidden = modalBody.querySelector('#eventImageUrl');
                        const preview = modalBody.querySelector('#eventImagePreview');
                        const previewImg = modalBody.querySelector('#eventImagePreviewImg');
                        const placeholder = modalBody.querySelector('#eventImagePlaceholder');
                        if (hidden && url) hidden.value = url;
                        if (preview && previewImg && url) {
                            previewImg.src = url;
                            preview.style.display = 'block';
                        }
                        if (placeholder) placeholder.style.display = 'none';
                    } catch (err) {
                        console.warn('Erreur lors du traitement de imageUploaded:', err);
                    }
                });
            }
        }
    } catch (err) {
        console.warn('⚠️ Erreur lors de l\'initialisation de l\'uploader de l\'événement:', err);
    }

    form.addEventListener('submit', async (e) => await handleEventSubmit(e));

    // Character counter for event description
    try {
        const desc = document.getElementById('eventDescription');
        const help = document.getElementById('eventDescriptionHelp');
        if (desc && help) {
            const update = () => { help.textContent = `${desc.value.length}/1000 caractères`; };
            desc.addEventListener('input', update);
            update();
        }
    } catch (err) { console.warn('Erreur init compteur de caractères événement:', err); }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
    currentEditId = null;
}


async function handleFormationSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const formationData = Object.fromEntries(formData);

        // Prefer uploaded URL stored by uploader (on file input dataset) or hidden #imageUrl
        try {
            const formEl = e.target;
            const fileInput = formEl.querySelector('input[type="file"]');
            const hiddenImageUrl = formEl.querySelector('#imageUrl') || formEl.querySelector('input[name="imageUrl"]');

            if (fileInput && fileInput.dataset && fileInput.dataset.uploadedUrl) {
                formationData.image = fileInput.dataset.uploadedUrl;
            } else if (hiddenImageUrl && hiddenImageUrl.value) {
                formationData.image = hiddenImageUrl.value;
            }
        } catch (err) {
            console.warn('⚠️ Impossible de récupérer l\'URL d\'image depuis le formulaire:', err);
        }

        // Clean transient fields that shouldn't be sent directly to Supabase
        if (formationData.image && typeof formationData.image !== 'string') {
            formationData.image = formationData.imageUrl || '';
        }
        delete formationData.imageFile;
        delete formationData.imageUrl;

        // Only include id when editing an existing formation. Do NOT generate a client id for new rows
        if (currentEditId) formationData.id = currentEditId;
        formationData.currentParticipants = currentEditId ?
            formations.find(f => f.id === currentEditId)?.currentParticipants || 0 : 0;
        formationData.maxParticipants = parseInt(formationData.maxParticipants);
        formationData.price = 0;
        // Use ISO timestamps locally but Supabase table may use different column names; these will be handled in SupabaseAPI
        formationData.createdAt = currentEditId ? 
            formations.find(f => f.id === currentEditId)?.createdAt : new Date().toISOString();
        formationData.updatedAt = new Date().toISOString();

        const savedFormation = await saveFormation(formationData);
        
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

        // Prefer uploaded URL stored by uploader (on file input dataset) or hidden #eventImageUrl
        try {
            const formEl = e.target;
            const fileInput = formEl.querySelector('input[type="file"]#eventImageFile') || formEl.querySelector('input[type="file"]');
            const hiddenImageUrl = formEl.querySelector('#eventImageUrl') || formEl.querySelector('input[name="image"]');

            if (fileInput && fileInput.dataset && fileInput.dataset.uploadedUrl) {
                eventData.image = fileInput.dataset.uploadedUrl;
            } else if (hiddenImageUrl && hiddenImageUrl.value) {
                eventData.image = hiddenImageUrl.value;
            }
        } catch (err) {
            console.warn('⚠️ Impossible de récupérer l\'URL d\'image depuis le formulaire événement:', err);
        }

        // Clean transient fields
        delete eventData.imageFile;
        delete eventData.eventImageFile;
        // Remove fields that may not exist in DB (prevent PGRST204)
        if ('price' in eventData) delete eventData.price;
        if ('category' in eventData) delete eventData.category;

        // Ensure timeEnd is set (avoid NOT NULL violation in DB)
        if ((!eventData.timeEnd || eventData.timeEnd === '') && eventData.timeStart) {
            eventData.timeEnd = eventData.timeStart;
        }
    
        // Only include id for updates. Do NOT generate a fake id on the client
        // for new events — let the database generate it. This avoids creating
        // duplicate rows when saving.
        if (currentEditId) {
            eventData.id = currentEditId;
        } else {
            // ensure no transient id remains
            if ('id' in eventData) delete eventData.id;
        }
        eventData.category = 'orange-fab';
        eventData.currentParticipants = currentEditId ? 
            events.find(e => e.id === currentEditId)?.currentParticipants || 0 : 0;
        eventData.maxParticipants = parseInt(eventData.maxParticipants);
        eventData.price = 0;
        eventData.tags = [];
        eventData.createdAt = currentEditId ? 
            events.find(e => e.id === currentEditId)?.createdAt : new Date().toISOString();
        eventData.updatedAt = new Date().toISOString();

        const savedEvent = await saveEvent(eventData);
        
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


function generateId() {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
    } catch (e) {
        // ignore and fallback
    }
    // Fallback to timestamp string (legacy)
    return Date.now().toString();
}

function getCityName(cityCode) {
    const cities = {
        'rabat': 'ODC Rabat',
        'agadir': 'ODC Agadir',
        'benmisk': 'ODC Club Ben M\'sik',
        'sidimaarouf': 'ODC Club Sidi Maarouf'
    };
    return cities[cityCode] || cityCode;
}

function handleAddNew() {
    switch(currentPage) {
        case 'formations':
            showFormationModal();
            break;
        case 'events':
            window.eventsManager.showEventModal();
            break;
        default:
            showNotification('Fonctionnalité non disponible sur cette page', 'info');
    }
}


async function saveFormation(formationData) {
    try {
        const savedFormation = await window.SupabaseAPI.saveFormation(formationData);
        console.log('✅ Formation sauvegardée:', savedFormation);
        try {
            // Notify any listeners (landing page) that formations changed
            window.dispatchEvent(new CustomEvent('formations-changed', { detail: savedFormation }));
        } catch (err) {
            console.warn('⚠️ Impossible de dispatcher formations-changed:', err);
        }
        return savedFormation;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la formation:', error);
        throw error;
    }
}

async function saveEvent(eventData) {
    try {
        const savedEvent = await window.SupabaseAPI.saveEvent(eventData);
        console.log('✅ Événement sauvegardé:', savedEvent);
        try {
            // Notify any listeners (landing page) that events changed
            window.dispatchEvent(new CustomEvent('events-changed', { detail: savedEvent }));
        } catch (err) {
            console.warn('⚠️ Impossible de dispatcher events-changed:', err);
        }
        return savedEvent;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'événement:', error);
        throw error;
    }
}

async function saveSettings(settingsData) {
    try {
        const savedSettings = await window.SupabaseAPI.saveSettings(settingsData);
        console.log('✅ Paramètres sauvegardés:', savedSettings);
        return savedSettings;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des paramètres:', error);
        throw error;
    }
}


function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    // Diagnostic: log creation so we can see where notifications come from
    console.log('🔔 Création d\'une notification:', { message, type });
    // Force small toast style inline as a safety net to prevent full-height panels
    notification.style.maxWidth = '420px';
    notification.style.maxHeight = '80vh';
    notification.style.overflow = 'auto';
    notification.style.padding = '1rem 1.5rem';
    notification.style.boxSizing = 'border-box';
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                       type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);

    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}


function setupSearchAndFilters() {
    const searchFormations = document.getElementById('searchFormations');
    if (searchFormations) {
        searchFormations.addEventListener('input', filterFormations);
    }

    const categoryFilter = document.getElementById('categoryFilter');
    const cityFilter = document.getElementById('cityFilter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterFormations);
    }
    
    if (cityFilter) {
        cityFilter.addEventListener('change', filterFormations);
    }

    const searchEvents = document.getElementById('searchEvents');
    if (searchEvents) {
        searchEvents.addEventListener('input', filterEvents);
    }

    const eventsCityFilter = document.getElementById('eventsCityFilter');
    if (eventsCityFilter) {
        eventsCityFilter.addEventListener('change', filterEvents);
    }
}

function filterFormations() {
    // Defensive: handle missing DOM elements and missing fields on formation objects
    const searchTerm = (document.getElementById('searchFormations')?.value || '').toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const cityFilter = document.getElementById('cityFilter')?.value || '';

    console.debug('🔎 filterFormations: formations.length=', Array.isArray(formations) ? formations.length : typeof formations, { searchTerm, categoryFilter, cityFilter });

    let filteredFormations = (Array.isArray(formations) ? formations : []).filter(formation => {
        // Safely read string fields
        const title = (formation?.title || '').toString().toLowerCase();
        const description = (formation?.description || '').toString().toLowerCase();
        const location = (formation?.location || '').toString().toLowerCase();

        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm) || location.includes(searchTerm);
        const matchesCategory = !categoryFilter || formation?.category === categoryFilter;
        const matchesCity = !cityFilter || formation?.city === cityFilter;

        return matchesSearch && matchesCategory && matchesCity;
    });

    console.debug('🔎 filterFormations: filtered count=', filteredFormations.length);
    displayFilteredFormations(filteredFormations);
}

function filterEvents() {
    const searchTerm = document.getElementById('searchEvents')?.value.toLowerCase() || '';
    const cityFilter = document.getElementById('eventsCityFilter')?.value || '';
    
    let filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm) ||
                            event.description.toLowerCase().includes(searchTerm) ||
                            event.location.toLowerCase().includes(searchTerm) ||
                            (event.organizer && event.organizer.toLowerCase().includes(searchTerm));
        
        const matchesCity = !cityFilter || event.city === cityFilter;
        
        return matchesSearch && matchesCity;
    });
    
    displayFilteredEvents(filteredEvents);
}

function displayFilteredFormations(filteredFormations) {
    const tableBody = document.getElementById('formationsTableBody');
    if (!tableBody) return;
    
    // Définir les gestionnaires d'événements pour les boutons d'action
    function setupActionHandlers() {
        tableBody.querySelectorAll('.action-edit').forEach(btn => {
            btn.onclick = () => editFormation(btn.dataset.id);
        });
        
        tableBody.querySelectorAll('.action-delete').forEach(btn => {
            btn.onclick = () => deleteFormation(btn.dataset.id);
        });
    }

    if (filteredFormations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="padding: 2rem;">
                    <i class="fas fa-search" style="font-size: 2rem; color: #6c757d; margin-bottom: 1rem; display: block;"></i>
                    <p style="color: #6c757d; font-size: 1.1rem;">Aucune formation trouvée</p>
                    <p style="color: #6c757d; font-size: 0.9rem;">Essayez de modifier vos critères de recherche</p>
                </td>
            </tr>
        `;
        return;
    }

    const formationsHTML = filteredFormations.map(formation => `
        <tr>
            <td>
                <div class="d-flex align-center gap-1">
                    <img src="${formation.image}" alt="${formation.title}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
                    <div>
                        <strong>${formation.title}</strong>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge ${formation.category === 'ecole-du-code' ? 'status-active' : 'status-badge'}">
                    ${formation.category === 'ecole-du-code' ? 'École du Code' : 'FabLab'}
                </span>
            </td>
            <td>
                ${new Date(formation.dateStart).toLocaleDateString('fr-FR')}
                ${formation.dateEnd !== formation.dateStart ? ' - ' + new Date(formation.dateEnd).toLocaleDateString('fr-FR') : ''}
            </td>
            <td>${getCityName(formation.city)}</td>
            <td>
                <div class="d-flex align-center gap-1">
                    <span>${formation.currentParticipants || 0}/${formation.maxParticipants}</span>
                    <div style="width: 60px; height: 4px; background: #e9ecef; border-radius: 2px;">
                        <div style="width: ${((formation.currentParticipants || 0) / formation.maxParticipants) * 100}%; height: 100%; background: var(--primary-color); border-radius: 2px;"></div>
                    </div>
                </div>
            </td>
            <td>
                ${formation.registrationLink ? 
                    `<button class="btn btn-sm btn-success" onclick="window.open('${formation.registrationLink}', '_blank')" title="Ouvrir le formulaire d'inscription">
                        <i class="fas fa-external-link-alt"></i> S'inscrire
                    </button>` : 
                    '<span class="text-muted">Non défini</span>'
                }
            </td>
            <td>
                <span class="status-badge status-${formation.status}">${formation.status === 'active' ? 'Active' : 'Inactive'}</span>
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn btn-sm btn-primary action-edit-formation" data-id="${formation.id}" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger action-delete-formation" data-id="${formation.id}" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    tableBody.innerHTML = formationsHTML;
    
    // Attacher les gestionnaires d'événements aux boutons
    setupActionHandlers();
    
    updateResultsCounter('formations', filteredFormations.length, formations.length);
}

function displayFilteredEvents(filteredEvents) {
    const tableBody = document.getElementById('eventsTableBody');
    if (!tableBody) return;

    if (filteredEvents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 2rem;">
                    <i class="fas fa-search" style="font-size: 2rem; color: #6c757d; margin-bottom: 1rem; display: block;"></i>
                    <p style="color: #6c757d; font-size: 1.1rem;">Aucun événement trouvé</p>
                    <p style="color: #6c757d; font-size: 0.9rem;">Essayez de modifier vos critères de recherche</p>
                </td>
            </tr>
        `;
        return;
    }

    const eventsHTML = filteredEvents.map(event => `
        <tr>
            <td>
                <div class="d-flex align-center gap-1">
                    <img src="${event.image}" alt="${event.title}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
                    <div>
                        <strong>${event.title}</strong>
                        <br><small class="text-muted">${event.organizer || 'Non défini'}</small>
                    </div>
                </div>
            </td>
            <td>${new Date(event.date).toLocaleDateString('fr-FR')}</td>
            <td>${event.timeStart} - ${event.timeEnd}</td>
            <td>${getCityName(event.city)}</td>
            <td>
                <div class="d-flex align-center gap-1">
                    <span>${event.currentParticipants || 0}/${event.maxParticipants}</span>
                    <div style="width: 60px; height: 4px; background: #e9ecef; border-radius: 2px;">
                        <div style="width: ${((event.currentParticipants || 0) / event.maxParticipants) * 100}%; height: 100%; background: var(--success-color); border-radius: 2px;"></div>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge status-${event.status}">${event.status === 'active' ? 'Actif' : 'Inactif'}</span>
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn btn-sm btn-primary" onclick="editEvent('${event.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEvent('${event.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    tableBody.innerHTML = eventsHTML;
    
    updateResultsCounter('events', filteredEvents.length, events.length);
}

function updateResultsCounter(type, filteredCount, totalCount) {
    const pageControls = document.querySelector(`#${type}-page .page-controls`);
    if (!pageControls) return;
    
    let counter = pageControls.querySelector('.results-counter');
    if (!counter) {
        counter = document.createElement('div');
        counter.className = 'results-counter';
        pageControls.appendChild(counter);
    }
    
    if (filteredCount === totalCount) {
        counter.innerHTML = `<i class="fas fa-list"></i> ${totalCount} ${type === 'formations' ? 'formations' : 'événements'} au total`;
        counter.className = 'results-counter';
    } else {
        counter.innerHTML = `<i class="fas fa-filter"></i> ${filteredCount} sur ${totalCount} ${type === 'formations' ? 'formations' : 'événements'}`;
        counter.className = 'results-counter filtered';
    }
}


function displaySettings() {
    const form = document.getElementById('generalSettingsForm');
    if (form && settings.siteSettings) {
        const siteSettings = settings.siteSettings;
        
        document.getElementById('siteTitle').value = siteSettings.title || '';
        document.getElementById('siteDescription').value = siteSettings.description || '';
        document.getElementById('heroTitle').value = siteSettings.heroTitle || '';
        document.getElementById('heroSubtitle').value = siteSettings.heroSubtitle || '';
        document.getElementById('contactEmail').value = siteSettings.contactEmail || '';
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('Paramètres sauvegardés avec succès', 'success');
        });
    }

    displayOdcCenters();
}

function displayOdcCenters() {
    const container = document.getElementById('odcCentersList');
    if (!container || !settings.odcCenters) return;

    const centersHTML = settings.odcCenters.map(center => `
        <div class="odc-center-item">
            <h4>${center.displayName}</h4>
            <p>${center.address}</p>
            <p><strong>Équipements:</strong> ${center.facilities.join(', ')}</p>
        </div>
    `).join('');

    container.innerHTML = centersHTML;
}
