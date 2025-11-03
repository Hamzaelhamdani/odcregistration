// Fonction d'attente pour Supabase
async function waitForSupabase(maxAttempts = 50) {
    let attempts = 0;
    while (typeof window.supabase === 'undefined' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (typeof window.supabase === 'undefined') {
        throw new Error('Supabase non disponible après ' + (maxAttempts / 10) + ' secondes');
    }
}

// Fonction d'attente pour les variables d'environnement
async function waitForEnv(maxAttempts = 50) {
    let attempts = 0;
    while ((!window.ENV || !window.ENV.SUPABASE_URL || !window.ENV.SUPABASE_ANON_KEY) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.ENV || !window.ENV.SUPABASE_URL || !window.ENV.SUPABASE_ANON_KEY) {
        throw new Error('Variables d\'environnement non disponibles après ' + (maxAttempts / 10) + ' secondes');
    }
}

// Fonction d'initialisation principale
async function initializeSupabase() {
    try {
        console.log('🔄 Initialisation de Supabase...');
        
        // Activer le mode debug
        const debug = new URLSearchParams(window.location.search).get('debug') === 'true';
        if (debug) {
            console.log('🔍 Mode debug activé');
            console.log('🌐 URL Supabase:', window.ENV?.SUPABASE_URL);
            console.log('🔑 Clé anonyme:', window.ENV?.SUPABASE_ANON_KEY?.substring(0, 10) + '...');
        }
        
        // Attendre que la bibliothèque soit chargée
        await waitForSupabase();
        console.log('✅ Bibliothèque Supabase chargée');
        
        // Attendre les variables d'environnement
        await waitForEnv();
        console.log('✅ Variables d\'environnement chargées');
        
        // Créer le client Supabase avec plus d'options
        const supabaseClient = window.supabase.createClient(
            window.ENV.SUPABASE_URL,
            window.ENV.SUPABASE_ANON_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                    debug: true
                },
                db: {
                    schema: 'public'
                },
                global: {
                    headers: { 'x-my-custom-header': 'Orange Digital Center' }
                }
            }
        );
        
        // Test détaillé de la connexion
        console.log('🔄 Test de la connexion Supabase...');
        try {
            const { data, error } = await supabaseClient.from('formations').select('count');
            if (error) {
                console.error('❌ Erreur de requête:', error);
                throw error;
            }
            console.log('✅ Connexion à la base de données réussie', data);
        } catch (dbError) {
            console.error('❌ Erreur de connexion à la base de données:', dbError);
            throw dbError;
        }
        
        // Assigner le client à window
        window.supabaseClient = supabaseClient;
        console.log('✅ Client Supabase initialisé avec succès');
        
        // Émettre un événement pour informer que Supabase est prêt
        const event = new CustomEvent('supabase-ready');
        window.dispatchEvent(event);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur d\'initialisation Supabase:', error.message);
        // Émettre un événement d'erreur
        const errorEvent = new CustomEvent('supabase-error', { 
            detail: { error: error.message } 
        });
        window.dispatchEvent(errorEvent);
        return false;
    }
}

// Fonction utilitaire pour attendre l'initialisation
function whenSupabaseReady() {
    return new Promise((resolve, reject) => {
        if (window.supabaseClient) {
            resolve(window.supabaseClient);
            return;
        }
        
        window.addEventListener('supabase-ready', () => {
            resolve(window.supabaseClient);
        });
        
        window.addEventListener('supabase-error', (event) => {
            reject(new Error(event.detail.error));
        });
    });
}

// Démarrer l'initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    initializeSupabase();
}

// Exporter les fonctions utiles
window.supabaseInit = {
    initialize: initializeSupabase,
    whenReady: whenSupabaseReady
};