// Eenvoudige Verhuurbeheer Module
class SimpleRentalManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('Simple Rental Manager initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Zoek functionaliteit
        const searchInput = document.getElementById('rental-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (e.target.value.length >= 2) {
                    this.searchRentals(e.target.value);
                } else if (e.target.value.length === 0) {
                    this.clearResults();
                }
            });
        }

        // Toon alle verhuur knop
        const loadAllBtn = document.getElementById('load-all-rentals');
        if (loadAllBtn) {
            loadAllBtn.addEventListener('click', () => {
                this.loadAllRentals();
            });
        }
    }

    async loadAllRentals() {
        this.showLoading();
        try {
            const response = await fetch('/staff/api/rentals');
            const rentals = await response.json();
            this.displayRentals(rentals);
        } catch (error) {
            console.error('Error loading rentals:', error);
            this.showError('Fout bij laden van verhuur');
        }
    }

    async searchRentals(query) {
        this.showLoading();
        try {
            // Voor nu gebruiken we een simpele filter op de geladen data
            // Later kunnen we een specifieke search endpoint maken
            const response = await fetch('/staff/api/rentals');
            const allRentals = await response.json();
            const filteredRentals = allRentals.filter(rental => 
                rental.customer_name.toLowerCase().includes(query.toLowerCase()) ||
                rental.film_title.toLowerCase().includes(query.toLowerCase())
            );
            this.displayRentals(filteredRentals);
        } catch (error) {
            console.error('Error searching rentals:', error);
            this.showError('Fout bij zoeken naar verhuur');
        }
    }

    displayRentals(rentals) {
        const container = document.getElementById('rentals-table-container');
        if (!rentals || rentals.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-search fs-1 mb-3"></i>
                    <p>Geen verhuur gevonden</p>
                </div>
            `;
            return;
        }

        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-dark table-striped">
                    <thead>
                        <tr>
                            <th>Rental ID</th>
                            <th>Klant</th>
                            <th>Film</th>
                            <th>Uitgegeven</th>
                            <th>Retour Datum</th>
                            <th>Status</th>
                            <th>Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rentals.map(rental => {
                            let statusColor = 'secondary';
                            let statusText = 'Onbekend';
                            
                            if (rental.return_date) {
                                statusColor = 'success';
                                statusText = 'Teruggegeven';
                            } else if (rental.status === 'overdue' || (rental.return_date && new Date(rental.return_date) < new Date())) {
                                statusColor = 'danger';
                                statusText = 'Te Laat';
                            } else {
                                statusColor = 'primary';
                                statusText = 'Uitgegeven';
                            }
                            
                            return `
                                <tr>
                                    <td>${rental.rental_id}</td>
                                    <td>${rental.customer_name}</td>
                                    <td>${rental.film_title}</td>
                                    <td>${new Date(rental.rental_date).toLocaleDateString('nl-NL')}</td>
                                    <td>${new Date(rental.return_date).toLocaleDateString('nl-NL')}</td>
                                    <td>
                                        <span class="badge bg-${statusColor}">
                                            ${statusText}
                                        </span>
                                    </td>
                                    <td>
                                        ${!rental.return_date ? `
                                            <div class="btn-group" role="group">
                                                <button class="btn btn-sm btn-outline-success" onclick="window.simpleRentalManager.returnFilm(${rental.rental_id})" title="Film innemen">
                                                    <i class="bi bi-check-circle"></i> Innemen
                                                </button>
                                                <button class="btn btn-sm btn-outline-warning" onclick="window.simpleRentalManager.editDueDate(${rental.rental_id}, '${rental.due_date || rental.expected_return_date}')" title="Retour datum aanpassen">
                                                    <i class="bi bi-calendar-event"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-info" onclick="window.simpleRentalManager.viewRental(${rental.rental_id})" title="Details bekijken">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                            </div>
                                        ` : `
                                            <button class="btn btn-sm btn-outline-info" onclick="window.simpleRentalManager.viewRental(${rental.rental_id})">
                                                <i class="bi bi-eye"></i> Bekijk
                                            </button>
                                        `}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;
    }

    async returnFilm(rentalId) {
        console.log('returnFilm called with rentalId:', rentalId);
        
        const confirmed = await this.showConfirmationModal(
            'Weet je zeker dat je deze film wilt innemen?',
            'Ja, Innemen',
            'Annuleren'
        );
        
        if (!confirmed) {
            console.log('User cancelled return action');
            return;
        }

        // Show loading indicator
        this.showInfoMessage('Film wordt ingenomen...');

        try {
            console.log('Sending return request for rental:', rentalId);
            
            const response = await fetch(`/staff/rental-management/checkin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rental_id: rentalId
                })
            });

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response data:', result);
            
            if (response.ok) {
                this.showSuccessMessage('Film succesvol ingenomen!');
                this.loadAllRentals(); // Herlaad de lijst
            } else {
                this.showErrorMessage(`Fout: ${result.message}`);
            }
        } catch (error) {
            console.error('Error returning film:', error);
            this.showErrorMessage('Er is een fout opgetreden bij het innemen van de film');
        }
    }

    async viewRental(rentalId) {
        try {
            // Show loading
            this.showInfoMessage('Verhuur details laden...');
            
            const response = await fetch(`/staff/api/rentals/${rentalId}`);
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showRentalDetailsModal(result.rental);
            } else {
                this.showErrorMessage(result.message || 'Fout bij laden verhuur details');
            }
        } catch (error) {
            console.error('Error loading rental details:', error);
            this.showErrorMessage('Fout bij laden verhuur details');
        }
    }

    // Show rental details in a modal (simplified version)
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
        
        // Calculate status
        const returnDate = rental.return_date ? new Date(rental.return_date) : null;
        const dueDate = rental.due_date ? new Date(rental.due_date) : null;
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
        }
        
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-film me-2"></i>
                                Verhuur Details - ID #${rental.rental_id}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <!-- Status -->
                                <div class="col-12 text-center">
                                    <div class="alert alert-light border">
                                        <i class="bi ${statusIcon} fs-2 ${statusClass}"></i>
                                        <h6 class="mt-2 ${statusClass}">${statusText}</h6>
                                    </div>
                                </div>
                                
                                <!-- Basic Info -->
                                <div class="col-md-6">
                                    <h6 class="text-primary"><i class="bi bi-person me-2"></i>Klant</h6>
                                    <p class="mb-1"><strong>${rental.customer_name || 'Onbekend'}</strong></p>
                                    <p class="mb-0 text-muted">${rental.customer_email || 'Geen email'}</p>
                                </div>
                                
                                <div class="col-md-6">
                                    <h6 class="text-warning"><i class="bi bi-film me-2"></i>Film</h6>
                                    <p class="mb-1"><strong>${rental.film_title || 'Onbekend'}</strong></p>
                                    <p class="mb-0 text-muted">${rental.category || 'Geen categorie'}</p>
                                </div>
                                
                                <!-- Dates -->
                                <div class="col-12">
                                    <h6 class="text-success"><i class="bi bi-calendar me-2"></i>Verhuur Periode</h6>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <small class="text-muted">Uitgeleend</small>
                                            <p class="mb-0">${formatDate(rental.rental_date)}</p>
                                        </div>
                                        <div class="col-md-4">
                                            <small class="text-muted">Inleveren voor</small>
                                            <p class="mb-0">${formatDate(rental.due_date)}</p>
                                        </div>
                                        <div class="col-md-4">
                                            <small class="text-muted">Teruggegeven</small>
                                            <p class="mb-0">${returnDate ? formatDate(rental.return_date) : 'Nog niet terug'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Costs -->
                                <div class="col-12">
                                    <h6 class="text-info"><i class="bi bi-credit-card me-2"></i>Kosten</h6>
                                    <div class="d-flex justify-content-between">
                                        <span>Verhuurprijs: €${rental.rental_rate || '0.00'}</span>
                                        <span>Late kosten: €${rental.late_fee || '0.00'}</span>
                                        <strong>Totaal: €${((parseFloat(rental.rental_rate) || 0) + (parseFloat(rental.late_fee) || 0)).toFixed(2)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            ${!returnDate ? `
                                <button type="button" class="btn btn-success" onclick="window.simpleRentalManager.returnFilm(${rental.rental_id}); bootstrap.Modal.getInstance(document.getElementById('${modalId}')).hide();">
                                    <i class="bi bi-arrow-return-left me-2"></i>Film Innemen
                                </button>
                            ` : ''}
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Sluiten</button>
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

    showLoading() {
        const container = document.getElementById('rentals-table-container');
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-info" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted mt-3">Verhuur laden...</p>
            </div>
        `;
    }

    showError(message) {
        const container = document.getElementById('rentals-table-container');
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
    }

    clearResults() {
        const container = document.getElementById('rentals-table-container');
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="bi bi-film fs-1 mb-3"></i>
                <p>Klik op "Toon Alle Verhuur" of zoek naar specifieke verhuur</p>
            </div>
        `;
    }

    // Toast notification methods
    showSuccessMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-check-circle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.getElementById('rentals-table-container');
        if (container && container.firstChild) {
            container.insertBefore(alertDiv, container.firstChild);
        }
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    showErrorMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.getElementById('rentals-table-container');
        if (container && container.firstChild) {
            container.insertBefore(alertDiv, container.firstChild);
        }
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 7000);
    }

    showInfoMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-info alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-info-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.getElementById('rentals-table-container');
        if (container && container.firstChild) {
            container.insertBefore(alertDiv, container.firstChild);
        }
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }

    showConfirmationModal(message, confirmText = 'Bevestigen', cancelText = 'Annuleren') {
        return new Promise((resolve) => {
            // Create modal HTML
            const modalId = 'confirmationModal' + Date.now();
            const modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="bi bi-question-circle text-warning me-2"></i>
                                    Bevestiging
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p class="mb-0">${message}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
                                <button type="button" class="btn btn-primary" id="${modalId}-confirm">${confirmText}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Get modal element and initialize
            const modalElement = document.getElementById(modalId);
            const modal = new bootstrap.Modal(modalElement);
            
            // Handle confirm button
            const confirmBtn = document.getElementById(modalId + '-confirm');
            confirmBtn.addEventListener('click', () => {
                modal.hide();
                resolve(true);
            });
            
            // Handle modal close (cancel)
            modalElement.addEventListener('hidden.bs.modal', () => {
                modalElement.remove();
                resolve(false);
            });
            
            // Show modal
            modal.show();
        });
    }
    
    // Edit due date functionality
    async editDueDate(rentalId, currentDueDate) {
        console.log('editDueDate called with:', { rentalId, currentDueDate });
        
        const modalId = 'editDueDateModal' + Date.now();
        
        // Format current date for input (YYYY-MM-DD)
        const formatForInput = (dateString) => {
            console.log('formatForInput called with:', dateString);
            
            if (!dateString || dateString === 'null' || dateString === 'undefined') {
                console.log('No valid date string provided, returning empty');
                return '';
            }
            
            try {
                // Try to parse the date
                const date = new Date(dateString);
                
                // Check if date is valid
                if (isNaN(date.getTime())) {
                    console.log('Invalid date detected:', dateString);
                    return '';
                }
                
                const formatted = date.toISOString().split('T')[0];
                console.log('Formatted date:', formatted);
                return formatted;
            } catch (error) {
                console.error('Error formatting date:', error, 'Input:', dateString);
                return '';
            }
        };
        
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="bi bi-calendar-event me-2"></i>
                                Retour Datum Aanpassen
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-due-date-form-${rentalId}">
                                <div class="mb-3">
                                    <label for="new-due-date-${rentalId}" class="form-label">Nieuwe retour datum</label>
                                    <input type="date" class="form-control" id="new-due-date-${rentalId}" 
                                           value="${formatForInput(currentDueDate)}" required>
                                    <div class="form-text">
                                        <i class="bi bi-info-circle me-1"></i>
                                        Huidige datum: ${this.formatDateNL(currentDueDate)}
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
                            <button type="button" class="btn btn-warning" onclick="window.simpleRentalManager.saveDueDate(${rentalId}, '${modalId}')">
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
        console.log('saveDueDate called with:', { rentalId, modalId });
        
        try {
            const newDueDateElement = document.getElementById(`new-due-date-${rentalId}`);
            const reasonElement = document.getElementById(`due-date-reason-${rentalId}`);
            
            console.log('Found elements:', { 
                newDueDateElement: !!newDueDateElement, 
                reasonElement: !!reasonElement 
            });
            
            if (!newDueDateElement) {
                console.error('Could not find new-due-date element with id:', `new-due-date-${rentalId}`);
                this.showErrorMessage('Fout: Kan datum veld niet vinden');
                return;
            }
            
            const newDueDate = newDueDateElement.value;
            const reason = reasonElement ? reasonElement.value : '';
            
            console.log('Form values:', { newDueDate, reason });
            
            if (!newDueDate) {
                this.showErrorMessage('Selecteer een geldige datum');
                return;
            }
            
            // Show loading
            this.showInfoMessage('Datum wordt bijgewerkt...');
            
            console.log('Sending PUT request to:', `/staff/api/rentals/${rentalId}/due-date`);
            
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
            
            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response data:', result);
            
            if (response.ok && result.success) {
                // Close the edit modal
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById(modalId));
                if (modalInstance) {
                    modalInstance.hide();
                }
                
                // Show success message
                this.showSuccessMessage('Retour datum succesvol bijgewerkt');
                
                // Refresh rental data
                this.loadAllRentals();
            } else {
                this.showErrorMessage(result.message || 'Fout bij bijwerken datum');
            }
        } catch (error) {
            console.error('Error updating due date:', error);
            this.showErrorMessage('Fout bij bijwerken datum');
        }
    }
    
    // Format date for display (Dutch format)
    formatDateNL(dateString) {
        if (!dateString) return 'Niet ingesteld';
        return new Date(dateString).toLocaleDateString('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.simpleRentalManager = new SimpleRentalManager();
});
