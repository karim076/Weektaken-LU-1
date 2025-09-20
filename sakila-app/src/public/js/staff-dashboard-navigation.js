/**
 * Staff Dashboard Navigation
 * Manages navigation between staff dashboard sections
 */

class StaffDashboardNavigation {
    constructor() {
        this.currentSection = 'staff-dashboard';
        this.sections = {};
        this.navLinks = {};
        
        this.init();
    }
    
    init() {
        this.findElements();
        this.setupEventListeners();
        this.showInitialSection();
    }
    
    findElements() {
        // Find all staff navigation links
        this.navLinks = {
            'staff-dashboard': document.querySelector('[data-section="staff-dashboard"]'),
            'staff-customers': document.querySelector('[href="/staff/customers"]'),
            'staff-rental': document.querySelector('[href="/staff/rental-management"]'),
            'films': document.querySelector('[href="/films"]')
        };
        
        // Find all staff sections
        this.sections = {
            'staff-dashboard': document.getElementById('staff-dashboard-section'),
            'staff-customers': document.getElementById('staff-customers-section'),
            'staff-rental': document.getElementById('staff-rental-section')
        };
    }
    
    setupEventListeners() {
        // Handle navigation clicks for sections that should stay on the same page
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-section]');
            if (link && link.dataset.section.startsWith('staff-')) {
                e.preventDefault();
                e.stopPropagation();
                this.showSection(link.dataset.section);
                return false;
            }
            
            // Handle specific staff navigation
            const customerLink = e.target.closest('[href="/staff/customers"]');
            if (customerLink) {
                e.preventDefault();
                e.stopPropagation();
                this.loadCustomersSection();
                return false;
            }
            
