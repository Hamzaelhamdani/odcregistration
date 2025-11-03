class AuthManager {
    constructor() {
        console.log('🔧 Initialisation AuthManager...');
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
        this.initializeWhenReady();
    }

    async initializeWhenReady() {
        if (this.initialized) return;

        console.log('⏳ Attente du client Supabase...');
        
        // Attendre que l'API soit initialisée
        let attempts = 0;
        while (!window.SupabaseAPI?.initialized && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.supabaseClient) {
            throw new Error('Client Supabase non initialisé après 5 secondes');
        }
        
        this.supabase = window.supabaseClient;
        console.log('✅ Client Supabase récupéré');
        
        this.initialized = true;
        await this.init();
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    async init() {
        console.log('🚀 Initialisation de l\'authentification...');

        try {
            if (!this.supabase?.auth) {
                throw new Error('Client Supabase non initialisé');
            }

            // Sur la page de login, ne pas rediriger
            if (window.location.pathname.includes('login.html')) {
                console.log('📝 Page de login - pas de redirection');
                this.setupLoginForm();
                return;
            }

            // Pour les autres pages, vérifier la session
            console.log('🔍 Vérification de la session...');
            const { data: { session }, error } = await this.supabase.auth.getSession();

            if (error) throw error;

            if (!session) {
                console.log('❌ Aucune session active');
                this.redirectToLogin();
                return;
            }

            const hasPermission = await this.checkAdminPermissions(session.user);
            if (hasPermission) {
                console.log('✅ Session admin valide pour:', session.user.email);
                this.currentUser = session.user;
            } else {
                console.log('❌ Permissions insuffisantes');
                await this.supabase.auth.signOut();
                this.redirectToLogin();
            }

        } catch (error) {
            console.error('❌ Erreur d\'initialisation:', error);
            this.showError(error.message);
        }
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        // Éviter les doubles événements
        if (loginForm.hasAttribute('data-initialized')) {
            return;
        }

        if (!this.supabase) {
            console.log('⏳ Attente de l\'initialisation de Supabase...');
            setTimeout(() => this.setupLoginForm(), 100);
            return;
        }

        console.log('🔧 Configuration du formulaire de login');
        loginForm.setAttribute('data-initialized', 'true');

        // Activer le formulaire une fois Supabase prêt
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.disabled = false;
            console.log('✅ Bouton de connexion activé');
        }

        loginForm.style.opacity = '1';

        // Configuration du formulaire
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Gestionnaire de touche Entrée sur les champs
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin();
                }
            });
        });

        console.log('✅ Formulaire de login configuré');
    }

    async handleLogin() {
        console.group('🔐 Procédure de connexion');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        const loadingMessage = document.getElementById('loadingMessage');
        const loginBtn = document.getElementById('loginBtn');

        try {
            console.log('1. Préparation de la connexion...');
            console.log('- Email:', email);
            console.log('- Client Supabase:', window.supabaseClient ? '✓ Disponible' : '❌ Non disponible');
            console.log('- SupabaseAPI:', window.SupabaseAPI ? '✓ Disponible' : '❌ Non disponible');
            console.log('- API initialisée:', window.SupabaseAPI?.initialized ? '✓ Oui' : '❌ Non');
            
            errorMessage.style.display = 'none';
            loadingMessage.style.display = 'block';
            loadingMessage.textContent = 'Connexion en cours...';
            loginBtn.disabled = true;

            // Vérifier que Supabase est disponible
            if (!window.SupabaseAPI?.initialized || !window.supabaseClient) {
                throw new Error('Client Supabase non initialisé');
            }

            // Tenter la connexion
            console.log('🔑 Tentative de connexion pour:', email);
            
            // Utiliser le client global
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            if (!data?.user) {
                throw new Error('Erreur de connexion: aucun utilisateur retourné');
            }

            console.log('✅ Connexion réussie pour:', data.user.email);
            console.log('🔍 Vérification des permissions...');
            
            const hasPermission = await this.checkAdminPermissions(data.user);
            if (!hasPermission) {
                console.log('❌ Permissions insuffisantes');
                await window.supabaseClient.auth.signOut();
                throw new Error('Accès non autorisé');
            }

            console.log('✅ Permissions validées');
            
            // Vérifier que la session est bien établie
            const { data: { session }, error: sessionError } = 
                await window.supabaseClient.auth.getSession();
            
            if (sessionError || !session) {
                throw new Error('Session non établie après connexion');
            }
            
            console.log('✅ Session établie:', session);
            loadingMessage.textContent = 'Connexion réussie, redirection...';
            
            // Sauvegarder la session dans localStorage pour la retrouver après redirection
            localStorage.setItem('adminSession', JSON.stringify({
                timestamp: Date.now(),
                email: data.user.email
            }));
            
            this.redirectToAdmin();

        } catch (error) {
            console.error('❌ Erreur de connexion:', error);
            errorMessage.textContent = error.message === 'Invalid login credentials'
                ? 'Email ou mot de passe incorrect'
                : error.message;
            errorMessage.style.display = 'block';
            loginBtn.disabled = false;
            loadingMessage.style.display = 'none';
        }
    }

    async checkAdminPermissions(user) {
        try {
            if (!user?.email) return false;

            // En mode développement, autoriser certains emails de test
            if (window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1') {
                const devEmails = [
                    'admin@localhost',
                    'admin@odc.local',
                    'test@localhost'
                ];
                if (devEmails.includes(user.email.toLowerCase())) {
                    return true;
                }
            }

            // En production, autoriser uniquement les emails vérifiés
            if (!user.email_confirmed_at) {
                console.log('❌ Email non vérifié:', user.email);
                return false;
            }

            const adminEmails = [
                'admin@orangedigitalcenter.ma',
                'backoffice@odc.ma',
                'admin@odc.ma',
                'hamza.elhamdani@orange.com',
                'el.hamza.hamdani@gmail.com',
                'sanaa.bellali@orange.com',
                'sanaa.bellaliz@orange.com'
            ];

            const isAdmin = adminEmails.includes(user.email.toLowerCase());
            if (!isAdmin) {
                console.log('❌ Email non autorisé:', user.email);
            }
            return isAdmin;

        } catch (error) {
            console.error('❌ Erreur permissions:', error);
            return false;
        }
    }

    redirectToAdmin() {
        try {
            console.group('🔄 Processus de redirection');
            console.log('1. État initial:');
            console.log('- URL complète:', window.location.href);
            console.log('- Protocole:', window.location.protocol);
            console.log('- Hôte:', window.location.host);
            console.log('- Chemin:', window.location.pathname);
            console.log('- Origine:', window.location.origin);
            
            // 1. Décomposer l'URL actuelle
            const currentUrl = new URL(window.location.href);
            console.log('\n2. Analyse URL actuelle:');
            console.log('- URL parsée:', currentUrl.toString());
            console.log('- Pathname:', currentUrl.pathname);
            console.log('- Search params:', currentUrl.search);
            console.log('- Hash:', currentUrl.hash);
            
            // 2. Construire la nouvelle URL
            let redirectUrl;
            
            if (currentUrl.pathname.includes('/admin/')) {
                console.log('\n3a. Cas: Déjà dans /admin/');
                // Si nous sommes déjà dans le dossier admin
                redirectUrl = new URL('index.html', currentUrl);
                console.log('- URL relative construite: index.html');
            } else {
                console.log('\n3b. Cas: Hors /admin/');
                // Si nous ne sommes pas dans le dossier admin
                redirectUrl = new URL('admin/index.html', currentUrl);
                console.log('- URL relative construite: admin/index.html');
            }
            
            console.log('\n4. URL finale:');
            console.log('- URL complète:', redirectUrl.toString());
            console.log('- Pathname:', redirectUrl.pathname);
            
            // 3. Vérifier que l'URL est accessible
            console.log('\n5. Vérification accessibilité...');
            fetch(redirectUrl.toString(), { method: 'HEAD' })
                .then(response => {
                    console.log('- Statut réponse:', response.status);
                    console.log('- Headers:', Object.fromEntries(response.headers));
                    if (response.ok) {
                        console.log('✅ URL accessible - Redirection dans 100ms');
                        // Redirection avec un petit délai pour voir les logs
                        setTimeout(() => {
                            console.log('🔄 Exécution redirection vers:', redirectUrl.toString());
                            window.location.href = redirectUrl.toString();
                        }, 100);
                    } else {
                        throw new Error(`URL inaccessible (${response.status})`);
                    }
                })
                .catch(error => {
                    console.error('❌ Erreur vérification URL:', error);
                    this.fallbackRedirect();
                });
            
        } catch (error) {
            console.error('❌ Erreur lors de la construction de l\'URL:', error);
            this.fallbackRedirect();
        }
    }

    fallbackRedirect() {
        console.log('⚠️ Tentative de redirection alternative...');
        
        // Essayer différentes approches
        const attempts = [
            () => window.location.href.replace('login.html', 'index.html'),
            () => window.location.origin + window.location.pathname.replace('login.html', 'index.html'),
            () => './index.html',
            () => '../admin/index.html'
        ];
        
        for (const attempt of attempts) {
            try {
                const url = attempt();
                console.log('🎯 Tentative avec URL:', url);
                
                fetch(url, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            console.log('✅ URL alternative valide trouvée');
                            window.location.href = url;
                            return;
                        }
                    })
                    .catch(() => {
                        console.log('❌ URL alternative non accessible');
                    });
            } catch (e) {
                console.log('❌ Erreur lors de la tentative:', e);
            }
        }
    }

    redirectToLogin() {
        if (!window.location.pathname.includes('login.html')) {
            const currentPath = window.location.pathname;
            const basePath = currentPath.substring(0, currentPath.indexOf('/admin/') + 7);
            window.location.replace(window.location.origin + basePath + 'login.html');
        }
    }

    async logout() {
        try {
            await this.supabase?.auth.signOut();
            this.currentUser = null;
            this.redirectToLogin();
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
        }
    }

    async requireAuth() {
        try {
            if (!this.supabase) {
                throw new Error('Client Supabase non disponible');
            }

            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error) throw error;

            if (!session?.user) {
                console.log('❌ Session invalide');
                this.redirectToLogin();
                return false;
            }

            const hasPermission = await this.checkAdminPermissions(session.user);
            if (!hasPermission) {
                console.log('❌ Permissions insuffisantes');
                await this.supabase.auth.signOut();
                this.redirectToLogin();
                return false;
            }

            this.currentUser = session.user;
            return true;

        } catch (error) {
            console.error('❌ Erreur auth:', error);
            this.redirectToLogin();
            return false;
        }
    }
}

// Instance globale
const authManager = new AuthManager();
window.authManager = authManager;

// Protection des pages admin
async function protectAdminPage() {
    const isAuthenticated = await authManager.requireAuth();
    if (isAuthenticated) {
        console.log('✅ Page protégée - accès autorisé');
    }
    return isAuthenticated;
}

window.protectAdminPage = protectAdminPage;