// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for logging in
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login')
  cy.get('input[name="username"]').type(username)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  
  // Wait for redirect to dashboard
  cy.url().should('include', '/dashboard')
})

// Custom command for logging in as test user
Cypress.Commands.add('loginAsTestUser', () => {
  const testUser = Cypress.env('testUser')
  cy.login(testUser.username, testUser.password)
})

// Custom command for logging in as admin
Cypress.Commands.add('loginAsAdmin', () => {
  const adminUser = Cypress.env('adminUser')
  cy.login(adminUser.username, adminUser.password)
})

// Custom command for creating a test user (if registration is available)
Cypress.Commands.add('createTestUser', () => {
  const testUser = Cypress.env('testUser')
  
  cy.visit('/register')
  cy.get('input[name="username"]').type(testUser.username)
  cy.get('input[name="email"]').type(testUser.email)
  cy.get('input[name="password"]').type(testUser.password)
  cy.get('input[name="confirm_password"]').type(testUser.password)
  cy.get('button[type="submit"]').click()
})

// Custom command for navigating dashboard sections
Cypress.Commands.add('navigateToDashboardSection', (section) => {
  // Use specific selector for navigation links in sidebar
  cy.get('.sidebar .nav-link').contains(section === 'dashboard' ? 'Dashboard' : 
                                        section === 'profile' ? 'Mijn Profiel' : 
                                        section === 'rentals' ? 'Mijn Verhuur' : section).click()
  
  // Wait for section to become visible
  cy.get(`#${section}-section`).should('be.visible')
  cy.get(`#${section}-section`).should('not.have.class', 'd-none')
})

// Custom command for waiting for API response
Cypress.Commands.add('waitForApiResponse', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout })
})

// Custom command for checking toast notifications
Cypress.Commands.add('checkToastMessage', (type, message) => {
  cy.get('.toast').should('be.visible')
  if (type === 'success') {
    cy.get('.toast.bg-success').should('contain.text', message)
  } else if (type === 'error') {
    cy.get('.toast.bg-danger').should('contain.text', message)
  }
})

// Custom command for dismissing modals
Cypress.Commands.add('dismissModal', (modalId) => {
  cy.get(`#${modalId}`).should('be.visible')
  
  // Try clicking the close button first
  cy.get(`#${modalId} .btn-close, #${modalId} [data-bs-dismiss="modal"]`).first().click()
  
  // Wait for modal to close with timeout
  cy.get(`#${modalId}`, { timeout: 5000 }).should('not.be.visible')
})

// Custom command for taking screenshot with timestamp
Cypress.Commands.add('screenshotWithTimestamp', (name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  cy.screenshot(`${name}-${timestamp}`)
})

// Custom command for checking rental status
Cypress.Commands.add('checkRentalStatus', (rentalId, expectedStatus) => {
  cy.get(`[data-rental-id="${rentalId}"]`)
    .find('.rental-status')
    .should('contain.text', expectedStatus)
})

// Custom command for checking responsive design
Cypress.Commands.add('checkResponsive', () => {
  // Test mobile view
  cy.viewport('iphone-x')
  cy.wait(500)
  
  // Test tablet view
  cy.viewport('ipad-2')
  cy.wait(500)
  
  // Test desktop view
  cy.viewport(1280, 720)
  cy.wait(500)
})

// Custom command for logging in with valid credentials
Cypress.Commands.add('loginWithValidCredentials', () => {
  cy.login('hanserief12', 'Suiker123')
})
