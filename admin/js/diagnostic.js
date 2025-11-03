
async function runDiagnostics() {
    const results = [];
    
    function log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        results.push({ timestamp, message, type });
    }

    async function waitForCondition(condition, timeout = 5000) {
        const start = Date.now();
        while (!condition() && Date.now() - start < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return condition();
    }
    
    try {
        log('🚀 Démarrage du diagnostic complet...', 'start');
        
        log('1️⃣ Vérification des dépendances...');
        
        // Attendre que Supabase soit disponible
        let attempts = 0;
        while (typeof window.supabase === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof window.supabase === 'undefined') {
            throw new Error('❌ Supabase SDK non chargé après 5 secondes d\'attente');
        }
        log('✅ Supabase SDK chargé');
        
        // Attendre que SupabaseAPI soit disponible
        attempts = 0;
        while (typeof window.SupabaseAPI === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof window.SupabaseAPI === 'undefined') {
            throw new Error('❌ SupabaseAPI non disponible après 5 secondes d\'attente');
        }
        log('✅ SupabaseAPI disponible');
        
        log('2️⃣ Test de connexion à Supabase...');
        const connectionOk = await window.SupabaseAPI.testConnection();
        if (!connectionOk) {
            throw new Error('❌ Connexion Supabase échouée');
        }
        log('✅ Connexion Supabase réussie');
        
        log('3️⃣ Test du chargement des formations...');
        const formations = await window.SupabaseAPI.getFormations();
        log(`✅ ${formations.length} formations chargées`);
        
        log('4️⃣ Test du chargement des événements...');
        const events = await window.SupabaseAPI.getEvents();
        log(`📅 ${events.length} événements chargés`);
        
        if (events.length === 0) {
            log('⚠️ Aucun événement trouvé - Vérifiez la base de données');
        } else {
            log(`✅ Événements trouvés:`);
            events.forEach((event, index) => {
                log(`  ${index + 1}. ${event.title} (${event.date_start}) - Status: ${event.status}`);
            });
        }
        
        log('5️⃣ Vérification de l\'interface admin...');
        
        // Vérifier les éléments de l'interface
        const addNewBtn = document.getElementById('addNewBtn');
        if (!addNewBtn) {
            log('❌ Bouton "Ajouter" non trouvé');
        } else {
            log('✅ Bouton "Ajouter" trouvé');
        }
        
        const eventsGrid = document.getElementById('eventsGrid');
        if (!eventsGrid) {
            log('❌ Grille des événements non trouvée');
        } else {
            log('✅ Grille des événements trouvée');
        }

        const modal = document.getElementById('modal');
        if (!modal) {
            log('❌ Modal non trouvée');
        } else {
            log('✅ Modal trouvée');
        }
        
        log('6️⃣ Test du gestionnaire d\'événements...');
        
        // Vérifier l'instance EventsManager et attendre son initialisation
        const eventsManagerReady = await waitForCondition(() => {
            return window.eventsManager?.initialized;
        });

        if (!window.eventsManager) {
            log('❌ Instance EventsManager non trouvée');
        } else {
            log('✅ Instance EventsManager trouvée');

            if (!eventsManagerReady) {
                log('⚠️ EventsManager n\'est pas initialisé après 5 secondes');
            } else {
                log('✅ EventsManager est initialisé');
            }

            // Vérifier les méthodes essentielles
            const requiredMethods = [
                'showEventModal',
                'createEvent',
                'updateEvent',
                'deleteEvent',
                'loadEvents',
                'renderEvents',
                'renderEventCard'
            ];

            let missingMethods = [];
            for (const method of requiredMethods) {
                if (typeof window.eventsManager[method] !== 'function') {
                    missingMethods.push(method);
                }
            }

            if (missingMethods.length > 0) {
                log(`❌ Méthodes manquantes dans EventsManager: ${missingMethods.join(', ')}`);
            } else {
                log('✅ Toutes les méthodes requises sont présentes dans EventsManager');
            }

            // Vérifier les événements chargés
            if (!Array.isArray(window.eventsManager.events)) {
                log('❌ La propriété events n\'est pas un tableau');
            } else {
                log(`✅ ${window.eventsManager.events.length} événements chargés dans EventsManager`);
            }
        }

        log('7️⃣ Test des filtres...');
        
        const cityFilter = document.getElementById('cityFilter');
        if (!cityFilter) {
            log('❌ Filtre de ville non trouvé');
        } else {
            log('✅ Filtre de ville trouvé');
        }

        const statusFilter = document.getElementById('statusFilter');
        if (!statusFilter) {
            log('❌ Filtre de statut non trouvé');
        } else {
            log('✅ Filtre de statut trouvé');
        }

        const searchInput = document.getElementById('eventSearch');
        if (!searchInput) {
            log('❌ Champ de recherche non trouvé');
        } else {
            log('✅ Champ de recherche trouvé');
        }

        log('8️⃣ Test de la fonction de notification...');
        
        if (typeof window.showNotification !== 'function') {
            log('❌ Fonction de notification non trouvée');
        } else {
            log('✅ Fonction de notification trouvée');
            window.showNotification('Test de notification', 'success');
        }
        
        log('✅ Diagnostic terminé avec succès !', 'success');
        
    } catch (error) {
        log(`❌ ERREUR: ${error.message}`, 'error');
        console.error('Erreur détaillée:', error);
    }
    
    displayResults(results);
}

function displayResults(results) {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid #FF7900;
        border-radius: 8px;
        padding: 20px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-family: monospace;
        font-size: 12px;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Diagnostic ODC Events';
    title.style.cssText = 'color: #FF7900; margin-bottom: 15px; text-align: center;';
    container.appendChild(title);
    
    const resultsList = document.createElement('div');
    results.forEach(result => {
        const item = document.createElement('div');
        item.style.cssText = `
            margin-bottom: 8px;
            padding: 5px;
            border-left: 3px solid ${
                result.type === 'error' ? '#dc3545' : 
                result.type === 'success' ? '#28a745' : '#FF7900'
            };
            padding-left: 8px;
        `;
        item.textContent = `[${result.timestamp}] ${result.message}`;
        resultsList.appendChild(item);
    });
    
    container.appendChild(resultsList);
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fermer';
    closeButton.style.cssText = `
        background: #FF7900;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 15px;
        display: block;
        margin-left: auto;
        margin-right: auto;
    `;
    closeButton.onclick = () => container.remove();
    container.appendChild(closeButton);
    
    document.body.appendChild(container);
}

window.runODCDiagnostics = runDiagnostics;

console.log('🔧 Diagnostic ODC disponible - utilisez runODCDiagnostics() pour l\'exécuter');

if (window.location.search.includes('diagnostic=true')) {
    console.log('🚀 Paramètre diagnostic détecté, exécution automatique...');
    setTimeout(runDiagnostics, 2000);
}
