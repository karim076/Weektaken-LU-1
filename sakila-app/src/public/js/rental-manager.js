/**
 * Rental Management System
 * Handles rental data loading, rendering, and rental actions (pay, cancel, return, extend)
 */

// Load rentals content from server
function loadRentalsContent() {
    const rentalsContent = document.getElementById('rentals-content');
    console.log('Loading rentals content...');
    
    fetch('/customer/rentals-data')
        .then(response => {
            console.log('Rentals response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Rentals data received:', data);
            if (data.success) {
                renderRentalsContent(data.rentals, data.stats, rentalsContent);
            } else {
                rentalsContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Fout bij het laden van verhuurgegevens: ${data.message}
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading rentals:', error);
            rentalsContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Er is een fout opgetreden bij het laden van je verhuurgegevens.
                </div>
            `;
        });
}

// Render rentals content with stats and rental list
function renderRentalsContent(rentals, stats, container) {
    let html = '';
    
    // Stats cards
    if (stats) {
        html += `
            <div class="row g-4 mb-4 rentals-stats-row">
                <div class="col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-clock-history fs-1 text-warning mb-2"></i>
                            <h4 class="text-warning" data-stat="pending">${stats.pending || 0}</h4>
                            <small class="text-muted">In Behandeling</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-check-circle fs-1 text-success mb-2"></i>
                            <h4 class="text-success" data-stat="paid">${stats.paid || 0}</h4>
                            <small class="text-muted">Betaald</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-film fs-1 text-primary mb-2"></i>
                            <h4 class="text-primary" data-stat="rented">${stats.rented || 0}</h4>
                            <small class="text-muted">Gehuurd</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-check2-circle fs-1 text-info mb-2"></i>
                            <h4 class="text-info" data-stat="returned">${stats.returned || 0}</h4>
                            <small class="text-muted">Teruggebracht</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-wallet2 fs-2 text-warning mb-2"></i>
                            <h6 class="text-warning">€${(stats.paid_amount || 0).toFixed(2)}</h6>
                            <small class="text-muted">Nog Actief</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-currency-euro fs-2 text-success mb-2"></i>
                            <h6 class="text-success">€${(stats.total_spent || 0).toFixed(2)}</h6>
                            <small class="text-muted">Totaal</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Rentals list
    html += '<div class="card">';
    html += '<div class="card-header"><h5 class="mb-0"><i class="bi bi-clock-history text-danger me-2"></i>Verhuur Geschiedenis</h5></div>';
    html += '<div class="card-body">';
    
    if (rentals && rentals.length > 0) {
        html += '<div class="row g-3">';
        rentals.forEach(rental => {
            html += generateRentalCard(rental);
        });
        html += '</div>';
    } else {
        html += `
            <div class="text-center py-5">
                <i class="bi bi-film display-1 text-muted mb-3"></i>
                <h3 class="text-muted">Geen verhuur gevonden</h3>
                <p class="text-muted">Je hebt nog geen films gehuurd.</p>
                <a href="/films" class="btn btn-primary">
                    <i class="bi bi-plus-circle"></i> Huur je eerste film
                </a>
            </div>
        `;
    }
    
    html += '</div></div>';
    container.innerHTML = html;
}

// Generate individual rental card HTML
function generateRentalCard(rental) {
    const statusBadge = getStatusBadge(rental.status);
    const rentalDate = new Date(rental.rental_date).toLocaleDateString('nl-NL');
    const filmPrice = parseFloat(rental.rental_rate || rental.amount || 0).toFixed(2);
    const totalAmount = parseFloat(rental.amount || 0).toFixed(2);
    const filmTitle = rental.film_title || rental.title || 'Onbekende Film';
    const category = rental.category || 'Onbekend';
    
    console.log('Rental data:', {
        id: rental.rental_id,
        title: filmTitle,
        rental_rate: rental.rental_rate,
        amount: rental.amount,
        status: rental.status
    });
    
    return `
        <div class="col-12" data-rental-id="${rental.rental_id}">
            <div class="card bg-dark border-secondary">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-auto">
                            <div class="bg-danger bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                                <i class="bi bi-film fs-4 text-danger"></i>
                            </div>
                        </div>
                        <div class="col">
                            <div class="row">
                                <div class="col-md-3">
                                    <h6 class="mb-1 text-white">${filmTitle}</h6>
                                    <small class="text-muted"><i class="bi bi-tag"></i> ${category}</small>
                                </div>
                                <div class="col-md-2">
                                    <small class="text-muted d-block">Gehuurd op</small>
                                    <span class="fw-medium text-light">${rentalDate}</span>
                                </div>
                                <div class="col-md-2">
                                    <small class="text-muted d-block">Filmprijs</small>
                                    <span class="fw-medium text-info">€${filmPrice}</span>
                                    <br><small class="text-muted">per periode</small>
                                </div>
                                <div class="col-md-2">
                                    <small class="text-muted d-block">Status</small>
                                    ${statusBadge}
                                </div>
                                <div class="col-md-2">
                                    <small class="text-muted d-block">Totaal Bedrag</small>
                                    <span class="h6 ${rental.status === 'pending' ? 'text-danger' : 'text-success'} mb-0">€${totalAmount}</span>
                                    <br><small class="text-muted">${rental.status === 'pending' ? 'Nog te betalen' : rental.status === 'returned' ? 'Afgerond' : 'Betaald'}</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-auto">
                            ${generateRentalActions(rental, filmTitle, totalAmount)}
                        </div>
                    </div>
                    ${rental.status === 'pending' ? generatePendingAlert(rental.rental_id, totalAmount) : ''}
                </div>
            </div>
        </div>
    `;
}

// Generate action dropdown for rental
function generateRentalActions(rental, filmTitle, totalAmount) {
    let actionItems = '';
    
    if (rental.status === 'pending') {
        actionItems = `
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-warning" href="#" data-action="pay" onclick="payRental(${rental.rental_id}, ${totalAmount})"><i class="bi bi-credit-card"></i> Nu Betalen (€${totalAmount})</a></li>
            <li><a class="dropdown-item text-danger" href="#" data-action="cancel" onclick="cancelRental(${rental.rental_id}, '${filmTitle.replace(/'/g, "\\'")}')"><i class="bi bi-x-circle"></i> Annuleren</a></li>
        `;
    } else if (rental.status === 'returned') {
        actionItems = `
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-success" href="/films" data-action="rent-again"><i class="bi bi-arrow-repeat"></i> Opnieuw Huren</a></li>
        `;
    } else if (rental.status === 'rented') {
        actionItems = `
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-info" href="#" data-action="return" onclick="returnRental(${rental.rental_id}, '${filmTitle.replace(/'/g, "\\'")}')"><i class="bi bi-arrow-return-left"></i> Inleveren</a></li>
            <li><a class="dropdown-item text-warning" href="#" data-action="extend" onclick="extendRental(${rental.rental_id}, '${filmTitle.replace(/'/g, "\\'")}')"><i class="bi bi-clock"></i> Verlengen</a></li>
        `;
    }
    
    return `
        <div class="dropdown">
            <button class="btn btn-outline-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-three-dots"></i>
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="/customer/rentals/${rental.rental_id}"><i class="bi bi-eye"></i> Details</a></li>
                <li><a class="dropdown-item" href="/films/${rental.film_id}"><i class="bi bi-info-circle"></i> Film Info</a></li>
                ${actionItems}
            </ul>
        </div>
    `;
}

// Generate pending payment alert
function generatePendingAlert(rentalId, totalAmount) {
    return `
        <div class="row mt-3">
            <div class="col-12">
                <div class="alert alert-warning py-2 mb-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="bi bi-exclamation-triangle"></i>
                            <strong>Actie vereist:</strong> Betaling van €${totalAmount} om verhuur te activeren
                        </div>
                        <button class="btn btn-warning btn-sm" data-action="pay" onclick="payRental(${rentalId}, ${totalAmount})">
                            <i class="bi bi-credit-card"></i> Nu Betalen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Get status badge HTML based on rental status
function getStatusBadge(status) {
    switch(status) {
        case 'pending':
            return '<span class="badge rental-status bg-warning text-dark"><i class="bi bi-clock"></i> Te Betalen</span>';
        case 'paid':
            return '<span class="badge rental-status bg-success"><i class="bi bi-check-circle"></i> Betaald</span>';
        case 'rented':
            return '<span class="badge rental-status bg-primary"><i class="bi bi-play-circle"></i> Actief Gehuurd</span>';
        case 'returned':
            return '<span class="badge rental-status bg-info"><i class="bi bi-check2-circle"></i> Voltooid</span>';
        default:
            return '<span class="badge rental-status bg-secondary">Onbekend</span>';
    }
}

// Reload rentals content (utility function for other scripts)
function reloadRentalsContent() {
    const rentalsSection = document.getElementById('rentals-section');
    if (rentalsSection) {
        // Force reload by removing the loaded flag
        rentalsSection.dataset.loaded = 'false';
        loadRentalsContent();
    } else {
        // If no section found, directly load content
        loadRentalsContent();
    }
}
