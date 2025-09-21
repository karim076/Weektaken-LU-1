// Eenvoudige Klantenbeheer Module
class SimpleCustomerManager {
    constructor() {
        this.customers = [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.init();
    }

    init() {
        console.log('Simple Customer Manager initialized');
        this.setupEventListeners();
        // Automatisch alle klanten laden bij initialisatie
        this.loadAllCustomers();
    }

    setupEventListeners() {
        // Zoek functionaliteit
        const searchInput = document.getElementById('customer-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (e.target.value.length >= 2) {
                    this.searchCustomers(e.target.value);
                } else if (e.target.value.length === 0) {
                    this.loadAllCustomers(); // Herlaad alle klanten als zoekveld leeg is
                }
            });
        }

        // Toon alle klanten knop
        const loadAllBtn = document.getElementById('load-all-customers');
        if (loadAllBtn) {
            loadAllBtn.addEventListener('click', () => {
                this.loadAllCustomers();
            });
        }
    }

    async loadAllCustomers() {
        this.showLoading();
        try {
            const response = await fetch('/staff/api/customers');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const customers = await response.json();
            this.customers = customers;
            this.displayCustomers(customers);
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showError('Fout bij laden van klanten: ' + error.message);
        }
    }

    async searchCustomers(query) {
        try {
            const response = await fetch(`/staff/api/customers/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Search failed');
            }
            const customers = await response.json();
            this.customers = customers;
            this.displayCustomers(customers);
        } catch (error) {
            console.error('Error searching customers:', error);
            this.showError('Fout bij zoeken naar klanten: ' + error.message);
        }
    }

    sortCustomers(column) {
        // Toggle direction if same column, otherwise default to ascending
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.customers.sort((a, b) => {
            let valueA, valueB;
            
            switch (column) {
                case 'id':
                    valueA = a.customer_id;
                    valueB = b.customer_id;
                    break;
                case 'name':
                    valueA = `${a.first_name} ${a.last_name}`.toLowerCase();
                    valueB = `${b.first_name} ${b.last_name}`.toLowerCase();
                    break;
                case 'email':
                    valueA = a.email.toLowerCase();
                    valueB = b.email.toLowerCase();
                    break;
                case 'date':
                    valueA = new Date(a.create_date);
                    valueB = new Date(b.create_date);
                    break;
                case 'active':
                    valueA = a.active ? 1 : 0;
                    valueB = b.active ? 1 : 0;
                    break;
                default:
                    return 0;
            }

            if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        this.displayCustomers(this.customers);
    }

    getSortIcon(column) {
        if (this.sortColumn === column) {
            return this.sortDirection === 'asc' ? '▲' : '▼';
        }
        return '↕';
    }

    displayCustomers(customers) {
        const container = document.getElementById('customers-table-container');
        if (!customers || customers.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-search fs-1 mb-3"></i>
                    <p>Geen klanten gevonden</p>
                </div>
            `;
            return;
        }

        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-dark table-striped">
                    <thead>
                        <tr>
                            <th style="cursor: pointer; user-select: none;" onclick="window.simpleCustomerManager.sortCustomers('id')">
                                ID ${this.getSortIcon('id')}
                            </th>
                            <th style="cursor: pointer; user-select: none;" onclick="window.simpleCustomerManager.sortCustomers('name')">
                                Naam ${this.getSortIcon('name')}
                            </th>
                            <th style="cursor: pointer; user-select: none;" onclick="window.simpleCustomerManager.sortCustomers('email')">
                                Email ${this.getSortIcon('email')}
                            </th>
                            <th style="cursor: pointer; user-select: none;" onclick="window.simpleCustomerManager.sortCustomers('date')">
                                Aangemaakt ${this.getSortIcon('date')}
                            </th>
                            <th style="cursor: pointer; user-select: none;" onclick="window.simpleCustomerManager.sortCustomers('active')">
                                Actief ${this.getSortIcon('active')}
                            </th>
                            <th>Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map(customer => `
                            <tr>
                                <td>${customer.customer_id}</td>
                                <td>${customer.first_name} ${customer.last_name}</td>
                                <td>${customer.email}</td>
                                <td>${new Date(customer.create_date).toLocaleDateString('nl-NL')}</td>
                                <td>
                                    <span class="badge ${customer.active ? 'bg-success' : 'bg-danger'}">
                                        ${customer.active ? 'Actief' : 'Inactief'}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group" role="group">
                                        <button class="btn btn-info btn-sm" onclick="window.simpleCustomerManager.viewCustomer(${customer.customer_id})" title="Bekijk Details">
                                            <i class="bi bi-eye me-1"></i> Bekijk
                                        </button>
                                        <button class="btn btn-success btn-sm" onclick="window.simpleCustomerManager.editCustomer(${customer.customer_id})" title="Bewerk Gegevens">
                                            <i class="bi bi-pencil me-1"></i> Bewerk
                                        </button>
                                        <button class="btn btn-warning btn-sm" onclick="window.simpleCustomerManager.viewCustomerRentals(${customer.customer_id})" title="Bekijk Films">
                                            <i class="bi bi-film me-1"></i> Films
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick="window.simpleCustomerManager.deleteCustomer(${customer.customer_id})" title="Verwijder Klant">
                                            <i class="bi bi-trash me-1"></i> Verwijder
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;
    }

    viewCustomer(customerId) {
        this.showCustomerDetails(customerId);
    }

    editCustomer(customerId) {
        this.showEditCustomerForm(customerId);
    }

    viewCustomerRentals(customerId) {
        this.showCustomerRentals(customerId);
    }

    deleteCustomer(customerId) {
        // Confirmation modal
        const confirmModal = this.createModal('Klant Verwijderen', `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Waarschuwing:</strong> Weet je zeker dat je deze klant wilt verwijderen?
            </div>
            <p>Dit zal:</p>
            <ul>
                <li>De klant als inactief markeren</li>
                <li>Alle actieve verhuur automatisch teruggeven</li>
                <li>De verhuurgeschiedenis behouden voor administratie</li>
            </ul>
            <p class="text-muted"><small>Deze actie kan niet ongedaan worden gemaakt.</small></p>
        `);
        
        // Add custom buttons
        const modalFooter = confirmModal.querySelector('.modal-footer');
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuleren</button>
            <button type="button" class="btn btn-danger" onclick="window.simpleCustomerManager.confirmDeleteCustomer(${customerId})">
                <i class="bi bi-trash me-1"></i> Verwijderen
            </button>
        `;
        
        // Show modal
        const modalInstance = new bootstrap.Modal(confirmModal);
        modalInstance.show();
    }

    async confirmDeleteCustomer(customerId) {
        try {
            const response = await fetch(`/staff/api/customers/${customerId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Close any open modal
                const openModals = document.querySelectorAll('.modal.show');
                openModals.forEach(modal => {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) modalInstance.hide();
                });
                
                // Show success message
                this.showSuccessMessage(`Klant succesvol verwijderd. ${result.returnedFilms} films zijn teruggegeven.`);
                
                // Refresh the customer list
                this.loadAllCustomers();
            } else {
                this.showErrorMessage('Fout bij verwijderen: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            this.showErrorMessage('Fout bij verwijderen van klant');
        }
    }

    async showCustomerDetails(customerId) {
        try {
            console.log('Loading customer details for ID:', customerId);
            const response = await fetch(`/staff/api/customers/${customerId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Customer details response:', result);
            
            if (result.success && result.customer) {
                this.displayCustomerDetailsModal(result.customer, result.rentals || []);
            } else {
                console.error('Failed to load customer details:', result);
                this.showErrorMessage('Fout bij laden klant details: ' + (result.message || 'Onbekende fout'));
            }
        } catch (error) {
            console.error('Error loading customer details:', error);
            this.showErrorMessage('Fout bij laden klant details: ' + error.message);
        }
    }

    displayCustomerDetailsModal(customer, rentals) {
        const activeRentals = rentals ? rentals.filter(r => !r.returned && !r.return_date) : [];
        const totalRentals = rentals ? rentals.length : 0;
        
        const modal = this.createModal('Klant Details', `
            <div class="row">
                <div class="col-md-6">
                    <h6>Klant Informatie</h6>
                    <p><strong>ID:</strong> ${customer.customer_id}</p>
                    <p><strong>Naam:</strong> ${customer.first_name} ${customer.last_name}</p>
                    <p><strong>Email:</strong> ${customer.email}</p>
                    <p><strong>Gebruikersnaam:</strong> ${customer.username || 'Niet ingesteld'}</p>
                    <p><strong>Telefoon:</strong> ${customer.phone || 'Niet ingesteld'}</p>
                    <p><strong>Adres:</strong> ${customer.address || 'Niet ingesteld'}</p>
                    <p><strong>Stad:</strong> ${customer.city || 'Niet ingesteld'}</p>
                    <p><strong>Actief:</strong> ${customer.active ? 'Ja' : 'Nee'}</p>
                    <p><strong>Aangemaakt:</strong> ${new Date(customer.create_date).toLocaleDateString('nl-NL')}</p>
                </div>
                <div class="col-md-6">
                    <h6>Verhuur Overzicht</h6>
                    <p><strong>Totaal Verhuur:</strong> ${totalRentals}</p>
                    <p><strong>Actieve Verhuur:</strong> ${activeRentals.length}</p>
                    ${activeRentals.length > 0 ? `
                        <div class="alert alert-info mt-2">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Actieve Films:</strong> ${activeRentals.map(r => r.title).join(', ')}
                        </div>
                    ` : ''}
                    
                    <!-- Action Buttons -->
                    <div class="mt-3">
                        <button class="btn btn-primary btn-sm me-2 mb-2" 
                                onclick="window.simpleCustomerManager.showCustomerRentals(${customer.customer_id}); 
                                         const currentModal = bootstrap.Modal.getInstance(this.closest('.modal')); 
                                         if (currentModal) currentModal.hide();">
                            <i class="bi bi-film me-1"></i> Film Beheer & Geschiedenis
                        </button>
                        <br>
                        <button class="btn btn-success btn-sm me-2 mb-2" 
                                onclick="window.simpleCustomerManager.showEditCustomerForm(${customer.customer_id}); 
                                         const currentModal = bootstrap.Modal.getInstance(this.closest('.modal')); 
                                         if (currentModal) currentModal.hide();">
                            <i class="bi bi-person-gear me-1"></i> Profiel Bewerken
                        </button>
                        <button class="btn btn-warning btn-sm me-2 mb-2" 
                                onclick="window.simpleCustomerManager.showChangePasswordForm(${customer.customer_id}); 
                                         const currentModal = bootstrap.Modal.getInstance(this.closest('.modal')); 
                                         if (currentModal) currentModal.hide();">
                            <i class="bi bi-shield-lock me-1"></i> Wachtwoord Wijzigen
                        </button>
                    </div>
                </div>
            </div>
        `, 'lg');
        
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }

    async showEditCustomerForm(customerId) {
        try {
            console.log('Loading customer for edit, ID:', customerId);
            const response = await fetch(`/staff/api/customers/${customerId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Edit customer response:', result);
            
            if (result.success && result.customer) {
                this.displayEditCustomerModal(result.customer);
            } else {
                console.error('Failed to load customer for edit:', result);
                this.showErrorMessage('Fout bij laden klant: ' + (result.message || 'Onbekende fout'));
            }
        } catch (error) {
            console.error('Error loading customer for edit:', error);
            this.showErrorMessage('Fout bij laden klant voor bewerken: ' + error.message);
        }
    }

    displayEditCustomerModal(customer) {
        const modal = this.createModal('Klant Profiel Beheer', `
            <div class="row">
                <!-- Navigation Tabs -->
                <div class="col-12 mb-3">
                    <ul class="nav nav-tabs" id="customerProfileTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile-pane" 
                                    type="button" role="tab" aria-controls="profile-pane" aria-selected="true">
                                <i class="bi bi-person me-2"></i>Profiel Gegevens
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="password-tab" data-bs-toggle="tab" data-bs-target="#password-pane" 
                                    type="button" role="tab" aria-controls="password-pane" aria-selected="false">
                                <i class="bi bi-shield-lock me-2"></i>Wachtwoord
                            </button>
                        </li>
                    </ul>
                </div>

                <!-- Tab Content -->
                <div class="col-12">
                    <div class="tab-content" id="customerProfileTabsContent">
                        
                        <!-- Profile Tab -->
                        <div class="tab-pane fade show active" id="profile-pane" role="tabpanel" aria-labelledby="profile-tab">
                            <form id="edit-customer-profile-form">
                                <!-- Basic Information (only fields that exist in Sakila customer table) -->
                                <div class="row mb-4">
                                    <div class="col-12">
                                        <h6 class="text-info mb-3">
                                            <i class="bi bi-person"></i> Basis Informatie
                                        </h6>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-light">Voornaam *</label>
                                        <input type="text" class="form-control bg-dark border-secondary text-light" 
                                               name="first_name" value="${customer.first_name || ''}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-light">Achternaam *</label>
                                        <input type="text" class="form-control bg-dark border-secondary text-light" 
                                               name="last_name" value="${customer.last_name || ''}" required>
                                    </div>
                                    <div class="col-md-12 mb-3">
                                        <label class="form-label text-light">Email *</label>
                                        <input type="email" class="form-control bg-dark border-secondary text-light" 
                                               name="email" value="${customer.email || ''}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-light">Gebruikersnaam</label>
                                        <input type="text" class="form-control bg-dark border-secondary text-light" 
                                               name="username" value="${customer.username || ''}" placeholder="Optioneel">
                                        <div class="form-text text-muted">Gebruikersnaam voor inloggen</div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-light">Status</label>
                                        <select class="form-select bg-dark border-secondary text-light" name="active">
                                            <option value="1" ${customer.active ? 'selected' : ''}>Actief</option>
                                            <option value="0" ${!customer.active ? 'selected' : ''}>Inactief</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Address Information (Read-only - stored in separate tables) -->
                                <div class="row mb-4">
                                    <div class="col-12">
                                        <h6 class="text-info mb-3">
                                            <i class="bi bi-house"></i> Adresgegevens (Alleen Lezen)
                                        </h6>
                                        <div class="alert alert-info">
                                            <i class="bi bi-info-circle me-2"></i>
                                            Adresgegevens worden opgeslagen in aparte tabellen en kunnen niet direct worden bewerkt via dit formulier.
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-light">Adres</label>
                                        <input type="text" class="form-control bg-secondary text-light" 
                                               value="${customer.address || 'Niet beschikbaar'}" readonly>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-light">Stad</label>
                                        <input type="text" class="form-control bg-secondary text-light" 
                                               value="${customer.city || 'Niet beschikbaar'}" readonly>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <!-- Password Tab -->
                        <div class="tab-pane fade" id="password-pane" role="tabpanel" aria-labelledby="password-tab">
                            <form id="change-customer-password-form">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="alert alert-info">
                                            <i class="bi bi-info-circle me-2"></i>
                                            Als staff kunt u het wachtwoord van deze klant wijzigen zonder het huidige wachtwoord te kennen.
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-light">Nieuw Wachtwoord *</label>
                                        <input type="password" class="form-control bg-dark border-secondary text-light" 
                                               name="new_password" minlength="6" required>
                                        <div class="form-text text-muted">Minimaal 6 tekens</div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-light">Bevestig Nieuw Wachtwoord *</label>
                                        <input type="password" class="form-control bg-dark border-secondary text-light" 
                                               name="confirm_password" required>
                                    </div>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        `, 'xl');
        
        // Add action buttons
        const modalFooter = modal.querySelector('.modal-footer');
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-circle me-1"></i> Sluiten
            </button>
            <button type="button" class="btn btn-warning" id="change-password-btn" style="display: none;"
                    onclick="window.simpleCustomerManager.changeCustomerPassword(${customer.customer_id}, this.closest('.modal'))">
                <i class="bi bi-shield-lock me-1"></i> Wachtwoord Wijzigen
            </button>
            <button type="button" class="btn btn-success" id="save-profile-btn"
                    onclick="window.simpleCustomerManager.saveCustomerProfile(${customer.customer_id}, this.closest('.modal'))">
                <i class="bi bi-save me-1"></i> Profiel Opslaan
            </button>
        `;

        // Tab switching logic to show appropriate buttons
        const profileTab = modal.querySelector('#profile-tab');
        const passwordTab = modal.querySelector('#password-tab');
        const saveProfileBtn = modal.querySelector('#save-profile-btn');
        const changePasswordBtn = modal.querySelector('#change-password-btn');

        profileTab.addEventListener('click', () => {
            saveProfileBtn.style.display = 'inline-block';
            changePasswordBtn.style.display = 'none';
        });

        passwordTab.addEventListener('click', () => {
            saveProfileBtn.style.display = 'none';
            changePasswordBtn.style.display = 'inline-block';
        });
        
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }

    // Save customer profile (comprehensive update including address and preferences)
    async saveCustomerProfile(customerId, modal) {
        try {
            const form = modal.querySelector('#edit-customer-profile-form');
            const formData = new FormData(form);
            const allData = Object.fromEntries(formData.entries());
            
            // Create validCustomerData FIRST, before using it
            const validCustomerData = {
                first_name: allData.first_name,
                last_name: allData.last_name,
                email: allData.email,
                username: allData.username || null,
                active: allData.active === '1'
            };
            
            // NOW do the validation using the properly declared variable
            if (!validCustomerData.first_name || !validCustomerData.last_name || !validCustomerData.email) {
                this.showWarningMessage('Voornaam, achternaam en email zijn verplicht.');
                return;
            }

            // Email validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(validCustomerData.email)) {
                this.showWarningMessage('Email adres is niet geldig.');
                return;
            }
            
            console.log('Saving customer profile (valid fields only):', validCustomerData);
            
            const response = await fetch(`/staff/api/customers/${customerId}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(validCustomerData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance.hide();
                
                this.showSuccessMessage('Klantprofiel succesvol bijgewerkt!');
                this.loadAllCustomers(); // Refresh list
            } else {
                this.showErrorMessage('Fout bij opslaan profiel: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving customer profile:', error);
            this.showErrorMessage('Fout bij opslaan klantprofiel: ' + error.message);
        }
    }

    // Change customer password (staff can do this without knowing current password)
    async changeCustomerPassword(customerId, modal) {
        try {
            const form = modal.querySelector('#change-customer-password-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Password validation
            if (!data.new_password) {
                this.showWarningMessage('Nieuw wachtwoord is vereist.');
                return;
            }
            if (data.new_password.length < 6) {
                this.showWarningMessage('Nieuw wachtwoord moet minstens 6 tekens bevatten.');
                return;
            }
            if (data.new_password !== data.confirm_password) {
                this.showWarningMessage('Wachtwoorden komen niet overeen.');
                return;
            }
            
            console.log('Changing customer password for ID:', customerId);
            
            const response = await fetch(`/staff/api/customers/${customerId}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    new_password: data.new_password,
                    confirm_password: data.confirm_password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Clear password fields
                form.reset();
                
                this.showSuccessMessage('Wachtwoord succesvol gewijzigd!');
            } else {
                this.showErrorMessage('Fout bij wijzigen wachtwoord: ' + result.message);
            }
        } catch (error) {
            console.error('Error changing customer password:', error);
            this.showErrorMessage('Fout bij wijzigen wachtwoord: ' + error.message);
        }
    }

    // Legacy method - keep for backward compatibility if referenced elsewhere
    async saveCustomerChanges(customerId, modal) {
        return this.saveCustomerProfile(customerId, modal);
    }

    // Show dedicated password change form
    async showChangePasswordForm(customerId) {
        try {
            const response = await fetch(`/staff/api/customers/${customerId}`);
            const result = await response.json();
            
            if (!result.success) {
                this.showErrorMessage('Fout bij laden klantgegevens');
                return;
            }

            const customer = result.customer;
            const modal = this.createModal('Wachtwoord Wijzigen', `
                <div class="row">
                    <div class="col-12">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            Wachtwoord wijzigen voor klant: <strong>${customer.first_name} ${customer.last_name}</strong>
                        </div>
                        <form id="standalone-change-password-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label text-light">Nieuw Wachtwoord *</label>
                                    <input type="password" class="form-control bg-dark border-secondary text-light" 
                                           name="new_password" minlength="6" required>
                                    <div class="form-text text-muted">Minimaal 6 tekens</div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label text-light">Bevestig Nieuw Wachtwoord *</label>
                                    <input type="password" class="form-control bg-dark border-secondary text-light" 
                                           name="confirm_password" required>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            `, 'md');

            const modalFooter = modal.querySelector('.modal-footer');
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="bi bi-x-circle me-1"></i> Annuleren
                </button>
                <button type="button" class="btn btn-warning"
                        onclick="window.simpleCustomerManager.changeCustomerPasswordStandalone(${customerId}, this.closest('.modal'))">
                    <i class="bi bi-shield-lock me-1"></i> Wachtwoord Wijzigen
                </button>
            `;

            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();

        } catch (error) {
            console.error('Error showing change password form:', error);
            this.showErrorMessage('Fout bij laden wachtwoord formulier');
        }
    }

    // Change password from standalone form
    async changeCustomerPasswordStandalone(customerId, modal) {
        try {
            const form = modal.querySelector('#standalone-change-password-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Password validation
            if (!data.new_password) {
                this.showWarningMessage('Nieuw wachtwoord is vereist.');
                return;
            }
            if (data.new_password.length < 6) {
                this.showWarningMessage('Nieuw wachtwoord moet minstens 6 tekens bevatten.');
                return;
            }
            if (data.new_password !== data.confirm_password) {
                this.showWarningMessage('Wachtwoorden komen niet overeen.');
                return;
            }
            
            const response = await fetch(`/staff/api/customers/${customerId}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    new_password: data.new_password,
                    confirm_password: data.confirm_password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance.hide();
                
                this.showSuccessMessage('Wachtwoord succesvol gewijzigd!');
            } else {
                this.showErrorMessage('Fout bij wijzigen wachtwoord: ' + result.message);
            }
        } catch (error) {
            console.error('Error changing customer password:', error);
            this.showErrorMessage('Fout bij wijzigen wachtwoord: ' + error.message);
        }
    }

    async showCustomerRentals(customerId) {
        try {
            console.log('Loading customer rentals for ID:', customerId);
            const response = await fetch(`/staff/api/customers/${customerId}/rentals`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Customer rentals response:', result);
            
            if (result.success) {
                this.displayCustomerRentalsModal(customerId, result.rentals || []);
            } else {
                console.error('Failed to load customer rentals:', result);
                this.showErrorMessage('Fout bij laden verhuur: ' + (result.message || 'Onbekende fout'));
            }
        } catch (error) {
            console.error('Error loading customer rentals:', error);
            this.showErrorMessage('Fout bij laden klant verhuur: ' + error.message);
        }
    }

    displayCustomerRentalsModal(customerId, rentals) {
        // Sorteer verhuur op datum (nieuwste eerst)
        const sortedRentals = rentals.sort((a, b) => new Date(b.rental_date) - new Date(a.rental_date));
        
        // Filter voor actieve en voltooide verhuur
        const activeRentals = sortedRentals.filter(r => !r.returned && r.status !== 'returned');
        const completedRentals = sortedRentals.filter(r => r.returned || r.status === 'returned');
        
        const modal = this.createModal('Klant Verhuur & Film Beheer', `
            <div class="mb-4">
                <h6 class="text-warning"><i class="bi bi-film me-2"></i>Actieve & In Behandeling Verhuur (${activeRentals.length})</h6>
                ${this.renderAdvancedRentalsTable(activeRentals, true)}
            </div>
            ${completedRentals.length > 0 ? `
            <div class="mb-3">
                <h6 class="text-success"><i class="bi bi-check-circle me-2"></i>Voltooide Verhuur (${Math.min(completedRentals.length, 10)})</h6>
                ${this.renderAdvancedRentalsTable(completedRentals.slice(0, 10), false)}
            </div>
            ` : ''}
            <div class="mt-3">
                <small class="text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    Staff kan verhuur status wijzigen: In Behandeling → In Verhuur
                </small>
            </div>
        `, 'xl');
        
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }

    renderAdvancedRentalsTable(rentals, showStatusActions = false) {
        if (!rentals || rentals.length === 0) {
            return '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Geen verhuur gevonden</div>';
        }

        return `
            <div class="table-responsive">
                <table class="table table-dark table-sm">
                    <thead>
                        <tr>
                            <th>Film</th>
                            <th>Huur Datum</th>
                            <th>Retour Datum</th>
                            <th>Status</th>
                            ${showStatusActions ? '<th>Acties</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${rentals.map(rental => {
                            const huurDatum = new Date(rental.rental_date);
                            const retourDatum = rental.return_date ? new Date(rental.return_date) : null;
                            const dueDatum = rental.due_date ? new Date(rental.due_date) : null;
                            const nu = new Date();
                            
                            // Bepaal status kleur en tekst
                            let statusClass, statusText;
                            if (rental.returned || rental.return_date) {
                                statusClass = 'bg-success';
                                statusText = 'Teruggegeven';
                            } else if (rental.status === 'in_behandeling') {
                                statusClass = 'bg-warning text-dark';
                                statusText = 'In Behandeling';
                            } else if (rental.status === 'reserved') {
                                statusClass = 'bg-info text-dark';
                                statusText = 'Gereserveerd';
                            } else if (rental.status === 'rented') {
                                statusClass = 'bg-primary';
                                statusText = 'In Verhuur';
                            } else if (rental.status === 'pending') {
                                statusClass = 'bg-secondary';
                                statusText = 'In Behandeling';
                            } else {
                                statusClass = 'bg-light text-dark';
                                statusText = rental.status || 'Onbekend';
                            }
                            
                            // Check voor te laat
                            const isOverdue = dueDatum && dueDatum < nu && !rental.returned && !rental.return_date;
                            if (isOverdue) {
                                statusClass = 'bg-danger';
                                statusText = 'Te Laat';
                            }
                                             
                            return `
                                <tr>
                                    <td><strong>${rental.title}</strong></td>
                                    <td>${huurDatum.toLocaleDateString('nl-NL')}</td>
                                    <td>${retourDatum ? retourDatum.toLocaleDateString('nl-NL') : 
                                          (dueDatum ? dueDatum.toLocaleDateString('nl-NL') : 'Onbekend')}</td>
                                    <td>
                                        <span class="badge ${statusClass}">${statusText}</span>
                                    </td>
                                    ${showStatusActions ? this.renderStatusActions(rental) : ''}
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderStatusActions(rental) {
        // Als film al teruggegeven is, geen acties
        if (rental.returned || rental.return_date) {
            return '<td>-</td>';
        }

        let actions = [];
        
        // Status wijzigingsopties op basis van huidige status
        if (rental.status === 'in_behandeling' || rental.status === 'pending') {
            actions.push(`
                <button class="btn btn-primary btn-sm me-1" 
                        onclick="window.simpleCustomerManager.changeRentalStatus(${rental.rental_id}, 'rented')"
                        title="Zet naar In Verhuur">
                    <i class="bi bi-play-circle me-1"></i>In Verhuur
                </button>
            `);
        }
        
        if (rental.status === 'reserved') {
            actions.push(`
                <button class="btn btn-warning btn-sm me-1" 
                        onclick="window.simpleCustomerManager.changeRentalStatus(${rental.rental_id}, 'in_behandeling')"
                        title="Zet naar In Behandeling">
                    <i class="bi bi-gear me-1"></i>In Behandeling
                </button>
            `);
            actions.push(`
                <button class="btn btn-primary btn-sm me-1" 
                        onclick="window.simpleCustomerManager.changeRentalStatus(${rental.rental_id}, 'rented')"
                        title="Direct naar In Verhuur">
                    <i class="bi bi-play-circle me-1"></i>In Verhuur
                </button>
            `);
        }
        
        // Teruggeven knop voor alle actieve verhuur
        actions.push(`
            <button class="btn btn-success btn-sm" 
                    onclick="window.simpleCustomerManager.returnFilm(${rental.rental_id})"
                    title="Film Teruggeven">
                <i class="bi bi-arrow-return-left me-1"></i>Teruggeven
            </button>
        `);
        
        return `<td>${actions.join('')}</td>`;
    }

    async changeRentalStatus(rentalId, newStatus) {
        try {
            // Bevestiging vragen voor belangrijke status wijzigingen
            let confirmMessage = '';
            let confirmTitle = 'Status Wijzigen';
            
            if (newStatus === 'rented') {
                confirmMessage = 'Weet je zeker dat je deze verhuur wilt wijzigen naar <strong>"In Verhuur"</strong>?<br><br>Dit betekent dat de klant de film heeft ontvangen.';
            } else if (newStatus === 'in_behandeling') {
                confirmMessage = 'Weet je zeker dat je deze verhuur wilt wijzigen naar <strong>"In Behandeling"</strong>?';
            }
            
            if (confirmMessage) {
                // Toon een mooie bevestigingsmodal in plaats van lelijke confirm()
                const confirmed = await this.showConfirmationModal(confirmTitle, confirmMessage);
                if (!confirmed) {
                    return;
                }
            }
            
            // Show loading message
            this.showInfoMessage('Status wordt gewijzigd...');
            
            const response = await fetch(`/staff/api/rentals/${rentalId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccessMessage(`Status succesvol gewijzigd naar "${this.getStatusDisplayName(newStatus)}"`);
                
                // Close current modal and refresh
                const openModals = document.querySelectorAll('.modal.show');
                openModals.forEach(modal => {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) modalInstance.hide();
                });
                
                this.loadAllCustomers();
            } else {
                this.showErrorMessage('Fout bij wijzigen status: ' + result.message);
            }
        } catch (error) {
            console.error('Error changing rental status:', error);
            this.showErrorMessage('Fout bij wijzigen verhuur status');
        }
    }

    getStatusDisplayName(status) {
        const statusNames = {
            'pending': 'In Behandeling',
            'in_behandeling': 'In Behandeling',
            'reserved': 'Gereserveerd',
            'rented': 'In Verhuur',
            'returned': 'Teruggegeven',
            'cancelled': 'Geannuleerd'
        };
        return statusNames[status] || status;
    }

    renderRentalsTable(rentals, showReturnButton = false) {
        if (!rentals || rentals.length === 0) {
            return `
                <div class="text-center py-3 text-muted">
                    <i class="bi bi-film fs-3 mb-2"></i>
                    <p>Geen actieve verhuur gevonden</p>
                </div>
            `;
        }

        return `
            <div class="table-responsive">
                <table class="table table-dark table-sm">
                    <thead>
                        <tr>
                            <th>Film</th>
                            <th>Huur Datum</th>
                            <th>Retour Datum</th>
                            <th>Status</th>
                            ${showReturnButton ? '<th>Actie</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${rentals.map(rental => {
                            const huurDatum = new Date(rental.rental_date);
                            const retourDatum = new Date(rental.return_date);
                            const nu = new Date();
                            
                            const isOverdue = retourDatum < nu && !rental.returned;
                            const statusClass = rental.returned ? 'bg-success' : 
                                               isOverdue ? 'bg-danger' : 'bg-warning';
                            const statusText = rental.returned ? 'Teruggegeven' :
                                             isOverdue ? 'Te laat' : 'Actief';
                                             
                            return `
                                <tr>
                                    <td><strong>${rental.title}</strong></td>
                                    <td>${huurDatum.toLocaleDateString('nl-NL')}</td>
                                    <td>${retourDatum.toLocaleDateString('nl-NL')}</td>
                                    <td>
                                        <span class="badge ${statusClass}">${statusText}</span>
                                    </td>
                                    ${showReturnButton && !rental.returned ? 
                                        `<td>
                                            <button class="btn btn-success btn-sm" 
                                                    onclick="window.simpleCustomerManager.returnFilm(${rental.rental_id})">
                                                <i class="bi bi-arrow-return-left me-1"></i> Teruggeven
                                            </button>
                                        </td>` : 
                                        showReturnButton ? '<td>-</td>' : ''
                                    }
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async returnFilm(rentalId) {
        try {
            const response = await fetch('/staff/api/rentals/return', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rental_id: rentalId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccessMessage('Film succesvol teruggegeven');
                
                // Close current modal and refresh
                const openModals = document.querySelectorAll('.modal.show');
                openModals.forEach(modal => {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) modalInstance.hide();
                });
                
                this.loadAllCustomers();
            } else {
                this.showErrorMessage('Fout bij teruggeven: ' + result.message);
            }
        } catch (error) {
            console.error('Error returning film:', error);
            this.showErrorMessage('Fout bij teruggeven film');
        }
    }

    createModal(title, content, size = 'md') {
        const modalId = 'customer-modal-' + Date.now();
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-${size}">
                    <div class="modal-content bg-dark">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Sluiten</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById(modalId);
        
        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
        
        return modal;
    }

    showLoading() {
        const container = document.getElementById('customers-table-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-success" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="text-muted mt-3">Klanten laden...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const container = document.getElementById('customers-table-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
        }
    }

    clearResults() {
        const container = document.getElementById('customers-table-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-people fs-1 mb-3"></i>
                    <p>Klik op "Toon Alle Klanten" of zoek naar een specifieke klant</p>
                </div>
            `;
        }
    }

    showSuccessMessage(message) {
        // Create a temporary success alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at the top of the container
        const container = document.getElementById('customers-table-container');
        if (container && container.firstChild) {
            container.insertBefore(alertDiv, container.firstChild);
        }
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    showErrorMessage(message) {
        // Create a temporary error alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at the top of the container
        const container = document.getElementById('customers-table-container');
        if (container && container.firstChild) {
            container.insertBefore(alertDiv, container.firstChild);
        }
        
        // Auto dismiss after 7 seconds (longer for errors)
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 7000);
    }

    showWarningMessage(message) {
        // Create a temporary warning alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at the top of the container
        const container = document.getElementById('customers-table-container');
        if (container && container.firstChild) {
            container.insertBefore(alertDiv, container.firstChild);
        }
        
        // Auto dismiss after 6 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 6000);
    }

    showInfoMessage(message) {
        // Create a temporary info alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-info alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-info-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at the top of the container
        const container = document.getElementById('customers-table-container');
        if (container && container.firstChild) {
            container.insertBefore(alertDiv, container.firstChild);
        }
        
        // Auto dismiss after 3 seconds (shorter for info)
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }

    // Show confirmation modal and return a Promise
    showConfirmationModal(title, message) {
        return new Promise((resolve) => {
            const modal = this.createModal(title, `
                <div class="row">
                    <div class="col-12">
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            ${message}
                        </div>
                    </div>
                </div>
            `, 'md');

            const modalFooter = modal.querySelector('.modal-footer');
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" onclick="window.confirmationResolve(false)">
                    <i class="bi bi-x-circle me-2"></i>Annuleren
                </button>
                <button type="button" class="btn btn-warning" onclick="window.confirmationResolve(true)">
                    <i class="bi bi-check-circle me-2"></i>Bevestigen
                </button>
            `;

            // Set up global resolver function
            window.confirmationResolve = (result) => {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance.hide();
                resolve(result);
                delete window.confirmationResolve; // Clean up
            };

            // Show modal
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();

            // Handle modal close without clicking buttons
            modal.addEventListener('hidden.bs.modal', () => {
                if (window.confirmationResolve) {
                    resolve(false);
                    delete window.confirmationResolve;
                }
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window !== 'undefined') {
        window.simpleCustomerManager = new SimpleCustomerManager();
    }
});
