// Rewritten Events manager: EventsCRUD
// Responsibilities:
// - load, render, filter events
// - add / edit / delete events using window.SupabaseAPI
// - upload images using SupabaseAPI.uploadImage when a File is provided
// - minimal DOM API surface: window.eventsCRUD
class EventsCRUD {
    constructor() {
        this.events = [];
        this.uploaderInstance = null;
        this.initPromise = this.init();
    }

    async init() {
        // wait for SupabaseAPI to be ready
        while (!window.SupabaseAPI?.initialized) {
            await new Promise(r => setTimeout(r, 100));
        }
        console.log('✅ EventsCRUD initialisé');

        // bind UI elements
        this.container = document.getElementById('eventsGrid');
        this.eventsPage = document.getElementById('events-page');
        this.searchInput = document.getElementById('eventSearch');
        this.cityFilter = this.eventsPage?.querySelector('#cityFilter');
        this.statusFilter = this.eventsPage?.querySelector('#statusFilter');

        // wire events
        document.addEventListener('click', (e) => {
            if (e.target && e.target.matches && e.target.matches('.open-new-event')) {
                this.openModal();
            }
        });

        const addBtn = this.eventsPage?.querySelector('.section-header .btn');
        if (addBtn) addBtn.addEventListener('click', () => this.openModal());

        if (this.searchInput) this.searchInput.addEventListener('input', () => this.render());
        if (this.cityFilter) this.cityFilter.addEventListener('change', () => this.render());
        if (this.statusFilter) this.statusFilter.addEventListener('change', () => this.render());

        // load and render
        await this.loadEvents();
        this.render();
    }

    async loadEvents() {
        try {
            const rows = await window.SupabaseAPI.getEvents();
            this.events = Array.isArray(rows) ? rows : [];
            // keep global `events` in sync for legacy code that reads it
            try { window.events = this.events; } catch (e) { /* ignore */ }
            console.log(`✅ ${this.events.length} événements chargés (EventsCRUD)`);
            return this.events;
        } catch (err) {
            console.error('Erreur loadEvents:', err);
            this.events = [];
            return this.events;
        }
    }

    applyFilters(items) {
        const q = (this.searchInput?.value || '').trim().toLowerCase();
        const city = this.cityFilter?.value || '';
        const status = this.statusFilter?.value || '';

        return items.filter(item => {
            if (city && item.city !== city) return false;
            if (status && item.status !== status) return false;
            if (q) {
                const inTitle = (item.title || '').toLowerCase().includes(q);
                const inDesc = (item.description || '').toLowerCase().includes(q);
                return inTitle || inDesc;
            }
            return true;
        });
    }

    formatDateForDisplay(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    renderCard(item) {
        const image = item.image || this.generatePlaceholder(item.title || 'Événement');
        const date = this.formatDateForDisplay(item.date_start || item.date || '');
        const time = item.time_start || '';

        return `
            <div class="event-card" data-id="${item.id}">
                <div class="event-image-container">
                    <img src="${image}" alt="${this.escapeHtml(item.title || '')}" class="event-image" onerror="this.src='${this.generatePlaceholder(item.title||'')}'">
                    <div class="event-image-overlay">
                        <div class="event-overlay-content">
                            <button class="btn-icon btn-edit" data-id="${item.id}" title="Modifier"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon btn-delete" data-id="${item.id}" title="Supprimer"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
                <div class="event-content">
                    <h3 class="event-title">${this.escapeHtml(item.title || '')}</h3>
                    <div class="event-details">
                        <div><i class="fas fa-calendar"></i> ${date}</div>
                        <div><i class="fas fa-clock"></i> ${time}</div>
                        <div><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(item.city || '')} ${item.location ? ' - ' + this.escapeHtml(item.location) : ''}</div>
                    </div>
                    <p class="event-description">${this.escapeHtml((item.description || '').slice(0, 180))}${(item.description||'').length>180?'...':''}</p>
                </div>
                <div class="event-card-footer">
                    <div class="event-status ${this.escapeHtml(item.status||'')}">${this.escapeHtml(item.status||'')}</div>
                    <div class="event-actions">
                        <button class="btn-event edit" data-id="${item.id}">Modifier</button>
                        <button class="btn-event delete" data-id="${item.id}">Supprimer</button>
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    generatePlaceholder(title) {
        // lightweight placeholder: data URL with text could be heavy, return empty transparent pixel to avoid broken image
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="100%" height="100%" fill="#FF7900"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="36" fill="#fff">${this.escapeHtml(title || 'ODC')}</text></svg>`);
    }

