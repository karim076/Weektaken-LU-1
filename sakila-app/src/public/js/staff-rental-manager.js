/**
 * Staff Rental Management
 * Handles film checkout, checkin, and rental management for staff
 */

class StaffRentalManager {
    constructor() {
        this.currentRentals = [];
        this.overdueRentals = [];
        this.searchResults = {
            customers: [],
            films: []
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadRentalData();
    }
    
    setupEventListeners() {
        // Customer search for checkout
        const customerSearch = document.getElementById('checkout-customer-search');
        if (customerSearch) {
            customerSearch.addEventListener('input', (e) => {
                this.debounce(() => this.searchCustomers(e.target.value), 300);
            });
        }
        
        // Film search for checkout
        const filmSearch = document.getElementById('checkout-film-search');
        if (filmSearch) {
            filmSearch.addEventListener('input', (e) => {
                this.debounce(() => this.searchFilms(e.target.value), 300);
            });
        }
        
        // Checkout form submission
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processCheckout();
            });
        }
        
        // Checkin form submission
        const checkinForm = document.getElementById('checkin-form');
        if (checkinForm) {
            checkinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processCheckin();
            });
        }
        
        // Rental status updates
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('return-rental-btn')) {
                const rentalId = e.target.dataset.rentalId;
                this.returnRental(rentalId);
            }
            
            if (e.target.classList.contains('approve-rental-btn')) {
                const rentalId = e.target.dataset.rentalId;
                this.approveRental(rentalId);
            }
            
            if (e.target.classList.contains('extend-rental-btn')) {
                const rentalId = e.target.dataset.rentalId;
                this.extendRental(rentalId);
            }
            
            if (e.target.classList.contains('view-rental-btn')) {
                const rentalId = e.target.dataset.rentalId;
                this.viewRentalDetails(rentalId);
            }
        });
        
        // Tab switching
        const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const targetId = e.target.getAttribute('href');
                if (targetId === '#checkout-tab-pane') {
                    this.focusCheckoutSearch();
                } else if (targetId === '#checkin-tab-pane') {
                    this.focusCheckinSearch();
                }
            });
        });
    }
    
    async loadRentalData() {
        try {
            // Load pending rentals (in behandeling) and overdue rentals
            const [pendingResponse, overdueResponse] = await Promise.all([
                fetch('/staff/api/rentals/pending'),
                fetch('/staff/api/rentals/overdue')
            ]);
            
            if (pendingResponse.ok) {
                const pendingData = await pendingResponse.json();
                this.currentRentals = pendingData.rentals || [];
                this.renderCurrentRentals();
            }
            
            if (overdueResponse.ok) {
                const overdueData = await overdueResponse.json();
                this.overdueRentals = overdueData.rentals || [];
                this.renderOverdueRentals();
            }
        } catch (error) {
            console.error('Error loading rental data:', error);
            this.showToast('Fout bij laden verhuur gegevens', 'error');
        }
    }
    
    async searchCustomers(query) {
        if (query.length < 2) {
            this.clearCustomerResults();
            return;
        }
        
        try {
            const response = await fetch(`/staff/api/customers/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.success) {
                this.searchResults.customers = data.customers;
                this.renderCustomerResults();
            }
        } catch (error) {
            console.error('Error searching customers:', error);
        }
    }
    
    async searchFilms(query) {
        if (query.length < 2) {
            this.clearFilmResults();
            return;
        }
        
        try {
            const response = await fetch(`/staff/api/films/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.success) {
                this.searchResults.films = data.films;
                this.renderFilmResults();
            }
        } catch (error) {
            console.error('Error searching films:', error);
        }
    }
    
    renderCustomerResults() {
        const resultsContainer = document.getElementById('customer-search-results');
        if (!resultsContainer) return;
        
        if (this.searchResults.customers.length === 0) {
            resultsContainer.innerHTML = '<div class="text-muted p-2">Geen klanten gevonden</div>';
            return;
        }
        
        resultsContainer.innerHTML = this.searchResults.customers.map(customer => `
            <div class="list-group-item list-group-item-action customer-search-item" 
                 data-customer-id="${customer.customer_id}"
                 data-customer-name="${customer.first_name} ${customer.last_name}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${customer.first_name} ${customer.last_name}</h6>
                        <small class="text-muted">${customer.email}</small>
                    </div>
                    <small class="text-muted">ID: ${customer.customer_id}</small>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        resultsContainer.querySelectorAll('.customer-search-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectCustomer(item.dataset.customerId, item.dataset.customerName);
            });
        });
        
        resultsContainer.classList.remove('d-none');
    }
    
    renderFilmResults() {
        const resultsContainer = document.getElementById('film-search-results');
        if (!resultsContainer) return;
        
        if (this.searchResults.films.length === 0) {
            resultsContainer.innerHTML = '<div class="text-muted p-2">Geen films gevonden</div>';
            return;
        }
        
        resultsContainer.innerHTML = this.searchResults.films.map(film => `
            <div class="list-group-item list-group-item-action film-search-item" 
                 data-film-id="${film.film_id}"
                 data-film-title="${film.title}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${film.title}</h6>
                        <small class="text-muted">${film.category_name} • €${film.rental_rate}</small>
                        <br>
                        <small class="text-${film.available_copies > 0 ? 'success' : 'danger'}">
                            ${film.available_copies > 0 ? `${film.available_copies} beschikbaar` : 'Niet beschikbaar'}
                        </small>
                    </div>
                    <small class="text-muted">${film.release_year}</small>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        resultsContainer.querySelectorAll('.film-search-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectFilm(item.dataset.filmId, item.dataset.filmTitle);
            });
        });
        
        resultsContainer.classList.remove('d-none');
    }
    
    selectCustomer(customerId, customerName) {
        const input = document.getElementById('checkout-customer-search');
        const hiddenInput = document.getElementById('selected-customer-id');
        
        if (input) input.value = customerName;
        if (hiddenInput) hiddenInput.value = customerId;
        
        this.clearCustomerResults();
    }
    
    selectFilm(filmId, filmTitle) {
        const input = document.getElementById('checkout-film-search');
        const hiddenInput = document.getElementById('selected-film-id');
        
        if (input) input.value = filmTitle;
        if (hiddenInput) hiddenInput.value = filmId;
        
        this.clearFilmResults();
    }
    
    clearCustomerResults() {
        const resultsContainer = document.getElementById('customer-search-results');
        if (resultsContainer) {
            resultsContainer.classList.add('d-none');
            resultsContainer.innerHTML = '';
        }
    }
    
    clearFilmResults() {
        const resultsContainer = document.getElementById('film-search-results');
        if (resultsContainer) {
            resultsContainer.classList.add('d-none');
            resultsContainer.innerHTML = '';
        }
    }
    
    async processCheckout() {
        const customerId = document.getElementById('selected-customer-id')?.value;
        const filmId = document.getElementById('selected-film-id')?.value;
        const dueDate = document.getElementById('checkout-due-date')?.value;
        
        if (!customerId || !filmId) {
            this.showToast('Selecteer zowel een klant als een film', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/staff/rental-management/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    film_id: filmId,
                    due_date: dueDate
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Film succesvol uitgegeven', 'success');
                this.clearCheckoutForm();
                this.loadRentalData();
            } else {
                this.showToast('Fout bij uitgeven: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error processing checkout:', error);
            this.showToast('Fout bij uitgeven van film', 'error');
        }
    }
    
    async processCheckin() {
        const rentalId = document.getElementById('checkin-rental-id')?.value;
        const condition = document.getElementById('checkin-condition')?.value;
        const notes = document.getElementById('checkin-notes')?.value;
        
        if (!rentalId) {
            this.showToast('Voer een verhuur ID in', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/staff/rental-management/checkin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rental_id: rentalId,
                    condition: condition,
                    notes: notes
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Film succesvol ingenomen', 'success');
                this.clearCheckinForm();
                this.loadRentalData();
            } else {
                this.showToast('Fout bij innemen: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error processing checkin:', error);
            this.showToast('Fout bij innemen van film', 'error');
        }
    }
    
    async returnRental(rentalId) {
        if (!confirm('Weet je zeker dat je deze verhuur wilt markeren als teruggegeven?')) {
            return;
        }
        
        try {
            const response = await fetch(`/staff/rentals/${rentalId}/update-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'returned' })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Verhuur gemarkeerd als teruggegeven', 'success');
                this.loadRentalData();
            } else {
                this.showToast('Fout bij bijwerken status: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error returning rental:', error);
            this.showToast('Fout bij bijwerken verhuur status', 'error');
        }
    }

    async approveRental(rentalId) {
        if (!confirm('Weet je zeker dat je deze reservering wilt goedkeuren en uitgeven?')) {
            return;
        }
        
        try {
            const response = await fetch(`/staff/rentals/${rentalId}/update-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'active' })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Verhuur goedgekeurd en uitgegeven', 'success');
                this.loadRentalData();
            } else {
                this.showToast('Fout bij goedkeuren: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error approving rental:', error);
            this.showToast('Fout bij goedkeuren verhuur', 'error');
        }
    }
    
    renderCurrentRentals() {
        const tableBody = document.getElementById('current-rentals-tbody');
        if (!tableBody) return;
        
        if (this.currentRentals.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="bi bi-inbox fs-2 mb-2"></i>
                        <p class="mb-0">Geen in behandeling verhuur gevonden</p>
                        <small class="text-muted">Films die klanten online hebben gereserveerd verschijnen hier</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = this.currentRentals.map(rental => {
            // Determine status color and text
            let statusColor = 'secondary';
            let statusText = rental.status || 'Onbekend';
            
            if (rental.status === 'pending') {
                statusColor = 'warning';
                statusText = 'In Behandeling';
            } else if (rental.status === 'reserved') {
                statusColor = 'info';
                statusText = 'Gereserveerd';
            } else if (rental.status === 'in_behandeling') {
                statusColor = 'warning';
                statusText = 'In Behandeling';
            } else if (rental.status === 'active') {
                statusColor = 'primary';
                statusText = 'Uitgegeven';
            } else if (rental.status === 'returned') {
                statusColor = 'success';
                statusText = 'Teruggegeven';
            }
            
            const rentalDate = new Date(rental.rental_date);
            const expectedReturn = rental.expected_return ? new Date(rental.expected_return) : null;
            
            return `
                <tr>
                    <td>
                        <div class="fw-medium">${rental.customer_name}</div>
                        <small class="text-muted">${rental.customer_email}</small>
                    </td>
                    <td>
                        <div class="fw-medium">${rental.film_title}</div>
                        <small class="text-muted">${rental.category_name}</small>
                    </td>
                    <td>
                        <small>${rentalDate.toLocaleDateString('nl-NL')}</small>
                        <br>
                        <small class="text-muted">${rentalDate.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'})}</small>
                    </td>
                    <td>
                        <small class="text-muted">
                            ${expectedReturn ? expectedReturn.toLocaleDateString('nl-NL') : 'Niet ingesteld'}
                        </small>
                    </td>
                    <td>
                        <span class="badge bg-${statusColor}">
                            ${statusText}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            ${rental.status === 'pending' || rental.status === 'reserved' || rental.status === 'in_behandeling' ? `
                                <button type="button" class="btn btn-sm btn-success approve-rental-btn" 
                                        data-rental-id="${rental.rental_id}" title="Goedkeuren & Uitgeven">
                                    <i class="bi bi-check-circle"></i>
                                </button>
                            ` : `
                                <button type="button" class="btn btn-sm btn-outline-success return-rental-btn" 
                                        data-rental-id="${rental.rental_id}" title="Markeer als terug">
                                    <i class="bi bi-arrow-return-left"></i>
                                </button>
                            `}
                            <button type="button" class="btn btn-sm btn-outline-primary view-rental-btn" 
                                    data-rental-id="${rental.rental_id}" title="Details">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    renderOverdueRentals() {
        const container = document.getElementById('overdue-rentals-list');
        if (!container) return;
        
        if (this.overdueRentals.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-check-circle fs-2 mb-2 text-success"></i>
                    <p class="mb-0">Geen te late verhuur!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.overdueRentals.map(rental => {
            const daysDiff = Math.ceil((new Date() - new Date(rental.return_date)) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="card mb-2">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">${rental.customer_name}</h6>
                                <small class="text-muted">${rental.film_title}</small>
                                <br>
                                <small class="text-danger">
                                    <i class="bi bi-exclamation-triangle"></i>
                                    ${daysDiff} dagen te laat
                                </small>
                            </div>
                            <button class="btn btn-sm btn-outline-success return-rental-btn" 
                                    data-rental-id="${rental.rental_id}">
                                <i class="bi bi-check"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    clearCheckoutForm() {
        const form = document.getElementById('checkout-form');
        if (form) {
            form.reset();
            document.getElementById('selected-customer-id').value = '';
            document.getElementById('selected-film-id').value = '';
            this.clearCustomerResults();
            this.clearFilmResults();
        }
    }
    
    clearCheckinForm() {
        const form = document.getElementById('checkin-form');
        if (form) {
            form.reset();
        }
    }
    
    focusCheckoutSearch() {
        const input = document.getElementById('checkout-customer-search');
        if (input) input.focus();
    }
    
    focusCheckinSearch() {
        const input = document.getElementById('checkin-rental-id');
        if (input) input.focus();
    }
    
    // View rental details in modal
    async viewRentalDetails(rentalId) {
        try {
            // Show loading
            this.showToast('Verhuur details laden...', 'info');
            
            const response = await fetch(`/staff/api/rentals/${rentalId}`);
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showRentalDetailsModal(result.rental);
            } else {
                this.showToast(result.message || 'Fout bij laden verhuur details', 'error');
            }
        } catch (error) {
            console.error('Error loading rental details:', error);
            this.showToast('Fout bij laden verhuur details', 'error');
        }
    }
    
    // Show rental details in a modal
    showRentalDetailsModal(rental) {
        const modalId = 'rentalDetailsModal' + Date.now();
        
        // Format dates
        const formatDate = (dateString) => {
            if (!dateString) return 'Niet ingesteld';
            return new Date(dateString).toLocaleDateString('nl-NL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
        
        // Calculate rental duration and status
        const rentalDate = new Date(rental.rental_date);
        const dueDate = rental.due_date ? new Date(rental.due_date) : null;
        const returnDate = rental.return_date ? new Date(rental.return_date) : null;
        const now = new Date();
        
        let statusClass = 'text-success';
        let statusText = 'Actief';
        let statusIcon = 'bi-clock';
        
        if (returnDate) {
            statusClass = 'text-success';
            statusText = 'Teruggegeven';
            statusIcon = 'bi-check-circle-fill';
        } else if (dueDate && now > dueDate) {
            statusClass = 'text-danger';
            statusText = 'Te laat';
            statusIcon = 'bi-exclamation-triangle-fill';
        } else if (rental.status === 'pending') {
            statusClass = 'text-warning';
            statusText = 'In behandeling';
            statusIcon = 'bi-hourglass-split';
        }
        
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-film me-2"></i>
                                Verhuur Details - ID #${rental.rental_id}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-4">
                                <!-- Status Section -->
                                <div class="col-12">
                                    <div class="card border-0 bg-light">
                                        <div class="card-body text-center">
                                            <i class="bi ${statusIcon} fs-1 ${statusClass} mb-2"></i>
                                            <h6 class="card-title mb-0 ${statusClass}">${statusText}</h6>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Customer Information -->
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-header bg-info text-white">
                                            <h6 class="mb-0">
                                                <i class="bi bi-person-circle me-2"></i>
                                                Klant Informatie
                                            </h6>
                                        </div>
                                        <div class="card-body">
                                            <table class="table table-borderless table-sm">
                                                <tr>
                                                    <td class="fw-bold text-muted">Naam:</td>
                                                    <td>${rental.customer_name || 'Onbekend'}</td>
                                                </tr>
                                                <tr>
                                                    <td class="fw-bold text-muted">Email:</td>
                                                    <td>${rental.customer_email || 'Niet beschikbaar'}</td>
                                                </tr>
                                                <tr>
                                                    <td class="fw-bold text-muted">Klant ID:</td>
                                                    <td>#${rental.customer_id}</td>
                                                </tr>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Film Information -->
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-header bg-warning text-dark">
                                            <h6 class="mb-0">
                                                <i class="bi bi-film me-2"></i>
                                                Film Informatie
                                            </h6>
                                        </div>
                                        <div class="card-body">
                                            <table class="table table-borderless table-sm">
                                                <tr>
                                                    <td class="fw-bold text-muted">Titel:</td>
                                                    <td>${rental.film_title || 'Onbekend'}</td>
                                                </tr>
                                                <tr>
                                                    <td class="fw-bold text-muted">Categorie:</td>
                                                    <td>${rental.category || 'Niet beschikbaar'}</td>
                                                </tr>
                                                <tr>
                                                    <td class="fw-bold text-muted">Rating:</td>
                                                    <td>${rental.rating || 'Niet beoordeeld'}</td>
                                                </tr>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Rental Information -->
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-header bg-success text-white">
                                            <h6 class="mb-0">
                                                <i class="bi bi-calendar-event me-2"></i>
                                                Verhuur Tijdlijn
                                            </h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="row g-3">
                                                <div class="col-md-4">
                                                    <div class="d-flex align-items-center">
                                                        <i class="bi bi-play-circle text-primary fs-4 me-3"></i>
                                                        <div>
                                                            <small class="text-muted d-block">Uitgeleend op</small>
                                                            <strong>${formatDate(rental.rental_date)}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="d-flex align-items-center">
                                                        <i class="bi bi-clock text-warning fs-4 me-3"></i>
                                                        <div class="flex-grow-1">
                                                            <small class="text-muted d-block">Inleverdatum</small>
                                                            <div class="d-flex align-items-center gap-2">
                                                                <strong id="due-date-display-${rental.rental_id}">${formatDate(rental.due_date)}</strong>
                                                                ${!returnDate ? `
                                                                    <button type="button" class="btn btn-sm btn-outline-primary" 
                                                                            onclick="window.staffRentalManager.editDueDate(${rental.rental_id}, '${rental.due_date}')"
                                                                            title="Datum aanpassen">
                                                                        <i class="bi bi-pencil"></i>
                                                                    </button>
                                                                ` : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="d-flex align-items-center">
                                                        <i class="bi bi-check-circle ${returnDate ? 'text-success' : 'text-muted'} fs-4 me-3"></i>
                                                        <div>
                                                            <small class="text-muted d-block">Teruggegeven op</small>
                                                            <strong>${returnDate ? formatDate(rental.return_date) : 'Nog niet terug'}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Payment Information -->
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-header bg-secondary text-white">
                                            <h6 class="mb-0">
                                                <i class="bi bi-credit-card me-2"></i>
                                                Betaling & Kosten
                                            </h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="row g-3">
                                                <div class="col-md-6">
                                                    <div class="d-flex justify-content-between">
                                                        <span>Verhuurprijs:</span>
                                                        <strong>€${rental.rental_rate || '0.00'}</strong>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="d-flex justify-content-between">
                                                        <span>Late kosten:</span>
                                                        <strong class="text-danger">€${rental.late_fee || '0.00'}</strong>
                                                    </div>
                                                </div>
                                                <div class="col-12">
                                                    <hr>
                                                    <div class="d-flex justify-content-between fs-5">
                                                        <span class="fw-bold">Totaal:</span>
                                                        <strong class="text-primary">€${((parseFloat(rental.rental_rate) || 0) + (parseFloat(rental.late_fee) || 0)).toFixed(2)}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                ${rental.notes ? `
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="mb-0">
                                                <i class="bi bi-sticky me-2"></i>
                                                Opmerkingen
                                            </h6>
                                        </div>
                                        <div class="card-body">
                                            <p class="mb-0">${rental.notes}</p>
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="modal-footer">
                            ${!returnDate ? `
                                <button type="button" class="btn btn-success" onclick="window.staffRentalManager.returnRental(${rental.rental_id}); bootstrap.Modal.getInstance(document.getElementById('${modalId}')).hide();">
                                    <i class="bi bi-arrow-return-left me-2"></i>
                                    Film Teruggeven
                                </button>
                            ` : ''}
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-2"></i>
                                Sluiten
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Initialize and show modal
        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement);
        
        // Clean up modal when hidden
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });
        
        modal.show();
    }
    
    // Edit due date functionality
    async editDueDate(rentalId, currentDueDate) {
        const modalId = 'editDueDateModal' + Date.now();
        
        // Format current date for input (YYYY-MM-DD)
        const formatForInput = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        };
        
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="bi bi-calendar-event me-2"></i>
                                Inleverdatum Aanpassen
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-due-date-form-${rentalId}">
                                <div class="mb-3">
                                    <label for="new-due-date-${rentalId}" class="form-label">Nieuwe inleverdatum</label>
                                    <input type="date" class="form-control" id="new-due-date-${rentalId}" 
                                           value="${formatForInput(currentDueDate)}" required>
                                    <div class="form-text">
                                        <i class="bi bi-info-circle me-1"></i>
                                        Huidige datum: ${this.formatDate(currentDueDate)}
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="due-date-reason-${rentalId}" class="form-label">Reden voor wijziging (optioneel)</label>
                                    <textarea class="form-control" id="due-date-reason-${rentalId}" rows="3" 
                                              placeholder="Bijv: Klant heeft verlenging aangevraagd..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuleren</button>
                            <button type="button" class="btn btn-warning" onclick="window.staffRentalManager.saveDueDate(${rentalId}, '${modalId}')">
                                <i class="bi bi-check-circle me-2"></i>
                                Datum Opslaan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Initialize and show modal
        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement);
        
        // Clean up modal when hidden
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });
        
        modal.show();
    }
    
    // Save new due date
    async saveDueDate(rentalId, modalId) {
        try {
            const newDueDate = document.getElementById(`new-due-date-${rentalId}`).value;
            const reason = document.getElementById(`due-date-reason-${rentalId}`).value;
            
            if (!newDueDate) {
                this.showToast('Selecteer een geldige datum', 'error');
                return;
            }
            
            // Show loading
            this.showToast('Datum wordt bijgewerkt...', 'info');
            
            const response = await fetch(`/staff/api/rentals/${rentalId}/due-date`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    due_date: newDueDate,
                    reason: reason
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                // Update the display in the current modal
                const displayElement = document.getElementById(`due-date-display-${rentalId}`);
                if (displayElement) {
                    displayElement.textContent = this.formatDate(newDueDate);
                }
                
                // Close the edit modal
                bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
                
                // Show success message
                this.showToast('Inleverdatum succesvol bijgewerkt', 'success');
                
                // Refresh rental data
                this.loadRentalData();
            } else {
                this.showToast(result.message || 'Fout bij bijwerken datum', 'error');
            }
        } catch (error) {
            console.error('Error updating due date:', error);
            this.showToast('Fout bij bijwerken datum', 'error');
        }
    }
    
    // Format date for display (reusable method)
    formatDate(dateString) {
        if (!dateString) return 'Niet ingesteld';
        return new Date(dateString).toLocaleDateString('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Utility functions
    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }
    
    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('staff-rental-section')) {
        window.staffRentalManager = new StaffRentalManager();
    }
});
