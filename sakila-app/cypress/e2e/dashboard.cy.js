/**
 * Dashboard Integration Tests
 * Tests core dashboard functionality including navigation, data loading, and user interactions
 */

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    // Intercept API calls for better test control
    cy.intercept('GET', '/customer/rentals-data').as('getRentals')
    cy.intercept('GET', '/customer/profile-data').as('getProfile')
    cy.intercept('POST', '/customer/profile-update').as('updateProfile')
    cy.intercept('POST', '/customer/change-password').as('changePassword')
  })

  describe('Authentication and Initial Load', () => {
    it('should redirect to login when not authenticated', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
    })

    it('should load dashboard after successful login', () => {
      cy.loginAsTestUser()
      
      // Check that we're on the dashboard
      cy.url().should('include', '/dashboard')
      
      // Check dashboard elements are present
      cy.get('.sidebar').should('be.visible')
      cy.get('.main-content').should('be.visible')
      cy.get('#dashboard-section').should('be.visible')
      
      // Check that customer dashboard is loaded
      cy.get('.user-profile').should('be.visible')
      cy.get('.welcome-card').should('contain.text', 'Goedemorgen')
    })
  })

  describe('Dashboard Navigation', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
    })

    it('should navigate between dashboard sections', () => {
      // Test navigation to rentals section
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getRentals')
      
      // Test navigation to profile section
      cy.navigateToDashboardSection('profile')
      cy.waitForApiResponse('@getProfile')
      
      // Test navigation back to dashboard
      cy.navigateToDashboardSection('dashboard')
    })

    it('should update URL hash when navigating sections', () => {
      cy.navigateToDashboardSection('rentals')
      cy.url().should('include', '#rentals')
      
      cy.navigateToDashboardSection('profile')
      cy.url().should('include', '#profile')
      
      cy.navigateToDashboardSection('dashboard')
      cy.url().should('include', '#dashboard')
    })

    it('should handle browser back/forward navigation', () => {
      cy.navigateToDashboardSection('rentals')
      cy.navigateToDashboardSection('profile')
      
      // Test browser back
      cy.go('back')
      cy.url().should('include', '#rentals')
      cy.get('#rentals-section').should('be.visible')
      
      // Test browser forward
      cy.go('forward')
      cy.url().should('include', '#profile')
      cy.get('#profile-section').should('be.visible')
    })

    it('should maintain active navigation state', () => {
      cy.navigateToDashboardSection('rentals')
      cy.get('.sidebar .nav-link').contains('Mijn Verhuur').should('have.class', 'active')
      cy.get('.sidebar .nav-link').contains('Dashboard').should('not.have.class', 'active')
      
      cy.navigateToDashboardSection('profile')
      cy.get('.sidebar .nav-link').contains('Mijn Profiel').should('have.class', 'active')
      cy.get('.sidebar .nav-link').contains('Mijn Verhuur').should('not.have.class', 'active')
    })
  })

  describe('Dashboard Content Loading', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
    })

    it('should load and display welcome information', () => {
      cy.get('.welcome-card').should('be.visible')
      cy.get('.welcome-date').should('be.visible')
      cy.get('.quick-action-btn').should('have.length.greaterThan', 0)
    })

    it('should display user information in sidebar', () => {
      cy.get('.user-profile').should('be.visible')
      cy.get('.user-avatar').should('be.visible')
      cy.get('.user-profile h5').should('not.be.empty')
    })

    it('should show tips and recommendations', () => {
      cy.get('.tips-section').should('be.visible')
      cy.get('.tip-item').should('have.length.greaterThan', 0)
    })
  })

  describe('Rentals Section', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
    })

    it('should load rentals data when section is accessed', () => {
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getRentals')
      
      // Check that rentals content is loaded
      cy.get('#rentals-content').should('not.contain.text', 'laden...')
    })

    it('should display rental statistics', () => {
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getRentals')
      
      // Wait for rentals content to be rendered
      cy.get('.rentals-stats-row').should('be.visible')
      
      // Check for exactly 6 stats cards in the rentals section
      cy.get('#rentals-section .stat-card').should('have.length', 6)
    })

    it('should handle empty rentals state', () => {
      // Mock empty rentals response
      cy.intercept('GET', '/customer/rentals-data', {
        success: true,
        rentals: [],
        stats: {
          pending: 0,
          paid: 0,
          rented: 0,
          returned: 0,
          paid_amount: 0,
          total_spent: 0
        }
      }).as('getEmptyRentals')
      
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getEmptyRentals')
      
      cy.get('#rentals-content').should('contain.text', 'Geen verhuur gevonden')
      cy.get('#rentals-content').should('contain.text', 'Huur je eerste film')
    })

    it('should handle rentals loading error', () => {
      // Mock API error
      cy.intercept('GET', '/customer/rentals-data', {
        statusCode: 500,
        body: { success: false, message: 'Server error' }
      }).as('getRentalsError')
      
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getRentalsError')
      
      // Check for error message (partial match)
      cy.get('#rentals-content').should('contain.text', 'Fout bij het laden van verhuurgegevens')
    })
  })

  describe('Profile Section', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
    })

    it('should load profile data when section is accessed', () => {
      cy.navigateToDashboardSection('profile')
      cy.waitForApiResponse('@getProfile')
      
      // Check that profile form is loaded
      cy.get('#profileForm').should('be.visible')
    })

    it('should display profile form with user data', () => {
      // Mock profile data
      cy.intercept('GET', '/customer/profile-data', {
        success: true,
        customer: {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          username: 'testuser',
          phone: '06-12345678'
        }
      }).as('getProfileData')
      
      cy.navigateToDashboardSection('profile')
      cy.waitForApiResponse('@getProfileData')
      
      // Check form fields are populated
      cy.get('#first_name').should('have.value', 'Test')
      cy.get('#last_name').should('have.value', 'User')
      cy.get('#email').should('have.value', 'test@example.com')
      cy.get('#username').should('have.value', 'testuser')
    })

    it('should validate required fields on profile update', () => {
      cy.navigateToDashboardSection('profile')
      cy.waitForApiResponse('@getProfile')
      
      // Clear required fields
      cy.get('#first_name').clear()
      cy.get('#email').clear()
      
      // Try to submit
      cy.get('#profileForm').submit()
      
      // Should show validation error
      cy.checkToastMessage('error', 'verplicht')
    })

    it('should handle profile update success', () => {
      cy.intercept('POST', '/customer/profile-update', {
        success: true,
        message: 'Profile updated successfully'
      }).as('updateProfileSuccess')
      
      cy.navigateToDashboardSection('profile')
      cy.waitForApiResponse('@getProfile')
      
      // Update a field
      cy.get('#phone').clear().type('06-87654321')
      
      // Submit form
      cy.get('#profileForm').submit()
      cy.waitForApiResponse('@updateProfileSuccess')
      
      // Should show success message
      cy.checkToastMessage('success', 'bijgewerkt')
    })

    it('should have password change functionality', () => {
      cy.navigateToDashboardSection('profile')
      cy.waitForApiResponse('@getProfile')
      
      // Check that change password button or functionality exists
      cy.get('[data-bs-target="#changePasswordModal"], .change-password-btn, button').contains(/wachtwoord|password/i).should('exist')
      
      // Test that the profile section is fully loaded and functional
      cy.get('#profileForm').should('be.visible')
      cy.get('#username').should('be.visible')
      cy.get('#email').should('be.visible')
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
    })

    it('should be responsive on different screen sizes', () => {
      cy.checkResponsive()
      
      // Test that sidebar adapts on mobile
      cy.viewport('iphone-x')
      cy.get('.sidebar').should('be.visible')
      
      // Test that content adapts on tablet
      cy.viewport('ipad-2')
      cy.get('.main-content').should('be.visible')
      
      // Test desktop layout
      cy.viewport(1280, 720)
      cy.get('.col-lg-3').should('be.visible')
      cy.get('.col-lg-9').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
    })

    it('should handle network errors gracefully', () => {
      // Simulate network error
      cy.intercept('GET', '/customer/rentals-data', { forceNetworkError: true }).as('networkError')
      
      cy.navigateToDashboardSection('rentals')
      
      // Should show error message
      cy.get('#rentals-content').should('contain.text', 'fout opgetreden')
    })

    it('should handle JavaScript errors without breaking', () => {
      // Visit dashboard and trigger potential JS errors
      cy.window().then((win) => {
        // Trigger some edge cases
        win.showSection('nonexistent')
        win.showToast('invalid', 'Test', 'Message')
      })
      
      // Dashboard should still be functional
      cy.get('.sidebar').should('be.visible')
      cy.navigateToDashboardSection('rentals')
    })
  })

  describe('Performance', () => {
    it('should load dashboard within acceptable time', () => {
      const startTime = Date.now()
      
      cy.loginAsTestUser()
      
      cy.then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(5000) // 5 seconds max
      })
    })

    it('should lazy load section content', () => {
      cy.loginAsTestUser()
      
      // Initially, rentals content should not be loaded
      cy.get('#rentals-section[data-loaded="false"], #rentals-section:not([data-loaded])').should('exist')
      
      // After navigation, it should be marked as loaded
      cy.navigateToDashboardSection('rentals')
      cy.get('#rentals-section[data-loaded="true"]').should('exist')
    })
  })
})
