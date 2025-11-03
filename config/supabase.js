(function() {
    "use strict";

    // Singleton instance
    let supabaseClientInstance = null;

    async function waitForEnv() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (window.ENV?.SUPABASE_URL && window.ENV?.SUPABASE_ANON_KEY) {
                    clearInterval(interval);
                    resolve();
                } else if (attempts >= 50) {
                    clearInterval(interval);
                    reject(new Error('Variables d\'environnement non trouvées'));
                }
            }, 100);
        });
    }

    function getDefaultSettings() {
        return {
            siteTitle: 'Orange Digital Center - Formations & Événements du Mois',
            heroTitle: 'Orange Digital Center',
            heroSubtitle: 'Découvrez nos formations et événements dans tous nos centres Orange Digital Center',
            contactEmail: 'contact@odc.orange.ma',
            contactPhone: '',
            odcCenters: [
                { name: 'ODC Rabat', address: 'Technopolis Rabat-Shore, Rabat', phone: '' },
                { name: 'ODC Agadir', address: 'Quartier Industriel, Agadir', phone: '' },
                { name: 'ODC Ben M\'sik', address: 'Ben M\'sik, Casablanca', phone: '' },
                { name: 'ODC Sidi Maarouf', address: 'Sidi Maarouf, Casablanca', phone: '' }
            ]
        };
    }

    // API Supabase
    window.SupabaseAPI = {
        initialized: false,

        async init() {
            try {
                console.log('🚀 Initialisation de Supabase...');
                
                // If already initialized, return the existing instance
                if (supabaseClientInstance) {
                    console.log('✅ Using existing Supabase client instance');
                    return true;
                }
                
                // Attendre les variables d'environnement
                await waitForEnv();
                console.log('✅ Variables d\'environnement chargées');
                
                // Créer le client Supabase
                if (!window.supabase?.createClient) {
                    throw new Error('La bibliothèque Supabase n\'est pas chargée');
                }

                supabaseClientInstance = window.supabase.createClient(
                    window.ENV.SUPABASE_URL,
                    window.ENV.SUPABASE_ANON_KEY,
                    {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true,
                            detectSessionInUrl: true
                        }
                    }
                );
                
                // Tester la connexion
                const { error } = await supabaseClientInstance
                    .from('formations')
                    .select('count');
                
                if (error) throw error;
                
                window.supabaseClient = supabaseClientInstance;
                this.initialized = true;
                
                console.log('✅ Supabase initialisé avec succès');
                return true;
                
            } catch (error) {
                console.error('❌ Erreur d\'initialisation Supabase:', error);
                return false;
            }
        },

        getClient() {
            if (!supabaseClientInstance) {
                throw new Error('Supabase client not initialized');
            }
            return supabaseClientInstance;
        },

        async testConnection() {
            if (!this.initialized) {
                await this.init();
            }
            return this.initialized;
        },

        async ping() {
            await this.testConnection();
            try {
                const { error } = await this.getClient()
                    .from('formations')
                    .select('count');
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('❌ Erreur de ping Supabase:', error);
                throw error;
            }
        },

        // Formations
        async getFormations() {
            await this.testConnection();
            const { data, error } = await this.getClient()
                .from('formations')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;

            // Normalize DB snake_case -> frontend camelCase to match admin UI expectations
            const normalize = (row) => {
                if (!row) return row;
                return {
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    category: row.category,
                    city: row.city,
                    location: row.location,
                    image: row.image,
                    registrationLink: row.registration_link || row.registrationLink || '',
                    dateStart: row.date_start || row.dateStart || null,
                    dateEnd: row.date_end || row.dateEnd || null,
                    timeStart: row.time_start || row.timeStart || null,
                    timeEnd: row.time_end || row.timeEnd || null,
                    maxParticipants: row.max_participants ?? row.maxParticipants ?? 0,
                    currentParticipants: row.current_participants ?? row.currentParticipants ?? 0,
                    status: row.status,
                    createdAt: row.created_at || row.createdAt || null,
                    updatedAt: row.updated_at || row.updatedAt || null,
                    // keep any other props that may be consumed directly
                    ...Object.keys(row).reduce((acc, k) => {
                        if (![ 'id','title','description','category','city','location','image','registration_link','date_start','date_end','time_start','time_end','max_participants','current_participants','status','created_at','updated_at' ].includes(k)) {
                            acc[k] = row[k];
                        }
                        return acc;
                    }, {})
                };
            };

            const normalized = (data || []).map(normalize);
            console.log('🔁 Formations récupérées et normalisées:', normalized.length);
            return normalized;
        },

        async saveFormation(formation) {
            await this.testConnection();
            console.log('🔍 Données reçues pour sauvegarde (raw):', JSON.stringify(formation, null, 2));

            // Normalize payload for Supabase/PostgREST:
            // - map common camelCase keys to snake_case expected by DB
            // - remove any unknown camelCase transient keys that likely don't exist in the table
            const mapping = {
                dateStart: 'date_start',
                dateEnd: 'date_end',
                timeStart: 'time_start',
                timeEnd: 'time_end',
                maxParticipants: 'max_participants',
                currentParticipants: 'current_participants',
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                imageUrl: 'image',
                registrationLink: 'registration_link'
            };

            const payload = {};
            Object.keys(formation || {}).forEach(key => {
                const value = formation[key];

                // If key is explicitly mapped, use mapped name
                if (mapping[key]) {
                    payload[mapping[key]] = value;
                    return;
                }

                // Skip transient camelCase keys that likely don't exist in DB (heuristic)
                if (/[A-Z]/.test(key)) {
                    // If it's 'image' as object, try to extract url
                    if (key === 'image' && typeof value !== 'string') {
                        // prefer imageUrl if present
                        if (formation.imageUrl) payload['image'] = formation.imageUrl;
                    }
                    return; // skip other CamelCase keys
                }

                // Keep keys that are already snake_case or lowercase
                payload[key] = value;
            });

            // Ensure types: numbers for numeric fields
            if (payload.max_participants) payload.max_participants = parseInt(payload.max_participants) || 0;
            if (payload.price) payload.price = parseFloat(payload.price) || 0;

            // If image is still an object or undefined, try to use imageUrl
            if (payload.image && typeof payload.image !== 'string') {
                payload.image = formation.imageUrl || null;
            }

            // Log final payload
            console.log('🔍 Payload envoyé à Supabase (normalized):', JSON.stringify(payload, null, 2));
            // If id is present but not a valid UUID, remove it so the DB can generate one
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (payload.id && !uuidRegex.test(String(payload.id))) {
                console.warn('⚠️ SupabaseAPI: id non-UUID détecté, suppression avant envoi:', payload.id);
                delete payload.id;
            }

            const { data, error } = await this.getClient()
                .from('formations')
                .upsert([payload])
                .select();
            
            if (error) {
                console.error('❌ Erreur Supabase détaillée:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            console.log('✅ Formation sauvegardée:', data[0]);
            return data[0];
        },

        async deleteFormation(id) {
            await this.testConnection();
            const { error } = await this.getClient()
                .from('formations')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        },

        // Événements
        async getEvents() {
            await this.testConnection();
            const { data, error } = await this.getClient()
                .from('events')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;

            // Normalize image fields: if image is a storage path (not an http url),
            // convert to a public URL from the 'odc-images' bucket so the admin UI can display it.
            const normalizeImage = async (row) => {
                if (!row) return row;
                const image = row.image;
                if (!image) return row;

                try {
                    if (/^https?:\/\//i.test(String(image))) {
                        // already a full url
                        row.image = image;
                        return row;
                    }

                    // If image looks like a storage path (e.g., 'events/xxx.jpg'), get public url
                    const { data: publicData } = this.getClient().storage
                        .from('odc-images')
                        .getPublicUrl(String(image));

                    if (publicData && publicData.publicUrl) {
                        row.image = publicData.publicUrl;
                    } else {
                        // fallback: leave as empty so UI uses generated fallback image
                        row.image = '';
                    }
                } catch (err) {
                    console.warn('⚠️ Impossible de normaliser l\'image pour l\'événement', row.id, err);
                    row.image = '';
                }

                return row;
            };

            // Map rows and normalize images in parallel
            const rows = data || [];
            const normalizedRows = await Promise.all(rows.map(normalizeImage));
            return normalizedRows;
        },

        async saveEvent(event) {
            await this.testConnection();
            console.log('🔍 Données reçues pour sauvegarde d\'événement (raw):', JSON.stringify(event, null, 2));

            // Build a strict payload that matches the `events` table schema exactly
            // Whitelist of allowed snake_case columns in the events table (as seen in your Supabase schema)
            const allowed = new Set([
                'id','title','description','date_start','time_start','time_end',
                'city','location','image','max_participants','current_participants',
                'registration_link','status','created_at','updated_at'
            ]);

            // Map common camelCase input keys to the DB snake_case columns
            const mapping = {
                timeStart: 'time_start',
                timeEnd: 'time_end',
                date: 'date_start',
                maxParticipants: 'max_participants',
                currentParticipants: 'current_participants',
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                registrationLink: 'registration_link',
                imageUrl: 'image'
            };

            const payload = {};

            // First, map known camelCase source keys
            Object.keys(mapping).forEach(srcKey => {
                if (srcKey in event && event[srcKey] !== undefined && event[srcKey] !== null) {
                    payload[mapping[srcKey]] = event[srcKey];
                }
            });

            // Then, copy any snake_case or already-correct keys if they're allowed
            Object.keys(event || {}).forEach(key => {
                if (allowed.has(key)) {
                    // prefer already-mapped value if present
                    if (!(key in payload)) payload[key] = event[key];
                }
            });

            // Ensure required/typed fields
            // time_end: if missing, fall back to time_start to avoid NOT NULL violation
            if ((!payload.time_end || payload.time_end === '') && payload.time_start) {
                payload.time_end = payload.time_start;
            }

            // Numeric conversions and defaults
            payload.max_participants = parseInt(payload.max_participants) || 0;
            payload.current_participants = parseInt(payload.current_participants) || 0;

            // Status default
            if (!payload.status) payload.status = 'active';

            // created_at / updated_at defaults
            const now = new Date().toISOString();
            if (!payload.created_at) payload.created_at = event.createdAt || now;
            payload.updated_at = event.updatedAt || now;

            // Ensure image is string or null
            if (payload.image && typeof payload.image !== 'string') {
                payload.image = event.imageUrl || null;
            }

            // If id is present and is a valid UUID, perform an UPDATE to avoid creating duplicates.
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const isUuid = payload.id && uuidRegex.test(String(payload.id));

            // Final cleanup: remove any keys not in allowed set (safety)
            Object.keys(payload).forEach(k => { if (!allowed.has(k)) delete payload[k]; });

            console.log('🔍 Payload envoyé à Supabase (normalized event):', JSON.stringify(payload, null, 2));

            let result, errorResult;
            if (isUuid) {
                // Use update to modify existing row
                ({ data: result, error: errorResult } = await this.getClient()
                    .from('events')
                    .update(payload)
                    .eq('id', payload.id)
                    .select());
            } else {
                // No valid id -> insert (upsert) as before
                ({ data: result, error: errorResult } = await this.getClient()
                    .from('events')
                    .upsert([payload])
                    .select());
            }

            if (errorResult) {
                console.error('❌ Erreur Supabase (events):', {
                    message: errorResult.message,
                    details: errorResult.details,
                    hint: errorResult.hint,
                    code: errorResult.code
                });
                throw errorResult;
            }

            console.log('✅ Événement sauvegardé:', result && result[0] ? result[0] : result);
            return Array.isArray(result) ? result[0] : result;
        },

        async updateEvent(id, event) {
            await this.testConnection();
            const { data, error } = await this.getClient()
                .from('events')
                .update(event)
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return data[0];
        },

        async deleteEvent(id) {
            await this.testConnection();
            const { error } = await this.getClient()
                .from('events')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        },

        // Images
        async uploadImage(file, folder = 'formations') {
            await this.testConnection();
            const bucketExists = await this.createImageBucket();
            
            if (!bucketExists) {
                throw new Error('Le bucket odc-images n\'existe pas. Veuillez le créer dans Supabase Storage.');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${this.generateId()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;
            
            console.log('📤 Upload de l\'image:', filePath);
            
            const { data, error: uploadError } = await this.getClient().storage
                .from('odc-images')
                .upload(filePath, file);
            
            if (uploadError) {
                console.error('Détails erreur upload:', uploadError);
                throw uploadError;
            }
            
            const { data: publicUrlData } = this.getClient().storage
                .from('odc-images')
                .getPublicUrl(filePath);
            
            console.log('✅ Image uploadée:', publicUrlData.publicUrl);
            return publicUrlData.publicUrl;
        },

        async deleteImage(imageUrl) {
            await this.testConnection();
            
            if (!imageUrl || !imageUrl.includes('supabase')) {
                console.log('⚠️ Image externe, suppression ignorée');
                return true;
            }
            
            const urlParts = imageUrl.split('/storage/v1/object/public/odc-images/');
            if (urlParts.length < 2) {
                console.warn('⚠️ Format d\'URL non reconnu');
                return false;
            }
            
            const filePath = urlParts[1];
            console.log('🗑️ Suppression de l\'image:', filePath);
            
            const { error } = await this.getClient().storage
                .from('odc-images')
                .remove([filePath]);
            
            if (error) throw error;
            
            console.log('✅ Image supprimée');
            return true;
        },

        async getImageUrl(filePath) {
            await this.testConnection();
            const { data } = this.getClient().storage
                .from('odc-images')
                .getPublicUrl(filePath);
            
            return data.publicUrl;
        },

        // Paramètres
        async getSettings() {
            await this.testConnection();
            const { data, error } = await this.getClient()
                .from('settings')
                .select('*')
                .single();
            
            if (error && error.code === 'PGRST116') return getDefaultSettings();
            if (error) throw error;
            return data || getDefaultSettings();
        },

        async saveSettings(settings) {
            await this.testConnection();
            const { data, error } = await this.getClient()
                .from('settings')
                .upsert([{ id: 1, ...settings }])
                .select();
            
            if (error) throw error;
            return data[0];
        },

        // Utils
        generateId() {
            return crypto.randomUUID();
        },

        async compressImage(file, maxWidth = 800, quality = 0.8) {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = function() {
                    let { width, height } = img;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => resolve(blob), file.type, quality);
                };
                
                img.src = URL.createObjectURL(file);
            });
        },

        async createImageBucket() {
            await this.testConnection();
            try {
                const { data, error } = await this.getClient().storage
                    .from('odc-images')
                    .list('', { limit: 1 });
                
                if (error) {
                    if (error.message.includes('Bucket not found')) {
                        console.warn('⚠️ Bucket odc-images n\'existe pas. Veuillez le créer manuellement dans Supabase Storage.');
                        return false;
                    }
                    throw error;
                }
                
                console.log('✅ Bucket odc-images existe et est accessible');
                return true;
            } catch (error) {
                console.error('❌ Erreur lors de la vérification du bucket:', error);
                console.log('💡 Solution: Créez le bucket "odc-images" manuellement dans Supabase Storage');
                return false;
            }
        }
    };

    // Initialiser au chargement
    document.addEventListener('DOMContentLoaded', () => {
        window.SupabaseAPI.init().then(success => {
            if (success) {
                console.log('✅ API Supabase prête');
            } else {
                console.error('❌ Erreur d\'initialisation de l\'API Supabase');
            }
        });
    });
})();