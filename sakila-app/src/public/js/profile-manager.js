/**
 * Profile Management System
 * Handles user profile data loading, rendering, and updates
 */

// Load profile content from server
function loadProfileContent() {
    const profileContent = document.getElementById('profile-content');
    console.log('Loading profile content...');
    
    fetch('/customer/profile-data')
        .then(response => {
            console.log('Profile response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Profile data received:', data);
            if (data.success) {
                renderProfileContent(data.customer, profileContent);
            } else {
                profileContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Fout bij het laden van profielgegevens: ${data.message}
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading profile:', error);
            profileContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Er is een fout opgetreden bij het laden van je profielgegevens.
                </div>
            `;
        });
}

// Render profile form with customer data
function renderProfileContent(customer, container) {
    const html = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0"><i class="bi bi-person text-info me-2"></i>Mijn Profiel</h5>
            </div>
            <div class="card-body">
                <form id="profileForm">
                    <!-- Basic Information -->
                    <div class="row mb-4">
                        <div class="col-md-6 mb-3">
                            <label for="first_name" class="form-label text-light">Voornaam *</label>
                            <input type="text" class="form-control bg-dark border-secondary text-light" id="first_name" value="${customer.first_name || ''}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="last_name" class="form-label text-light">Achternaam *</label>
                            <input type="text" class="form-control bg-dark border-secondary text-light" id="last_name" value="${customer.last_name || ''}" required>
                        </div>
                        <div class="col-md-12 mb-3">
                            <label for="email" class="form-label text-light">Email *</label>
                            <input type="email" class="form-control bg-dark border-secondary text-light" id="email" value="${customer.email || ''}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="username" class="form-label text-light">Gebruikersnaam *</label>
                            <input type="text" class="form-control bg-dark border-secondary text-light" id="username" value="${customer.username || ''}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="phone" class="form-label text-light">Telefoonnummer</label>
                            <input type="tel" class="form-control bg-dark border-secondary text-light" id="phone" value="${customer.phone || ''}" placeholder="06-12345678">
                        </div>
                    </div>

                    <!-- Address Information -->
                    <div class="row mb-4">
                        <div class="col-12">
                            <h6 class="text-info mb-3">
                                <i class="bi bi-house"></i> Adresgegevens
                            </h6>
                        </div>
                        <div class="col-md-8 mb-3">
                            <label for="address" class="form-label text-light">Straat + Huisnummer</label>
                            <input type="text" class="form-control bg-dark border-secondary text-light" id="address" value="${customer.address || ''}" placeholder="Hoofdstraat 123">
                        </div>
                        <div class="col-md-4 mb-3">
                            <label for="postal_code" class="form-label text-light">Postcode</label>
                            <input type="text" class="form-control bg-dark border-secondary text-light" id="postal_code" value="${customer.district || ''}" placeholder="1234 AB">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="city" class="form-label text-light">Stad</label>
                            <input type="text" class="form-control bg-dark border-secondary text-light" id="city" value="${customer.city || ''}" placeholder="Amsterdam">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="country" class="form-label text-light">Land</label>
                            <input type="text" class="form-control bg-dark border-secondary text-light" id="country" value="${customer.country || 'Nederland'}" placeholder="Nederland">
                        </div>
                    </div>

                    <!-- Preferences -->
                    <div class="row mb-4">
                        <div class="col-12">
                            <h6 class="text-info mb-3">
                                <i class="bi bi-gear"></i> Voorkeuren
                            </h6>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="language" class="form-label text-light">Taal</label>
                            <select class="form-select bg-dark border-secondary text-light" id="language">
                                <option value="nl" ${(customer.language || 'nl') === 'nl' ? 'selected' : ''}>Nederlands</option>
                                <option value="en" ${customer.language === 'en' ? 'selected' : ''}>English</option>
                                <option value="de" ${customer.language === 'de' ? 'selected' : ''}>Deutsch</option>
                                <option value="fr" ${customer.language === 'fr' ? 'selected' : ''}>Français</option>
                            </select>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <button type="submit" class="btn btn-info">
                                <i class="bi bi-save me-2"></i>Profiel Opslaan
                            </button>
                        </div>
                        <div class="col-md-6 text-end">
                            <button type="button" class="btn btn-warning" data-bs-toggle="modal" data-bs-target="#changePasswordModal">
                                <i class="bi bi-shield-lock me-2"></i>Wachtwoord Wijzigen
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- Change Password Modal -->
        <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-labelledby="changePasswordModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark">
                    <div class="modal-header border-secondary">
                        <h5 class="modal-title text-light" id="changePasswordModalLabel">
                            <i class="bi bi-shield-lock text-warning me-2"></i>Wachtwoord Wijzigen
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="passwordForm">
                            <div class="mb-3">
                                <label for="modal_current_password" class="form-label text-light">Huidig Wachtwoord *</label>
                                <input type="password" class="form-control bg-dark border-secondary text-light" id="modal_current_password" required>
                            </div>
                            <div class="mb-3">
                                <label for="modal_new_password" class="form-label text-light">Nieuw Wachtwoord *</label>
                                <input type="password" class="form-control bg-dark border-secondary text-light" id="modal_new_password" minlength="6" required>
                                <div class="form-text text-muted">Minimaal 6 tekens</div>
                            </div>
                            <div class="mb-3">
                                <label for="modal_confirm_password" class="form-label text-light">Bevestig Nieuw Wachtwoord *</label>
                                <input type="password" class="form-control bg-dark border-secondary text-light" id="modal_confirm_password" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer border-secondary">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-2"></i>Annuleren
                        </button>
                        <button type="button" class="btn btn-warning" onclick="changePassword()">
                            <i class="bi bi-check-circle me-2"></i>Wachtwoord Wijzigen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Add form submit handler
    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateProfile();
    });
}

// Update profile information
function updateProfile() {
    // Collect basic profile data (no password)
    const formData = {
        username: document.getElementById('username').value,
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        postal_code: document.getElementById('postal_code').value,
        city: document.getElementById('city').value,
        country: document.getElementById('country').value,
        language: document.getElementById('language').value
    };

    // Basic validation
    if (!formData.username || !formData.first_name || !formData.last_name || !formData.email) {
        showToast('error', 'Fout!', 'Gebruikersnaam, voornaam, achternaam en email zijn verplicht.');
        return;
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
        showToast('error', 'Fout!', 'Email adres is niet geldig.');
        return;
    }
    
    fetch('/customer/profile-update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.redirected) {
            // Handle redirect for success/error messages
            const url = new URL(response.url);
            const success = url.searchParams.get('success');
            const error = url.searchParams.get('error');
            
            if (success) {
                showToast('success', 'Gelukt!', decodeURIComponent(success));
            } else if (error) {
                showToast('error', 'Fout!', decodeURIComponent(error));
            }
        } else {
            return response.json();
        }
    })
    .then(data => {
        if (data && data.success) {
            showToast('success', 'Profiel bijgewerkt!', 'Je wijzigingen zijn opgeslagen.');
        } else if (data && !data.success) {
            showToast('error', 'Fout!', data.message);
        }
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        showToast('error', 'Fout!', 'Er is een fout opgetreden bij het bijwerken van je profiel.');
    });
}

// Change password function
function changePassword() {
    const currentPassword = document.getElementById('modal_current_password').value;
    const newPassword = document.getElementById('modal_new_password').value;
    const confirmPassword = document.getElementById('modal_confirm_password').value;

    // Password validation
    if (!currentPassword) {
        showToast('error', 'Fout!', 'Huidig wachtwoord is vereist.');
        return;
    }
    if (!newPassword) {
        showToast('error', 'Fout!', 'Nieuw wachtwoord is vereist.');
        return;
    }
    if (newPassword.length < 6) {
        showToast('error', 'Fout!', 'Nieuw wachtwoord moet minstens 6 tekens bevatten.');
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast('error', 'Fout!', 'Wachtwoorden komen niet overeen.');
        return;
    }

    const passwordData = {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
    };
    
    fetch('/customer/change-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Wachtwoord gewijzigd!', data.message);
            // Clear password fields and close modal
            document.getElementById('modal_current_password').value = '';
            document.getElementById('modal_new_password').value = '';
            document.getElementById('modal_confirm_password').value = '';
            bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
        } else {
            showToast('error', 'Fout!', data.message);
        }
    })
    .catch(error => {
        console.error('Error changing password:', error);
        showToast('error', 'Fout!', 'Er is een fout opgetreden bij het wijzigen van je wachtwoord.');
    });
}
