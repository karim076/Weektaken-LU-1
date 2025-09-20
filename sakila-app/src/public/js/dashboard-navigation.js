/**
 * Dashboard Navigation Handler
 * Manages navigation between dashboard sections and URL hash routing
 */

// Navigation state management
let currentSection = 'dashboard';

// Initialize navigation system
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const sections = document.querySelectorAll('.content-section');
    
    console.log('Dashboard loaded, found', navLinks.length, 'nav links and', sections.length, 'sections');
    
    // Function to show a specific section
    function showSection(sectionName) {
        console.log('Showing section:', sectionName);
        currentSection = sectionName;
        
        // Update active nav link
        navLinks.forEach(l => {
            l.classList.remove('active');
            if (l.getAttribute('data-section') === sectionName) {
                l.classList.add('active');
            }
        });
        
        // Show/hide sections
        sections.forEach(section => {
            if (section.id === sectionName + '-section') {
                section.classList.remove('d-none');
                console.log('Showing section:', section.id);
                
                // Load content if needed
                if (sectionName === 'rentals' && !section.dataset.loaded) {
                    console.log('Loading rentals content...');
                    loadRentalsContent();
                    section.dataset.loaded = 'true';
                } else if (sectionName === 'profile' && !section.dataset.loaded) {
                    console.log('Loading profile content...');
                    loadProfileContent();
                    section.dataset.loaded = 'true';
                } else if (sectionName === 'staff-customers' && !section.dataset.loaded) {
                    console.log('Loading staff customers content...');
                    if (window.staffCustomerManager) {
                        window.staffCustomerManager.loadCustomers();
                    }
                    section.dataset.loaded = 'true';
                } else if (sectionName === 'staff-rental' && !section.dataset.loaded) {
                    console.log('Loading staff rental content...');
                    if (window.staffRentalManager) {
                        window.staffRentalManager.loadRentalData();
                    }
                    section.dataset.loaded = 'true';
                }
            } else {
                section.classList.add('d-none');
            }
        });
    }
    
    // Check for URL hash on load
    function checkUrlHash() {
        const hash = window.location.hash.substring(1);
        // Extend to support staff sections
        const validSections = ['dashboard', 'rentals', 'profile', 'staff-dashboard', 'staff-customers', 'staff-rental', 'quick-rental'];
        if (hash && validSections.includes(hash)) {
            showSection(hash);
        } else {
            // Default based on user role or dashboard type
            const defaultSection = document.getElementById('staff-dashboard-section') ? 'staff-dashboard' : 'dashboard';
            showSection(defaultSection);
        }
    }
    
    // Add click handlers for navigation
    navLinks.forEach(link => {
        const sectionName = link.getAttribute('data-section');
        if (sectionName) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Navigation clicked:', sectionName);
                
                // Update URL hash
                window.location.hash = sectionName;
                showSection(sectionName);
            });
        }
    });
    
    // Also add handlers for buttons with data-section
    const sectionButtons = document.querySelectorAll('[data-section]');
    sectionButtons.forEach(button => {
        const sectionName = button.getAttribute('data-section');
        if (sectionName && !button.classList.contains('nav-link')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Section button clicked:', sectionName);
                
                // Update URL hash
                window.location.hash = sectionName;
                showSection(sectionName);
            });
        }
    });
    
    // Handle browser back/forward buttons
    window.addEventListener('hashchange', checkUrlHash);
    
    // Initial load
    checkUrlHash();
    
    // Expose showSection globally for other scripts
    window.showSection = showSection;
});
