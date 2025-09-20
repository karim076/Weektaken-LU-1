// Simple Rental System for Staff
class SimpleRentalSystem {
    constructor() {
        this.init();
    }

    init() {
        console.log('Simple Rental System initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Quick customer search
        const customerSearch = document.getElementById('quick-customer-search');
        if (customerSearch) {
            customerSearch.addEventListener('input', (e) => {
                this.searchCustomers(e.target.value);
            });
        }

        // Quick film search
        const filmSearch = document.getElementById('quick-film-search');
        if (filmSearch) {
            filmSearch.addEventListener('input', (e) => {
                this.searchFilms(e.target.value);
            });
        }

        // Rent film button
        const rentButton = document.getElementById('quick-rent-btn');
        if (rentButton) {
            rentButton.addEventListener('click', () => {
                this.processQuickRental();
            });
        }
    }

    async searchCustomers(query) {
        if (query.length < 2) {
            document.getElementById('customer-results').innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/staff/api/customers/search?q=${encodeURIComponent(query)}`);
            const customers = await response.json();
            this.displayCustomerResults(customers);
        } catch (error) {
            console.error('Error searching customers:', error);
        }
    }

    displayCustomerResults(customers) {
        const resultsDiv = document.getElementById('customer-results');
        resultsDiv.innerHTML = '';

        customers.forEach(customer => {
            const div = document.createElement('div');
            div.className = 'customer-result p-2 border-bottom cursor-pointer';
            div.innerHTML = `
                <strong>${customer.first_name} ${customer.last_name}</strong><br>
                <small class="text-muted">Email: ${customer.email}</small>
            `;
            div.addEventListener('click', () => this.selectCustomer(customer));
            resultsDiv.appendChild(div);
        });
    }

    selectCustomer(customer) {
        document.getElementById('selected-customer-id').value = customer.customer_id;
        document.getElementById('quick-customer-search').value = `${customer.first_name} ${customer.last_name}`;
        document.getElementById('customer-results').innerHTML = '';
        document.getElementById('selected-customer-info').innerHTML = `
            <div class="alert alert-info d-flex justify-content-between align-items-center">
                <div>
                    <strong>Geselecteerde klant:</strong> ${customer.first_name} ${customer.last_name}<br>
                    <small>Email: ${customer.email}</small>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.simpleRentalSystem.clearCustomerSelection()" title="Klant verwijderen">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `;
    }

    async searchFilms(query) {
        if (query.length < 2) {
            document.getElementById('film-results').innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/staff/api/films/search?q=${encodeURIComponent(query)}`);
            const films = await response.json();
            this.displayFilmResults(films);
        } catch (error) {
            console.error('Error searching films:', error);
        }
    }

    displayFilmResults(films) {
        const resultsDiv = document.getElementById('film-results');
        resultsDiv.innerHTML = '';

        films.forEach(film => {
            const div = document.createElement('div');
            div.className = 'film-result p-2 border-bottom cursor-pointer';
            div.innerHTML = `
                <strong>${film.title}</strong><br>
                <small class="text-muted">Beschikbaar: ${film.available_copies} kopieën</small>
            `;
            div.addEventListener('click', () => this.selectFilm(film));
            resultsDiv.appendChild(div);
        });
    }

    selectFilm(film) {
        document.getElementById('selected-film-id').value = film.film_id;
        document.getElementById('quick-film-search').value = film.title;
        document.getElementById('film-results').innerHTML = '';
        document.getElementById('selected-film-info').innerHTML = `
            <div class="alert alert-success d-flex justify-content-between align-items-center">
                <div>
                    <strong>Geselecteerde film:</strong> ${film.title}<br>
                    <small>Beschikbaar: ${film.available_copies} kopieën</small>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.simpleRentalSystem.clearFilmSelection()" title="Film verwijderen">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `;
    }

    async processQuickRental() {
        const customerId = document.getElementById('selected-customer-id').value;
        const filmId = document.getElementById('selected-film-id').value;

        if (!customerId || !filmId) {
            alert('Selecteer eerst een klant en een film');
            return;
        }

        try {
            const response = await fetch('/staff/api/rentals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    film_id: filmId
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                document.getElementById('rental-result').innerHTML = `
                    <div class="alert alert-success">
                        <strong>Verhuring succesvol!</strong><br>
                        Rental ID: ${result.rental_id}<br>
                        Retour datum: ${new Date(result.return_date).toLocaleDateString('nl-NL')}
                    </div>
                `;
                this.clearForm();
            } else {
                document.getElementById('rental-result').innerHTML = `
                    <div class="alert alert-danger">
                        <strong>Fout:</strong> ${result.message}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error processing rental:', error);
            document.getElementById('rental-result').innerHTML = `
                <div class="alert alert-danger">
                    <strong>Fout:</strong> Er is een probleem opgetreden
                </div>
            `;
        }
    }

    clearCustomerSelection() {
        document.getElementById('quick-customer-search').value = '';
        document.getElementById('selected-customer-id').value = '';
        document.getElementById('customer-results').innerHTML = '';
        document.getElementById('selected-customer-info').innerHTML = '';
        
        // Show feedback
        document.getElementById('selected-customer-info').innerHTML = `
            <div class="alert alert-warning alert-dismissible fade show">
                <i class="bi bi-info-circle me-2"></i>
                Klant selectie gewist
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Auto remove the message after 3 seconds
        setTimeout(() => {
            const alert = document.querySelector('#selected-customer-info .alert');
            if (alert) {
                alert.remove();
            }
        }, 3000);
    }

    clearFilmSelection() {
        document.getElementById('quick-film-search').value = '';
        document.getElementById('selected-film-id').value = '';
        document.getElementById('film-results').innerHTML = '';
        document.getElementById('selected-film-info').innerHTML = '';
        
        // Show feedback
        document.getElementById('selected-film-info').innerHTML = `
            <div class="alert alert-warning alert-dismissible fade show">
                <i class="bi bi-info-circle me-2"></i>
                Film selectie gewist
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Auto remove the message after 3 seconds
        setTimeout(() => {
            const alert = document.querySelector('#selected-film-info .alert');
            if (alert) {
                alert.remove();
            }
        }, 3000);
    }

    clearForm() {
        document.getElementById('quick-customer-search').value = '';
        document.getElementById('quick-film-search').value = '';
        document.getElementById('selected-customer-id').value = '';
        document.getElementById('selected-film-id').value = '';
        document.getElementById('customer-results').innerHTML = '';
        document.getElementById('film-results').innerHTML = '';
        document.getElementById('selected-customer-info').innerHTML = '';
        document.getElementById('selected-film-info').innerHTML = '';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.simpleRentalSystem = new SimpleRentalSystem();
});
