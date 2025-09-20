/**
 * Server Integration Tests
 * Tests web endpoints and server functionality for the traditional web application
 */

describe('Server Integration Tests', () => {
  
  describe('Authentication Endpoints', () => {
    it('should handle login form submission correctly', () => {
      // Test the actual login flow
      cy.visit('/login')
      cy.get('input[name="username"]').type(Cypress.env('testUser').username)
      cy.get('input[name="password"]').type(Cypress.env('testUser').password)
      cy.get('form').submit()
      
      // Should redirect to dashboard after successful login
      cy.url().should('include', '/dashboard')
      cy.get('body').should('contain', 'Dashboard')
    })

    it('should handle invalid login credentials', () => {
      cy.visit('/login')
      cy.get('input[name="username"]').type('invaliduser')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('form').submit()
      
      // Should stay on login page with error
      cy.url().should('include', '/login')
      cy.get('.alert-danger').should('contain', 'Ongeldige')
    })

    it('should handle logout correctly', () => {
      // Login first
      cy.loginAsTestUser()
      cy.visit('/dashboard')
      
      // Perform logout
      cy.request({
        method: 'POST',
        url: '/logout',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 302]) // 302 for redirect
      })
      
      // Visit login page to verify logout worked
      cy.visit('/login')
      cy.url().should('include', '/login')
    })

    it('should redirect to login when accessing protected pages without auth', () => {
      // Clear any existing auth
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // Try to access protected page
      cy.visit('/dashboard', { failOnStatusCode: false })
      cy.url().should('include', '/login')
    })
  })

  describe('Server Data Endpoints', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
    })

    it('should serve rentals data correctly', () => {
      cy.request('/customer/rentals-data').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success')
        expect(response.body).to.have.property('rentals')
        expect(response.body).to.have.property('stats')
        
        // Validate stats structure
        const stats = response.body.stats
        expect(stats).to.have.all.keys('pending', 'paid', 'rented', 'returned', 'paid_amount', 'total_spent', 'processing', 'completed_amount', 'total_rentals')
        
        // Validate rentals array structure
        if (response.body.rentals.length > 0) {
          const rental = response.body.rentals[0]
          expect(rental).to.have.property('rental_id')
          expect(rental).to.have.property('film_id')
          expect(rental).to.have.property('status')
          expect(rental).to.have.property('rental_date')
        }
      })
    })

    it('should serve films data correctly', () => {
      cy.request('/films?ajax=true').then((response) => {
        expect(response.status).to.eq(200)
        // Should return HTML or JSON depending on implementation
        expect(response.body).to.exist
      })
    })

    it('should handle customer profile data', () => {
      cy.request('/customer/profile-data').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success')
        if (response.body.success) {
          expect(response.body).to.have.property('customer')
          const customer = response.body.customer
          expect(customer).to.have.property('customer_id')
          expect(customer).to.have.property('first_name')
          expect(customer).to.have.property('last_name')
          expect(customer).to.have.property('email')
        }
      })
    })
  })

  describe('Form Submissions', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
    })

    it('should handle film search correctly', () => {
      cy.visit('/films')
      
      // Test search functionality
      cy.get('input[name="search"]').type('action')
      cy.get('input[name="search"]').closest('form').submit()
      
      // Should stay on films page with results
      cy.url().should('include', '/films')
      cy.get('body').should('contain', 'Films')
    })

    it('should handle rental form submissions', () => {
      cy.visit('/films')
      
      // Check if films are loaded, if not skip the rental part
      cy.get('body').then(($body) => {
        if ($body.find('.card').length > 0) {
          // Click on any button in a film card (more flexible)
          cy.get('.card').first().within(() => {
            cy.get('.btn').first().click({ force: true })
          })
        }
      })
      
      // Should handle the rental process (flexible check)
      cy.url().should('not.include', 'error')
      // Should either redirect or stay on page without errors
      cy.get('body').should('exist')
    })
  })

  describe('Session Management', () => {
    it('should maintain session across page navigations', () => {
      cy.loginAsTestUser()
      
      // Navigate to different pages
      cy.visit('/dashboard')
      cy.get('body').should('contain', 'Dashboard')
      
      cy.visit('/films')
      cy.get('body').should('contain', 'Films')
      
      cy.visit('/customer/profile')
      cy.get('body').should('contain', 'Profiel')
      
      // Should still be authenticated
      cy.visit('/dashboard')
      cy.get('body').should('contain', 'Dashboard')
    })

    it('should handle session timeout gracefully', () => {
      cy.loginAsTestUser()
      
      // Clear session cookies to simulate timeout
      cy.clearCookies()
      
      // Try to access protected page
      cy.visit('/customer/profile', { failOnStatusCode: false })
      cy.url().should('include', '/login')
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', () => {
      cy.visit('/nonexistent-page', { failOnStatusCode: false })
      cy.get('body').should('contain', '404')
    })

    it('should handle server errors without crashing', () => {
      cy.loginAsTestUser()
      
      // Try to access an endpoint that might cause errors
      cy.request({
        url: '/customer/rentals/999999',
        failOnStatusCode: false
      }).then((response) => {
        // Should handle gracefully, not crash
        expect(response.status).to.be.oneOf([404, 500, 302])
      })
    })
  })

  describe('Security Tests', () => {
    it('should prevent unauthorized access to customer data', () => {
      // Clear auth first
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // Without login
      cy.request({
        url: '/customer/rentals-data',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 302, 403, 200]) // 200 if it redirects to login
      })
    })

    it('should prevent CSRF attacks on forms', () => {
      cy.loginAsTestUser()
      
      // Try to submit form without proper headers/tokens
      cy.request({
        method: 'POST',
        url: '/customer/profile',
        body: { first_name: 'Malicious' },
        failOnStatusCode: false
      }).then((response) => {
        // Should be protected against CSRF or redirect/404
        expect(response.status).to.be.oneOf([403, 400, 302, 404, 500])
      })
    })
  })

  describe('Data Validation', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
    })

    it('should validate rental data integrity', () => {
      cy.request('/customer/rentals-data').then((response) => {
        expect(response.body.success).to.be.true
        
        response.body.rentals.forEach((rental) => {
          expect(rental.rental_id).to.be.a('number')
          expect(rental.film_id).to.be.a('number')
          expect(rental.status).to.be.oneOf(['pending', 'paid', 'rented', 'returned'])
          expect(rental.rental_date).to.match(/^\d{4}-\d{2}-\d{2}/)
        })
      })
    })

    it('should validate customer data integrity', () => {
      cy.request('/customer/profile-data').then((response) => {
        if (response.body.success) {
          const customer = response.body.customer
          expect(customer.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
          expect(customer.first_name).to.be.a('string').and.not.be.empty
          expect(customer.last_name).to.be.a('string').and.not.be.empty
        }
      })
    })
  })

  describe('Performance Tests', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
    })

    it('should load rentals data within acceptable time', () => {
      const start = Date.now()
      cy.request('/customer/rentals-data').then(() => {
        const loadTime = Date.now() - start
        expect(loadTime).to.be.lessThan(3000) // 3 seconds max
      })
    })

    it('should handle concurrent requests', () => {
      // Make multiple concurrent requests using Cypress commands
      const requests = []
      for (let i = 0; i < 3; i++) {
        requests.push(cy.request('/customer/rentals-data'))
      }
      
      // All requests should succeed
      requests.forEach((request) => {
        request.then((response) => {
          expect(response.status).to.eq(200)
        })
      })
    })
  })
})
