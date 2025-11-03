// État global de l'application
let appState = {
    initialized: false,
    formations: [],
    events: [],
    settings: {},
    currentPage: 'dashboard',
    currentEditId: null
};

async function initializeApp() {
    try {
        // Attendre l'initialisation de SupabaseAPI
        await waitForSupabase();

        // Tester la connexion
        await window.SupabaseAPI.testConnection();
        console.log('✅ Connexion à Supabase établie');
        
        // Charger les données
        await loadAllData();
        console.log('✅ Données chargées avec succès');
        
        // Initialiser l'interface
        setupEventListeners();
        showPage('dashboard');
        // Attempt to refresh UI widgets that rely on the global arrays
        try {
            if (typeof updateDashboardStats === 'function') updateDashboardStats();
            if (typeof updateRecentActivities === 'function') updateRecentActivities();
            if (typeof updateUpcomingEvents === 'function') updateUpcomingEvents();
        } catch (err) {
            console.warn('⚠️ Erreur lors de la mise à jour de l\'interface après chargement des données:', err);
        }
        appState.initialized = true;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showInitError(error);
    }
}

async function waitForSupabase() {
    let attempts = 0;
    while (!window.SupabaseAPI?.initialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    if (!window.SupabaseAPI?.initialized) {
        throw new Error('SupabaseAPI non initialisé après 5 secondes');
    }
}

async function loadAllData() {
    const [formationsData, eventsData, settingsData] = await Promise.all([
        window.SupabaseAPI.getFormations(),
        window.SupabaseAPI.getEvents(),
        window.SupabaseAPI.getSettings()
    ]);

    appState.formations = formationsData;
    appState.events = eventsData;
    appState.settings = settingsData;

    // Ensure global variables used by other admin scripts are populated so the UI renders correctly.
    try {
        // 'formations', 'events', 'settings' are declared in other admin scripts (top-level let). Assigning here
        // updates those bindings because this script runs after them in the page load order.
        if (typeof formations !== 'undefined') formations = formationsData;
        if (typeof events !== 'undefined') events = eventsData;
        if (typeof settings !== 'undefined') settings = settingsData;
    } catch (err) {
        console.warn('⚠️ Impossible de synchroniser les variables globales après chargement des données:', err);
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(this.getAttribute('data-page'));
        });
    });

    // Bouton Ajouter
    const addNewBtn = document.getElementById('addNewBtn');
    console.log('🔍 Initialisation du bouton Ajouter:', addNewBtn);
    if (addNewBtn) {
        console.log('✅ Bouton trouvé, ajout du gestionnaire d\'événements');
        addNewBtn.addEventListener('click', (e) => {
            console.log('🖱️ Clic sur le bouton Ajouter');
            // Prefer fallback if available (ensures modal opens from any page)
            if (typeof handleAddNewFallback === 'function') {
                try {
                    handleAddNewFallback(e);
                    return;
                } catch (err) {
                    console.warn('⚠️ handleAddNewFallback a échoué, fallback to handleAddNew', err);
                }
            }

            if (typeof handleAddNew === 'function') {
                handleAddNew(e);
            } else {
                console.error('❌ handleAddNew n\'est pas une fonction');
            }
        });
    } else {
        console.error('❌ Bouton Ajouter non trouvé dans le DOM');
    }

    // Attacher les gestionnaires aux formulaires
    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'formationForm') {
            e.preventDefault();
            await handleFormationSubmit(e);
        } else if (e.target.id === 'eventForm') {
            e.preventDefault();
            await handleEventSubmit(e);
        }
    });

    // Gestionnaires pour les boutons d'action
    document.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (!id) return;

        if (target.classList.contains('action-edit-formation')) {
            await editFormation(id);
        } else if (target.classList.contains('action-delete-formation')) {
            await deleteFormation(id);
        } else if (target.classList.contains('action-edit-event')) {
            await editEvent(id);
        } else if (target.classList.contains('action-delete-event')) {
            await deleteEvent(id);
        }
    });
}

function showInitError(error) {
    const message = `Une erreur s'est produite lors de l'initialisation: ${error.message}`;
    showNotification(message, 'error');
}

// Démarrer l'initialisation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeApp);