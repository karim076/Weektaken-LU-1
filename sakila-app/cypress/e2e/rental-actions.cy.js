/**
 * Rental Actions Integration Tests
 * Tests rental-specific actions like payment, cancellation, return, and extension
 */

describe('Rental Actions Integration Tests', () => {
  beforeEach(() => {
    // Mock rental data for testing
    cy.intercept('GET', '/customer/rentals-data', {
      success: true,
      rentals: [
        {
          rental_id: 1,
          film_id: 1,
          film_title: 'Test Movie',
          category: 'Action',
          rental_date: '2025-09-15',
          return_date: null,
          amount: 5.99,
          rental_rate: 2.99,
          status: 'pending'
        },
        {
          rental_id: 2,
          film_id: 2,
          film_title: 'Another Movie',
          category: 'Comedy',
          rental_date: '2025-09-10',
          return_date: null,
          amount: 4.99,
          rental_rate: 2.99,
          status: 'rented'
        }
      ],
      stats: {
        pending: 1,
        paid: 0,
        rented: 1,
        returned: 0,
        paid_amount: 5.99,
        total_spent: 10.98
      }
    }).as('getRentals')

    // Intercept rental action APIs
    cy.intercept('POST', '/customer/rentals/*/pay').as('payRental')
    cy.intercept('DELETE', '/customer/rentals/*/cancel').as('cancelRental')
    cy.intercept('POST', '/customer/rentals/*/return').as('returnRental')
    cy.intercept('POST', '/customer/rentals/*/extend').as('extendRental')
  })

  describe('Payment Actions', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getRentals')
    })

    it('should display payment button for pending rentals', () => {
      cy.get('[data-rental-id="1"]').should('contain.text', 'Te Betalen')
      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').should('contain.text', 'Nu Betalen')
    })

    it('should handle successful payment', () => {
      cy.intercept('POST', '/customer/rentals/1/pay', {
        success: true,
        message: 'Payment successful'
      }).as('payRentalSuccess')

      // Find and click payment button
      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Nu Betalen').click()

      // Confirm payment in dialog
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.waitForApiResponse('@payRentalSuccess')
      cy.checkToastMessage('success', 'Betaling Gelukt')
    })

    it('should handle payment failure', () => {
      cy.intercept('POST', '/customer/rentals/1/pay', {
        success: false,
        message: 'Payment failed - insufficient funds'
      }).as('payRentalFail')

      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Nu Betalen').click()

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.waitForApiResponse('@payRentalFail')
      cy.checkToastMessage('error', 'Betaling Mislukt')
    })

    it('should handle payment cancellation by user', () => {
      // Set up the stub BEFORE triggering the action
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(false)
      })

      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Nu Betalen').click()

      // No API call should be made
      cy.get('@payRental.all').should('have.length', 0)
    })
  })

  describe('Cancellation Actions', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getRentals')
    })

    it('should display cancel button for pending rentals', () => {
      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').should('contain.text', 'Annuleren')
    })

    it('should handle successful cancellation', () => {
      cy.intercept('DELETE', '/customer/rentals/1/cancel', {
        success: true,
        message: 'Rental cancelled successfully'
      }).as('cancelRentalSuccess')

      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Annuleren').click()

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.waitForApiResponse('@cancelRentalSuccess')
      cy.checkToastMessage('success', 'Geannuleerd')
    })

    it('should handle cancellation failure', () => {
      cy.intercept('DELETE', '/customer/rentals/1/cancel', {
        success: false,
        message: 'Cannot cancel rental - payment already processed'
      }).as('cancelRentalFail')

      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Annuleren').click()

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.waitForApiResponse('@cancelRentalFail')
      cy.checkToastMessage('error', 'Fout')
    })
  })

  describe('Return Actions', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getRentals')
    })

    it('should display return button for rented items', () => {
      cy.get('[data-rental-id="2"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').should('contain.text', 'Inleveren')
    })

    it('should handle successful return', () => {
      cy.intercept('POST', '/customer/rentals/2/return', {
        success: true,
        message: 'Movie returned successfully'
      }).as('returnRentalSuccess')

      cy.get('[data-rental-id="2"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Inleveren').click()

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.waitForApiResponse('@returnRentalSuccess')
      cy.checkToastMessage('success', 'Ingeleverd')
    })

    it('should handle return failure', () => {
      cy.intercept('POST', '/customer/rentals/2/return', {
        success: false,
        message: 'Return failed - item already returned'
      }).as('returnRentalFail')

      cy.get('[data-rental-id="2"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Inleveren').click()

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.waitForApiResponse('@returnRentalFail')
      cy.checkToastMessage('error', 'Inleveren Mislukt')
    })
  })

  describe('Extension Actions', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getRentals')
    })

    it('should display extend button for rented items', () => {
      cy.get('[data-rental-id="2"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').should('contain.text', 'Verlengen')
    })

    it('should handle successful extension', () => {
      cy.intercept('POST', '/customer/rentals/2/extend', {
        success: true,
        message: 'Rental extended successfully'
      }).as('extendRentalSuccess')

      cy.get('[data-rental-id="2"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Verlengen').click()

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.waitForApiResponse('@extendRentalSuccess')
      cy.checkToastMessage('success', 'Verlengd')
    })

    it('should handle extension failure', () => {
      cy.intercept('POST', '/customer/rentals/2/extend', {
        success: false,
        message: 'Extension failed - maximum extensions reached'
      }).as('extendRentalFail')

      cy.get('[data-rental-id="2"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Verlengen').click()

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.waitForApiResponse('@extendRentalFail')
      cy.checkToastMessage('error', 'Verlengen Mislukt')
    })
  })

  describe('Content Refresh After Actions', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getRentals')
    })

    it('should refresh rental list after successful payment', () => {
      cy.intercept('POST', '/customer/rentals/1/pay', {
        success: true,
        message: 'Payment successful'
      }).as('payRentalSuccess')

      // Mock updated rental data after payment
      cy.intercept('GET', '/customer/rentals-data', {
        success: true,
        rentals: [
          {
            rental_id: 1,
            film_id: 1,
            film_title: 'Test Movie',
            category: 'Action',
            rental_date: '2025-09-15',
            return_date: null,
            amount: 5.99,
            rental_rate: 2.99,
            status: 'paid' // Status changed after payment
          }
        ],
        stats: {
          pending: 0,
          paid: 1,
          rented: 0,
          returned: 0,
          paid_amount: 0,
          total_spent: 5.99
        }
      }).as('getUpdatedRentals')

      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Nu Betalen').click()

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.waitForApiResponse('@payRentalSuccess')
      cy.waitForApiResponse('@getUpdatedRentals')

      // Check that the status has been updated
      cy.checkRentalStatus(1, 'Betaald')
    })

    it('should update statistics after actions', () => {
      // Check initial stats
      cy.get('.rentals-stats-row').should('contain.text', '1') // pending count

      cy.intercept('POST', '/customer/rentals/1/pay', {
        success: true,
        message: 'Payment successful'
      }).as('payRentalSuccess')

      cy.intercept('GET', '/customer/rentals-data', {
        success: true,
        rentals: [],
        stats: {
          pending: 0, // Updated count
          paid: 1,
          rented: 0,
          returned: 0,
          paid_amount: 0,
          total_spent: 5.99
        }
      }).as('getUpdatedStats')

      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Nu Betalen').click()

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.waitForApiResponse('@payRentalSuccess')
      cy.waitForApiResponse('@getUpdatedStats')

      // Check updated stats - pending should be 0, paid should be 1
      cy.get('.rentals-stats-row').find('[data-stat="pending"]').should('contain.text', '0')
      cy.get('.rentals-stats-row').find('[data-stat="paid"]').should('contain.text', '1')
    })
  })

  describe('Status Badge Verification', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getRentals')
    })

    it('should display correct status badges', () => {
      // Check pending status
      cy.get('[data-rental-id="1"]').find('.rental-status').should('contain.text', 'Te Betalen')
      cy.get('[data-rental-id="1"]').find('.rental-status').should('have.class', 'bg-warning')

      // Check rented status
      cy.get('[data-rental-id="2"]').find('.rental-status').should('contain.text', 'Actief Gehuurd')
      cy.get('[data-rental-id="2"]').find('.rental-status').should('have.class', 'bg-primary')
    })

    it('should show correct action buttons based on status', () => {
      // Pending rental should have pay and cancel options
      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').should('contain.text', 'Nu Betalen')
      cy.get('.dropdown-menu').should('contain.text', 'Annuleren')

      // Close dropdown
      cy.get('body').click()

      // Rented item should have return and extend options
      cy.get('[data-rental-id="2"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').should('contain.text', 'Inleveren')
      cy.get('.dropdown-menu').should('contain.text', 'Verlengen')
    })
  })

  describe('Error Scenarios', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.navigateToDashboardSection('rentals')
      cy.waitForApiResponse('@getRentals')
    })

    it('should handle network errors during actions', () => {
      cy.intercept('POST', '/customer/rentals/1/pay', { forceNetworkError: true }).as('payNetworkError')

      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Nu Betalen').click()

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.checkToastMessage('error', 'fout opgetreden')
    })

    it('should handle server errors gracefully', () => {
      cy.intercept('POST', '/customer/rentals/1/pay', {
        statusCode: 500,
        body: { success: false, message: 'Internal server error' }
      }).as('payServerError')

      cy.get('[data-rental-id="1"]').find('.dropdown-toggle').click()
      cy.get('.dropdown-menu').contains('Nu Betalen').click()

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.waitForApiResponse('@payServerError')
      cy.checkToastMessage('error', 'Betaling Mislukt')
    })
  })
})
