// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global before hook for all tests
before(() => {
  // Set up any global configuration here
  cy.log('Starting Cypress test suite')
})

// Global beforeEach hook
beforeEach(() => {
  // Clear cookies and local storage before each test
  cy.clearCookies()
  cy.clearLocalStorage()
  
  // Set viewport size
  cy.viewport(1280, 720)
})

// Global afterEach hook
afterEach(() => {
  // Clean up after each test if needed
  cy.log('Test completed')
})

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions (like console errors)
  if (err.message.includes('Script error')) {
    return false
  }
  
  // Let other errors fail the test
  return true
})