    async render() {
        if (!this.container) return;
        // Ensure fresh data when needed
        await this.loadEvents();
        const filtered = this.applyFilters(this.events || []);
        if (filtered.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <h3>Aucun événement</h3>
                    <p>Créez un nouvel événement à l'aide du bouton "Ajouter".</p>
                    <button class="btn btn-primary open-new-event"><i class="fas fa-plus"></i> Créer un événement</button>
                </div>
            `;
            return;
        }

        this.container.innerHTML = filtered.map(i => this.renderCard(i)).join('');

        // Delegate click handlers (prevents multiple uploader instances)
        this.container.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', (e) => this.openModalForEdit(btn.dataset.id)));
        this.container.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', (e) => this.confirmDelete(btn.dataset.id)));
        this.container.querySelectorAll('.event-actions .edit').forEach(btn => btn.addEventListener('click', (e) => this.openModalForEdit(btn.dataset.id)));
        this.container.querySelectorAll('.event-actions .delete').forEach(btn => btn.addEventListener('click', (e) => this.confirmDelete(btn.dataset.id)));
    }

    async openModalForEdit(id) {
        const ev = this.events.find(it => it.id === id);
        if (!ev) return showNotification('Événement introuvable', 'error');
        this.openModal(ev);
    }

    async openModal(event = null) {
        const modal = document.getElementById('modal');
        const titleEl = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');

        titleEl.innerHTML = `${event ? 'Modifier l\'événement' : 'Nouvel événement'}`;

        // Build the form using modern floating-label layout for better UX
        body.innerHTML = `
            <form id="evForm" class="modern-form">
                <div class="form-section">
                    <h4><i class="fas fa-info-circle"></i> Informations</h4>

                    <div class="form-group floating-label">
                        <input type="text" id="ev_title" name="title" class="form-control" value="${this.escapeHtml(event?.title||'')}" required>
                        <label for="ev_title">Titre *</label>
                    </div>

                    <div class="form-group floating-label">
                        <textarea id="ev_description" name="description" class="form-control" rows="4" maxlength="1000">${this.escapeHtml(event?.description||'')}</textarea>
                        <label for="ev_description">Description</label>
                        <small class="form-help char-count" id="evDescriptionHelp">${(event?.description||'').length}/1000 caractères</small>
                    </div>
                </div>

                <div class="form-section">
                    <h4><i class="fas fa-calendar"></i> Date & heure</h4>
                    <div class="form-row">
                        <div class="form-group floating-label">
                            <input type="date" id="ev_date" name="date" class="form-control" value="${event?.date_start||event?.date||''}" required>
                            <label for="ev_date">Date *</label>
                        </div>
                        <div class="form-group floating-label">
                            <input type="time" id="ev_timeStart" name="timeStart" class="form-control" value="${event?.time_start||event?.timeStart||''}" required>
                            <label for="ev_timeStart">Heure début *</label>
                        </div>
                        <div class="form-group floating-label">
                            <input type="time" id="ev_timeEnd" name="timeEnd" class="form-control" value="${event?.time_end||event?.timeEnd||''}">
                            <label for="ev_timeEnd">Heure fin</label>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4><i class="fas fa-map-marker-alt"></i> Localisation</h4>
                    <div class="form-row">
                        <div class="form-group floating-label">
                            <select id="ev_city" name="city" class="form-control" required>
                                <option value="">Sélectionner</option>
                                <option value="rabat" ${event?.city==='rabat'?'selected':''}>Rabat</option>
                                <option value="agadir" ${event?.city==='agadir'?'selected':''}>Agadir</option>
                                <option value="benmisk" ${event?.city==='benmisk'?'selected':''}>Ben M'sik</option>
                                <option value="sidimaarouf" ${event?.city==='sidimaarouf'?'selected':''}>Sidi Maarouf</option>
                            </select>
                            <label for="ev_city">Ville *</label>
                        </div>
                        <div class="form-group floating-label">
                            <input type="text" id="ev_location" name="location" class="form-control" value="${this.escapeHtml(event?.location||'')}">
                            <label for="ev_location">Lieu</label>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4><i class="fas fa-image"></i> Image</h4>
                    <div class="form-group">
                        <input type="file" id="ev_imageFile" accept="image/*">
                        <small class="form-help">JPG, PNG, GIF ou WEBP — taille max 5MB</small>
                        <div id="ev_currentImage" aria-live="polite">${event?.image?`<img src="${event.image}">` : ''}</div>
                        <div id="ev_imagePreview" class="image-preview-container" aria-hidden="true"></div>
                    </div>
                </div>

                <div class="form-section">
                    <h4><i class="fas fa-users"></i> Participants & statut</h4>
                    <div class="form-row">
                        <div class="form-group floating-label">
                            <input type="number" id="ev_maxParticipants" name="maxParticipants" class="form-control" min="0" value="${event?.max_participants||event?.maxParticipants||0}">
                            <label for="ev_maxParticipants">Max participants *</label>
                        </div>
                        <div class="form-group floating-label">
                            <input type="number" id="ev_currentParticipants" name="currentParticipants" class="form-control" min="0" value="${event?.current_participants||event?.currentParticipants||0}">
                            <label for="ev_currentParticipants">Participants inscrits</label>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group floating-label">
                            <input type="url" id="ev_registrationLink" name="registrationLink" class="form-control" value="${this.escapeHtml(event?.registration_link||event?.registrationLink||'')}">
                            <label for="ev_registrationLink">Lien d'inscription</label>
                        </div>
                        <div class="form-group floating-label">
                            <select id="ev_status" name="status" class="form-control">
                                <option value="active" ${event?.status==='active'?'selected':''}>Actif</option>
                                <option value="completed" ${event?.status==='completed'?'selected':''}>Terminé</option>
                                <option value="cancelled" ${event?.status==='cancelled'?'selected':''}>Annulé</option>
                            </select>
                            <label for="ev_status">Statut</label>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="ev_cancel">Annuler</button>
                    <button type="submit" class="btn btn-primary">${event?'Mettre à jour':'Créer'}</button>
                </div>
            </form>
        `;

        modal.classList.add('show');

        // handlers
        document.getElementById('ev_cancel').addEventListener('click', () => modal.classList.remove('show'));

        const form = document.getElementById('evForm');
        // client-side image validation + preview
        try {
            const fileInput = document.getElementById('ev_imageFile');
            const previewHolder = document.getElementById('ev_imagePreview');
            if (fileInput) {
                fileInput.addEventListener('change', (evt) => {
                    const f = fileInput.files && fileInput.files[0];
                    previewHolder.innerHTML = '';
                    if (!f) return;
                    const allowed = ['image/jpeg','image/png','image/gif','image/webp'];
                    const maxBytes = 5 * 1024 * 1024; // 5MB
                    if (!allowed.includes(f.type)) {
                        showNotification('Format d\'image non supporté. Utilisez JPG, PNG, GIF ou WEBP.', 'error');
                        fileInput.value = '';
                        return;
                    }
                    if (f.size > maxBytes) {
                        showNotification('Image trop volumineuse (max 5MB).', 'error');
                        fileInput.value = '';
                        return;
                    }

                    // show preview
                    try {
                        const url = URL.createObjectURL(f);
                        const img = document.createElement('img');
                        img.src = url;
                        img.style.maxWidth = '160px';
                        img.style.borderRadius = '6px';
                        previewHolder.appendChild(img);
                    } catch (err) {
                        console.warn('Erreur preview image:', err);
                    }
                });
            }
        } catch (err) { console.warn('Erreur init validation image:', err); }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {};
            payload.title = document.getElementById('ev_title').value.trim();
            payload.description = document.getElementById('ev_description').value.trim() || null;
            payload.date = document.getElementById('ev_date').value || null;
            payload.timeStart = document.getElementById('ev_timeStart').value || null;
            payload.timeEnd = document.getElementById('ev_timeEnd').value || null;
            payload.city = document.getElementById('ev_city').value || null;
            payload.location = document.getElementById('ev_location').value.trim() || null;
            payload.maxParticipants = parseInt(document.getElementById('ev_maxParticipants').value || 0) || 0;
            payload.currentParticipants = parseInt(document.getElementById('ev_currentParticipants').value || 0) || 0;
            payload.registrationLink = document.getElementById('ev_registrationLink').value.trim() || null;
            payload.status = document.getElementById('ev_status').value || 'active';

            // file handling
            const fileInput2 = document.getElementById('ev_imageFile');
            const file = fileInput2?.files?.[0];

            try {
                // If file selected, validate again then upload via SupabaseAPI and set payload.image to returned public URL
                if (file) {
                    const allowed = ['image/jpeg','image/png','image/gif','image/webp'];
                    const maxBytes = 5 * 1024 * 1024; // 5MB
                    if (!allowed.includes(file.type)) throw new Error('Format d\'image non supporté');
                    if (file.size > maxBytes) throw new Error('Image trop volumineuse (max 5MB)');

                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.disabled = true;
                    showNotification('Upload de l\'image en cours...', 'info');
                    const uploadedUrl = await window.SupabaseAPI.uploadImage(file, 'events');
                    payload.image = uploadedUrl;
                    if (submitBtn) submitBtn.disabled = false;
                } else if (event && event.image) {
                    // preserve existing image when editing and no new file
                    payload.image = event.image;
                }

                // If editing, include id
                if (event && event.id) payload.id = event.id;

                console.log('🔍 Payload événement (avant envoi):', payload);

                const saved = await window.SupabaseAPI.saveEvent(payload);
                showNotification('Événement sauvegardé', 'success');
                modal.classList.remove('show');
                await this.loadEvents();
                await this.render();
            } catch (err) {
                console.error('Erreur sauvegarde événement:', err);
                showNotification('Erreur lors de la sauvegarde', 'error');
            }
        });

        // Character counter for description
        try {
            const desc = document.getElementById('ev_description');
            const help = document.getElementById('evDescriptionHelp');
            if (desc && help) {
                const update = () => { help.textContent = `${desc.value.length}/1000 caractères`; };
                desc.addEventListener('input', update);
                update();
            }
        } catch (err) { console.warn('Erreur init compteur de caractères événement:', err); }
    }

    async confirmDelete(id) {
        if (!confirm('Confirmer la suppression de cet événement ?')) return;
        try {
            // attempt to remove image first if exists
            const ev = this.events.find(x => x.id === id);
            if (ev?.image) {
                try { await window.SupabaseAPI.deleteImage(ev.image); } catch(e){ console.warn('Suppression image échouée', e); }
            }
            await window.SupabaseAPI.deleteEvent(id);
            showNotification('Événement supprimé', 'success');
            await this.loadEvents();
            await this.render();
        } catch (err) {
            console.error('Erreur suppression événement:', err);
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}

// Instantiate and expose
window.eventsCRUD = new EventsCRUD();

// Backwards compatibility: expose a minimal `eventsManager` wrapper so legacy
// calls (editEvent, deleteEvent, showEventModal, renderEvents) continue to work
window.eventsManager = {
    renderEvents: async () => { await window.eventsCRUD.render(); },
    loadEvents: async () => { await window.eventsCRUD.loadEvents(); },
    editEvent: (id) => { return window.eventsCRUD.openModalForEdit(id); },
    deleteEvent: (id) => { return window.eventsCRUD.confirmDelete(id); },
    showEventModal: (ev) => { return window.eventsCRUD.openModal(ev); }
};

// Ensure render after DOM ready and Supabase init
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.eventsCRUD.initPromise;
        await window.eventsCRUD.render();
    } catch (err) {
        console.error('Erreur initialisation EventsCRUD:', err);
    }
});