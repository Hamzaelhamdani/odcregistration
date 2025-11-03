// Helper pour traduire les codes des villes
function getCityLabel(cityCode) {
    const cities = {
        'rabat': 'ODC Rabat',
        'agadir': 'ODC Agadir',
        'benmisk': 'ODC Ben M\'sik',
        'sidimaarouf': 'ODC Sidi Maarouf'
    };
    return cities[cityCode] || cityCode;
}

async function handleEventImageUpload(input) {
    if (!input.files || input.files.length === 0) return;
    
    try {
        const file = input.files[0];
        console.log('📸 Upload d\'image:', file.name);

        // Upload l'image à Supabase
        const imageUrl = await window.SupabaseAPI.uploadImage(file, 'events');
        console.log('✅ Image uploadée:', imageUrl);
        
        // Mettre à jour l'aperçu
        document.getElementById('eventImagePreview').style.display = 'block';
        document.getElementById('eventPreviewImg').src = imageUrl;
        document.getElementById('eventImage').value = imageUrl;
        document.getElementById('eventUploadArea').style.display = 'none';

        showNotification('Image téléchargée avec succès', 'success');
    } catch (error) {
        console.error('❌ Erreur upload image:', error);
        showNotification('Erreur lors du téléchargement de l\'image', 'error');
    }
}

async function loadEventsTable() {
    try {
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
        }

        console.log('📊 Chargement des événements depuis Supabase...');
        events = await window.SupabaseAPI.getEvents();
        
        if (events && events.length > 0) {
            console.log(`✅ ${events.length} événements chargés`);
            events.forEach(event => {
                if (event.image) {
                    try {
                        const url = new URL(event.image);
                        console.log('✅ URL d\'image valide:', url.toString());
                    } catch (error) {
                        console.warn('⚠️ URL d\'image invalide:', event.image);
                        event.image = null;
                    }
                }
                console.log('Debug événement:', {
                    id: event.id,
                    title: event.title,
                    image: event.image
                });
            });
        } else {
            console.log('📝 Aucun événement trouvé');
        }
        
        // If an EventsManager instance exists, delegate rendering to it so we
        // don't have two competing renderers/uploader initializations.
        if (window.eventsManager && typeof window.eventsManager.renderEvents === 'function') {
            // Keep the shared events array in sync for other modules
            window.events = events;
            try {
                await window.eventsManager.renderEvents();
                return;
            } catch (err) {
                console.warn('⚠️ Delegation to eventsManager.renderEvents failed, falling back to local renderer', err);
            }
        }

        // Fallback to the local grid renderer
        renderEventsGrid();
        
    } catch (error) {
        console.error('❌ Erreur chargement événements:', error);
        showNotification('Erreur lors du chargement des événements', 'error');
    }
}

