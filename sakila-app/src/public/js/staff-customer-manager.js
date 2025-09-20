/**
 * Staff Customer Management
 * Handles customer search, viewing, and editing functionality for staff
 */

class StaffCustomerManager {
    constructor() {
        this.currentPage = 1;
        this.searchTerm = '';
        this.customers = [];
        this.selectedCustomer = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadCustomers();
    }
    
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.debounce(() => this.loadCustomers(), 300);
            });
        }
        
        // Add customer button
        const addCustomerBtn = document.getElementById('add-customer-btn');
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', () => this.showAddCustomerModal());
        }
        
        // Customer table clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-customer-btn')) {
                const customerId = e.target.dataset.customerId;
                this.editCustomer(customerId);
            }
            
            if (e.target.classList.contains('view-customer-btn')) {
                const customerId = e.target.dataset.customerId;
                this.viewCustomer(customerId);
            }
            
            if (e.target.classList.contains('delete-customer-btn')) {
                const customerId = e.target.dataset.customerId;
                this.deleteCustomer(customerId);
            }
        });
        
        // Modal save button
        const saveCustomerBtn = document.getElementById('save-customer-btn');
        if (saveCustomerBtn) {
            saveCustomerBtn.addEventListener('click', () => this.saveCustomer());
        }
    }
    
    async loadCustomers() {
        try {
            const response = await fetch(`/staff/api/customers/search?search=${encodeURIComponent(this.searchTerm)}&page=${this.currentPage}`);
            const data = await response.json();
            
            if (data.success) {
                this.customers = data.customers;
                this.renderCustomersTable();
                this.updatePagination(data.pagination);
            } else {
                this.showToast('Fout bij laden klanten: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showToast('Fout bij laden klanten', 'error');
        }
    }
    
    renderCustomersTable() {
        const tableBody = document.getElementById('customers-table-body');
        if (!tableBody) return;
        
        if (this.customers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="bi bi-inbox fs-2 mb-2"></i>
                        <p class="mb-0">Geen klanten gevonden</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = this.customers.map(customer => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                            <i class="bi bi-person text-primary"></i>
                        </div>
                        <div>
                            <div class="fw-medium">${customer.first_name} ${customer.last_name}</div>
                            <small class="text-muted">${customer.email}</small>
                        </div>
                    </div>
                </td>
                <td>${customer.phone || '-'}</td>
                <td>
                    <small class="text-muted">
                        ${customer.address}<br>
                        ${customer.city}, ${customer.postal_code}
                    </small>
                </td>
                <td>
                    <span class="badge bg-${customer.active ? 'success' : 'secondary'}">
                        ${customer.active ? 'Actief' : 'Inactief'}
                    </span>
                </td>
                <td>
                    <small class="text-muted">
                        ${customer.total_rentals || 0} verhuur<br>
                        €${(customer.total_spent || 0).toFixed(2)}
                    </small>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-primary view-customer-btn" 
                                data-customer-id="${customer.customer_id}" title="Bekijken">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-success edit-customer-btn" 
                                data-customer-id="${customer.customer_id}" title="Bewerken">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger delete-customer-btn" 
                                data-customer-id="${customer.customer_id}" title="Deactiveren">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    async viewCustomer(customerId) {
        try {
            const response = await fetch(`/staff/customers/${customerId}`);
            const data = await response.json();
            
            if (data.success) {
                this.selectedCustomer = data.customer;
                this.showCustomerModal('view');
            } else {
                this.showToast('Fout bij laden klant: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error loading customer:', error);
            this.showToast('Fout bij laden klant', 'error');
        }
    }
    
    async editCustomer(customerId) {
        try {
            const response = await fetch(`/staff/customers/${customerId}`);
            const data = await response.json();
            
            if (data.success) {
                this.selectedCustomer = data.customer;
                this.showCustomerModal('edit');
            } else {
                this.showToast('Fout bij laden klant: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error loading customer:', error);
            this.showToast('Fout bij laden klant', 'error');
        }
    }
    
    showCustomerModal(mode = 'view') {
        const modal = document.getElementById('customerModal');
        const modalTitle = document.getElementById('customerModalLabel');
        const saveBtn = document.getElementById('save-customer-btn');
        
        if (!modal || !this.selectedCustomer) return;
        
        // Set modal title and button visibility
        if (mode === 'edit') {
            modalTitle.textContent = 'Klant Bewerken';
            saveBtn.style.display = 'block';
            this.populateCustomerForm(true);
        } else {
            modalTitle.textContent = 'Klant Details';
            saveBtn.style.display = 'none';
            this.populateCustomerForm(false);
        }
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
    
    populateCustomerForm(editable = false) {
        const customer = this.selectedCustomer;
        const form = document.getElementById('customer-form');
        
        if (!form) return;
        
        // Populate form fields
        const fields = [
            'first_name', 'last_name', 'email', 'phone',
            'address', 'district', 'city', 'postal_code'
        ];
        
        fields.forEach(field => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
                input.value = customer[field] || '';
                input.disabled = !editable;
            }
        });
        
        // Active status
        const activeSelect = form.querySelector('[name="active"]');
        if (activeSelect) {
            activeSelect.value = customer.active ? '1' : '0';
            activeSelect.disabled = !editable;
        }
    }
    
    async saveCustomer() {
        const form = document.getElementById('customer-form');
        if (!form || !this.selectedCustomer) return;
        
        const formData = new FormData(form);
        const customerData = Object.fromEntries(formData);
        
        try {
            const response = await fetch(`/staff/customers/${this.selectedCustomer.customer_id}/edit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(customerData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Klant succesvol bijgewerkt', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('customerModal'));
                modal.hide();
                this.loadCustomers();
            } else {
                this.showToast('Fout bij opslaan: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error saving customer:', error);
            this.showToast('Fout bij opslaan klant', 'error');
        }
    }
    
    async deleteCustomer(customerId) {
        if (!confirm('Weet je zeker dat je deze klant wilt deactiveren?')) {
            return;
        }
        
        try {
            const response = await fetch(`/staff/customers/${customerId}/edit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ active: 0 })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Klant gedeactiveerd', 'success');
                this.loadCustomers();
            } else {
                this.showToast('Fout bij deactiveren: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error deactivating customer:', error);
            this.showToast('Fout bij deactiveren klant', 'error');
        }
    }
    
    updatePagination(pagination) {
        const paginationContainer = document.getElementById('customers-pagination');
        if (!paginationContainer || !pagination) return;
        
        const { currentPage, totalPages, totalCount } = pagination;
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">Vorige</a>
            </li>
        `;
        
        // Page numbers
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">Volgende</a>
            </li>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
        
        // Add pagination click handlers
        paginationContainer.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('page-link') && !e.target.closest('.disabled')) {
                this.currentPage = parseInt(e.target.dataset.page);
                this.loadCustomers();
            }
        });
    }
    
    // Utility functions
    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }
    
    showToast(message, type = 'info') {
        // Use existing toast notification system
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('staff-customers-section')) {
        window.staffCustomerManager = new StaffCustomerManager();
    }
});