            const rentalLink = e.target.closest('[href="/staff/rental-management"]');
            if (rentalLink) {
                e.preventDefault();
                e.stopPropagation();
                this.loadRentalSection();
                return false;
            }
        }, true); // Use capture phase to prevent double handling
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.showSection(e.state.section, false);
            }
        });
        
        // Handle tab changes within sections
        document.addEventListener('shown.bs.tab', (e) => {
            const targetId = e.target.getAttribute('href');
            if (targetId && targetId.includes('staff')) {
                this.updateUrlHash(targetId.substring(1));
            }
        });
    }
    
    showInitialSection() {
        // Check URL hash to determine initial section
        const hash = window.location.hash.substring(1);
        if (hash && hash.startsWith('staff-')) {
            this.showSection(hash, false);
        } else {
            this.showSection('staff-dashboard', false);
        }
    }
    
    showSection(sectionName, updateHistory = true) {
        console.log('Staff Navigation: Showing section:', sectionName);
        
        this.currentSection = sectionName;
        
        // Update navigation active states
        this.updateNavigation(sectionName);
        
        // Show/hide sections
        this.updateSectionVisibility(sectionName);
        
        // Load section content if needed
        this.loadSectionContent(sectionName);
        
        // Update URL and history
        if (updateHistory) {
            this.updateUrlHash(sectionName);
            history.pushState({ section: sectionName }, '', `#${sectionName}`);
        }
    }
    
    updateNavigation(sectionName) {
        // Remove active from all staff nav links
        Object.values(this.navLinks).forEach(link => {
            if (link) link.classList.remove('active');
        });
        
        // Add active to current section
        const currentLink = this.navLinks[sectionName];
        if (currentLink) {
            currentLink.classList.add('active');
        }
        
        // Special handling for customers and rental sections
        if (sectionName === 'staff-customers' && this.navLinks['staff-customers']) {
            this.navLinks['staff-customers'].classList.add('active');
        }
        
        if (sectionName === 'staff-rental' && this.navLinks['staff-rental']) {
            this.navLinks['staff-rental'].classList.add('active');
        }
    }
    
    updateSectionVisibility(sectionName) {
        // Hide all staff sections
        Object.values(this.sections).forEach(section => {
            if (section) {
                section.classList.add('d-none');
            }
        });
        
        // Show current section
        const currentSection = this.sections[sectionName];
        if (currentSection) {
            currentSection.classList.remove('d-none');
        }
    }
    
    loadSectionContent(sectionName) {
        switch (sectionName) {
            case 'staff-customers':
                this.loadCustomersContent();
                break;
            case 'staff-rental':
                this.loadRentalContent();
                break;
            case 'staff-dashboard':
                this.loadDashboardContent();
                break;
        }
    }
    
    async loadCustomersSection() {
        this.showSection('staff-customers');
        
        // Create customers section if it doesn't exist
        if (!this.sections['staff-customers']) {
            await this.createCustomersSection();
        }
    }
    
    async loadRentalSection() {
        this.showSection('staff-rental');
        
        // Create rental section if it doesn't exist
        if (!this.sections['staff-rental']) {
            await this.createRentalSection();
        }
    }
    
    async createCustomersSection() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;
        
        const customersHTML = `
            <div id="staff-customers-section" class="content-section d-none">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2><i class="bi bi-people me-2"></i>Klanten Beheren</h2>
                    <button class="btn btn-primary" id="add-customer-btn">
                        <i class="bi bi-plus-circle me-2"></i>Nieuwe Klant
                    </button>
                </div>
                
                <!-- Search and filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                                    <input type="text" class="form-control" id="customer-search" 
                                           placeholder="Zoek op naam, email of telefoon...">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="btn-group" role="group">
                                    <input type="radio" class="btn-check" name="customer-filter" id="filter-all" checked>
                                    <label class="btn btn-outline-primary" for="filter-all">Alle</label>
                                    
                                    <input type="radio" class="btn-check" name="customer-filter" id="filter-active">
                                    <label class="btn btn-outline-success" for="filter-active">Actief</label>
                                    
                                    <input type="radio" class="btn-check" name="customer-filter" id="filter-inactive">
                                    <label class="btn btn-outline-secondary" for="filter-inactive">Inactief</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Customers table -->
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Klant</th>
                                        <th>Telefoon</th>
                                        <th>Adres</th>
                                        <th>Status</th>
                                        <th>Verhuur Info</th>
                                        <th>Acties</th>
                                    </tr>
                                </thead>
                                <tbody id="customers-table-body">
                                    <tr>
                                        <td colspan="6" class="text-center">
                                            <div class="spinner-border" role="status">
                                                <span class="visually-hidden">Laden...</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Pagination -->
                        <nav aria-label="Klanten paginering">
                            <ul class="pagination justify-content-center" id="customers-pagination">
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.insertAdjacentHTML('beforeend', customersHTML);
        this.sections['staff-customers'] = document.getElementById('staff-customers-section');
        
        // Create customer modal
        this.createCustomerModal();
        
        // Initialize customer manager if not already loaded
        if (!window.staffCustomerManager) {
            const script = document.createElement('script');
            script.src = '/js/staff-customer-manager.js';
            document.head.appendChild(script);
        }
    }
    
    async createRentalSection() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;
        
        const rentalHTML = `
            <div id="staff-rental-section" class="content-section d-none">
                <h2 class="mb-4"><i class="bi bi-film me-2"></i>Verhuur Beheren</h2>
                
                <!-- Tabs for different rental actions -->
                <ul class="nav nav-tabs mb-4" id="rental-tabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="checkout-tab" data-bs-toggle="tab" 
                                data-bs-target="#checkout-tab-pane" type="button" role="tab">
                            <i class="bi bi-plus-circle me-2"></i>Film Uitgeven
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="checkin-tab" data-bs-toggle="tab" 
                                data-bs-target="#checkin-tab-pane" type="button" role="tab">
                            <i class="bi bi-check-circle me-2"></i>Film Innemen
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="current-tab" data-bs-toggle="tab" 
                                data-bs-target="#current-tab-pane" type="button" role="tab">
                            <i class="bi bi-list me-2"></i>Huidige Verhuur
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="overdue-tab" data-bs-toggle="tab" 
                                data-bs-target="#overdue-tab-pane" type="button" role="tab">
                            <i class="bi bi-exclamation-triangle me-2"></i>Te Laat
                        </button>
                    </li>
                </ul>
                
                <div class="tab-content" id="rental-tab-content">
                    <!-- Checkout Tab -->
                    <div class="tab-pane fade show active" id="checkout-tab-pane" role="tabpanel">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Film Uitgeven</h5>
                            </div>
                            <div class="card-body">
                                <form id="checkout-form">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="checkout-customer-search" class="form-label">Klant Zoeken</label>
                                                <div class="position-relative">
                                                    <input type="text" class="form-control" id="checkout-customer-search" 
                                                           placeholder="Type naam of email...">
                                                    <input type="hidden" id="selected-customer-id">
                                                    <div class="list-group position-absolute w-100 d-none" 
                                                         id="customer-search-results" style="z-index: 1000;"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="checkout-film-search" class="form-label">Film Zoeken</label>
                                                <div class="position-relative">
                                                    <input type="text" class="form-control" id="checkout-film-search" 
                                                           placeholder="Type film titel...">
                                                    <input type="hidden" id="selected-film-id">
                                                    <div class="list-group position-absolute w-100 d-none" 
                                                         id="film-search-results" style="z-index: 1000;"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="checkout-due-date" class="form-label">Inleverdatum</label>
                                                <input type="date" class="form-control" id="checkout-due-date">
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-check me-2"></i>Film Uitgeven
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Checkin Tab -->
                    <div class="tab-pane fade" id="checkin-tab-pane" role="tabpanel">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Film Innemen</h5>
                            </div>
                            <div class="card-body">
                                <form id="checkin-form">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="checkin-rental-id" class="form-label">Verhuur ID</label>
                                                <input type="number" class="form-control" id="checkin-rental-id" 
                                                       placeholder="Voer verhuur ID in...">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="checkin-condition" class="form-label">Conditie</label>
                                                <select class="form-select" id="checkin-condition">
                                                    <option value="good">Goed</option>
                                                    <option value="fair">Redelijk</option>
                                                    <option value="poor">Slecht</option>
                                                    <option value="damaged">Beschadigd</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="checkin-notes" class="form-label">Opmerkingen</label>
                                        <textarea class="form-control" id="checkin-notes" rows="3" 
                                                  placeholder="Eventuele opmerkingen..."></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-success">
                                        <i class="bi bi-check-circle me-2"></i>Film Innemen
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Current Rentals Tab -->
                    <div class="tab-pane fade" id="current-tab-pane" role="tabpanel">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Huidige Verhuur</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Klant</th>
                                                <th>Film</th>
                                                <th>Uitgegeven</th>
                                                <th>Inleverdatum</th>
                                                <th>Status</th>
                                                <th>Acties</th>
                                            </tr>
                                        </thead>
                                        <tbody id="current-rentals-tbody">
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Overdue Tab -->
                    <div class="tab-pane fade" id="overdue-tab-pane" role="tabpanel">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0 text-warning">
                                    <i class="bi bi-exclamation-triangle me-2"></i>Te Late Verhuur
                                </h5>
                            </div>
                            <div class="card-body">
                                <div id="overdue-rentals-list">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.insertAdjacentHTML('beforeend', rentalHTML);
        this.sections['staff-rental'] = document.getElementById('staff-rental-section');
        
        // Set default due date to 7 days from now
        const dueDateInput = document.getElementById('checkout-due-date');
        if (dueDateInput) {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 7);
            dueDateInput.value = defaultDate.toISOString().split('T')[0];
        }
        
        // Initialize rental manager if not already loaded
        if (!window.staffRentalManager) {
            const script = document.createElement('script');
            script.src = '/js/staff-rental-manager.js';
            document.head.appendChild(script);
        }
    }
    
    createCustomerModal() {
        const modalHTML = `
            <div class="modal fade" id="customerModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="customerModalLabel">Klant Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="customer-form">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="first_name" class="form-label">Voornaam</label>
                                            <input type="text" class="form-control" name="first_name" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="last_name" class="form-label">Achternaam</label>
                                            <input type="text" class="form-control" name="last_name" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="email" class="form-label">Email</label>
                                            <input type="email" class="form-control" name="email" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="phone" class="form-label">Telefoon</label>
                                            <input type="text" class="form-control" name="phone">
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="address" class="form-label">Adres</label>
                                    <input type="text" class="form-control" name="address" required>
                                </div>
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="district" class="form-label">Wijk</label>
                                            <input type="text" class="form-control" name="district">
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="city" class="form-label">Stad</label>
                                            <input type="text" class="form-control" name="city" required>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="postal_code" class="form-label">Postcode</label>
                                            <input type="text" class="form-control" name="postal_code">
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="active" class="form-label">Status</label>
                                    <select class="form-select" name="active">
                                        <option value="1">Actief</option>
                                        <option value="0">Inactief</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Sluiten</button>
                            <button type="button" class="btn btn-primary" id="save-customer-btn" style="display: none;">Opslaan</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    loadCustomersContent() {
        // Trigger customer loading if manager exists
        if (window.staffCustomerManager) {
            window.staffCustomerManager.loadCustomers();
        }
    }
    
    loadRentalContent() {
        // Trigger rental loading if manager exists
        if (window.staffRentalManager) {
            window.staffRentalManager.loadRentalData();
        }
    }
    
    loadDashboardContent() {
        // Refresh dashboard statistics if needed
        console.log('Loading staff dashboard content');
    }
    
    updateUrlHash(hash) {
        if (window.location.hash !== `#${hash}`) {
            window.location.hash = hash;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on a staff dashboard
    if (document.querySelector('[data-section="staff-dashboard"]') || 
        document.getElementById('staff-dashboard-section')) {
        window.staffDashboardNavigation = new StaffDashboardNavigation();
    }
});