function renderEventsGrid() {
    console.log('🎨 Rendu de la grille des événements...');
    
    const grid = document.getElementById('eventsGrid');
    if (!grid) {
        console.error('❌ Élément eventsGrid introuvable');
        return;
    }
    
    console.log(`📊 Rendu de ${events.length} événements`);
    
    if (events.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <h3>Aucun événement</h3>
                <p>Commencez par créer votre premier événement</p>
                <button class="btn btn-primary" onclick="handleAddButton()">
                    <i class="fas fa-plus"></i> Créer un événement
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = events.map(event => {
        const eventDate = new Date(event.date);
        const today = new Date();
        const isUpcoming = eventDate >= today;
        const isPast = eventDate < today && event.status !== 'active';
        
        const formattedDate = eventDate.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
        
        const formattedTime = event.timeStart ? event.timeStart.slice(0, 5) : '';
        
        let statusClass, statusLabel, statusIcon;
        if (isPast) {
            statusClass = 'completed';
            statusLabel = 'Terminé';
            statusIcon = 'fa-check-circle';
        } else if (event.status === 'active') {
            statusClass = 'active';
            statusLabel = isUpcoming ? 'À venir' : 'En cours';
            statusIcon = 'fa-calendar-check';
        } else {
            statusClass = 'cancelled';
            statusLabel = 'Annulé';
            statusIcon = 'fa-calendar-times';
        }

        // Vérifier et nettoyer l'URL de l'image
        let imageUrl = event.image || '';
        console.log('🔍 Vérification de l\'URL d\'image:', imageUrl);

        // Valider l'URL de l'image
        const { isValid: isValidImageUrl, url: validatedImageUrl } = window.ImageUtils.validateImageUrl(imageUrl);
        imageUrl = validatedImageUrl;

        // Générer l'image de fallback
        const fallbackImageUrl = window.ImageUtils.generateFallbackImage(event.title, {
            pattern: true,
            circles: true,
            logo: true,
            font: 'bold 20px "Open Sans", sans-serif',
            lineHeight: 25
        });
        
        const handleImageLoad = (img) => {
            const container = img.parentElement;
            container.classList.add('loaded');
            img.classList.add('loaded');
            if (container.querySelector('.event-image-loading-progress')) {
                container.querySelector('.event-image-loading-progress').style.width = '100%';
            }
            setTimeout(() => {
                if (container.querySelector('.event-image-loading-progress')) {
                    container.querySelector('.event-image-loading-progress').style.opacity = '0';
                }
            }, 300);
        };

        const handleImageError = (img) => {
            const container = img.parentElement;
            container.classList.add('error');
            container.classList.remove('loaded', 'loading');
            if (img.src !== img.getAttribute('data-fallback')) {
                img.src = img.getAttribute('data-fallback');
            }
            if (container.querySelector('.event-image-loading-progress')) {
                container.querySelector('.event-image-loading-progress').style.width = '0';
            }
        };

        const handleImageProgress = (img) => {
            const container = img.parentElement;
            container.classList.add('loading');
            if (!container.querySelector('.event-image-loading-progress')) {
                const progress = document.createElement('div');
                progress.className = 'event-image-loading-progress';
                container.appendChild(progress);
            }
        };
        
        return `
            <div class="event-card ${statusClass}" data-event-id="${event.id}">
                <div class="event-image-container">
                    <img src="${isValidImageUrl ? imageUrl : fallbackImageUrl}" 
                         alt="${event.title}" 
                         class="event-image" 
                         data-original="${imageUrl}"
                         data-fallback="${fallbackImageUrl}"
                         onload="(${handleImageLoad.toString()})(this)"
                         onerror="(${handleImageError.toString()})(this)"
                         onloadstart="(${handleImageProgress.toString()})(this)"
                         loading="lazy">
                    <div class="event-image-overlay">
                        <div class="event-overlay-content">
                            <button class="btn-icon" onclick="viewEvent('${event.id}')" title="Voir les détails">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" onclick="editEvent('${event.id}')" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="event-content">
                    <div class="event-header">
                        <h3 class="event-title">${event.title}</h3>
                        <span class="event-status ${statusClass}">
                            <i class="fas ${statusIcon}"></i> ${statusLabel}
                        </span>
                    </div>
                    
                    <div class="event-details">
                        <div class="event-detail">
                            <i class="fas fa-calendar"></i>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="event-detail">
                            <i class="fas fa-clock"></i>
                            <span>${formattedTime || 'Heure à définir'}</span>
                        </div>
                        <div class="event-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${getCityLabel(event.city)} - ${event.location || 'Lieu à définir'}</span>
                        </div>
                        ${event.maxParticipants ? `
                            <div class="event-detail">
                                <i class="fas fa-users"></i>
                                <span>${event.currentParticipants || 0} / ${event.maxParticipants}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${event.description ? `
                        <p class="event-description">
                            ${event.description.length > 120 ? 
                                event.description.slice(0, 120) + '...' : 
                                event.description}
                        </p>
                    ` : ''}
                </div>
                
                <div class="event-actions">
                    ${event.registrationLink ? `
                        <a href="${event.registrationLink}" target="_blank" class="btn btn-primary btn-sm">
                            <i class="fas fa-external-link-alt"></i> S'inscrire
                        </a>
                    ` : ''}
                    <button class="btn btn-primary btn-sm" onclick="editEvent('${event.id}')" title="Modifier">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEvent('${event.id}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// [Rest of the code remains unchanged]