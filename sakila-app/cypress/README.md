# Cypress Test Suite - README

## Overview

This Cypress test suite provides comprehensive end-to-end testing for the Sakila dashboard application, designed for CI/CD pipeline integration to ensure application integrity.

## Test Coverage

### 🎯 Core Functionality Tests (`dashboard.cy.js`)
- **Authentication Flow**: Login/logout functionality
- **Navigation**: Dashboard section switching
- **Content Loading**: Dynamic content rendering
- **API Integration**: Data fetching and display
- **Error Handling**: Graceful failure scenarios
- **Responsive Design**: Mobile and desktop layouts

### 💰 Rental Actions Tests (`rental-actions.cy.js`)
- **Payment Processing**: Rental payment flows
- **Cancellation**: Rental cancellation with confirmations
- **Returns**: Film return processing
- **Extensions**: Rental extension functionality
- **Status Updates**: Real-time status changes
- **Validation**: Amount and status validations

### 🎨 UI Components Tests (`ui-components.cy.js`)
- **Toast Notifications**: Success/error messages
- **Modal Dialogs**: Confirmation dialogs
- **Form Interactions**: Profile and payment forms
- **Accessibility**: ARIA labels and keyboard navigation
- **Visual Elements**: Buttons, inputs, and layout

### 🔌 API Integration Tests (`api-integration.cy.js`)
- **Authentication APIs**: Login/logout endpoints
- **CRUD Operations**: Create, read, update, delete
- **Data Validation**: Request/response structure
- **Error Scenarios**: 404, 500, timeout handling
- **Security**: Authentication and input validation
- **Performance**: Response time monitoring

## Quick Start

### Prerequisites
```bash
# Ensure Node.js 16+ is installed
node --version

# Install dependencies
npm install
```

### Test Environment Setup

1. **Start the application**:
```bash
npm start
```

2. **Configure test environment variables** (create `.env.test`):
```bash
CYPRESS_baseUrl=http://localhost:3000
CYPRESS_testUser_username=test_user
CYPRESS_testUser_password=test123
CYPRESS_adminUser_username=admin
CYPRESS_adminUser_password=admin123
```

3. **Setup test database** with sample data for testing

### Running Tests

#### Interactive Mode (Development)
```bash
# Open Cypress Test Runner
npm run test:cypress:open

# Select and run individual tests
```

#### Headless Mode (CI/CD)
```bash
# Run all tests
npm run test:cypress

# Run with browser visible (debugging)
npm run test:cypress:headed

# CI-optimized run
npm run test:ci
```

#### Specific Test Suites
```bash
# Run only smoke tests (critical functionality)
npm run test:smoke

# Run only API integration tests
npm run test:integration

# Run all tests with full reporting
npm run test:all
```

## Test Structure

```
cypress/
├── e2e/                     # Test specifications
│   ├── dashboard.cy.js      # Core dashboard functionality
│   ├── rental-actions.cy.js # Rental operations
│   ├── ui-components.cy.js  # UI component testing
│   └── api-integration.cy.js # API endpoint testing
├── support/                 # Support files
│   ├── commands.js          # Custom Cypress commands
│   └── e2e.js              # Global hooks and configuration
├── fixtures/                # Test data
└── screenshots/             # Failure screenshots
```

## Custom Commands

The test suite includes custom Cypress commands for common operations:

### Authentication
```javascript
cy.loginAsTestUser()        // Login with test user credentials
cy.loginAsAdmin()           // Login with admin credentials
cy.logout()                 // Logout current user
```

### Navigation
```javascript
cy.navigateToDashboardSection('rentals')  // Navigate to specific section
cy.waitForDashboardLoad()                 // Wait for dashboard to load
```

### API Testing
```javascript
cy.waitForApiResponse('@getRentals')      // Wait for API calls
cy.mockApiError('/api/endpoint', 500)     // Mock API errors
```

### UI Interactions
```javascript
cy.checkToastMessage('Success!')          // Verify toast notifications
cy.confirmDialog(true)                    // Handle confirmation dialogs
```

## CI/CD Integration

### GitHub Actions
See `CYPRESS_CI_CD_SETUP.md` for complete GitHub Actions workflow configuration.

### Key CI/CD Features
- **Parallel Execution**: Tests can run in parallel for faster feedback
- **Artifact Collection**: Screenshots and videos saved on failure
- **Database Setup**: Automated test database initialization
- **Environment Management**: Configurable test environments
- **Reporting**: JUnit XML and HTML reports generated

### Environment Variables for CI/CD
```bash
CYPRESS_baseUrl=http://localhost:3000
CYPRESS_testUser_username=test_user
CYPRESS_testUser_password=test123
CYPRESS_adminUser_username=admin
CYPRESS_adminUser_password=admin123
NODE_ENV=test
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_NAME=sakila
```

## Test Configuration

### Cypress Configuration (`cypress.config.js`)
- **Base URL**: Automatically detects local development server
- **Timeouts**: Optimized for dashboard loading times
- **Retries**: Automatic retry on flaky tests
- **Video Recording**: Enabled for debugging
- **Screenshot Capture**: On failure for debugging

### Browser Support
- **Chrome**: Primary testing browser (recommended for CI/CD)
- **Firefox**: Secondary support
- **Edge**: Windows environments
- **Electron**: Cypress default (development)

## Debugging Failed Tests

### Local Debugging
1. **Run with browser visible**:
```bash
npm run test:cypress:headed
```

2. **Use Cypress Test Runner**:
```bash
npm run test:cypress:open
```

3. **Check screenshots and videos**:
- Screenshots: `cypress/screenshots/`
- Videos: `cypress/videos/`

### CI/CD Debugging
1. **Download artifacts** from failed CI/CD runs
2. **Check logs** for specific error messages
3. **Review API mocking** for external service failures
4. **Verify environment variables** are correctly set

## Data Management

### Test Data Strategy
- **Fixtures**: Static test data in `cypress/fixtures/`
- **API Mocking**: Dynamic responses using `cy.intercept()`
- **Database Seeds**: Test database initialization scripts

### Data Isolation
- Each test runs in isolation with fresh API mocks
- Database state is reset between test runs
- User sessions are cleared between tests

## Performance Considerations

### Test Execution Time
- **Individual Tests**: Target < 30 seconds per test
- **Full Suite**: Target < 10 minutes total
- **Parallel Execution**: Reduces total time by ~60%

### Resource Usage
- **Memory**: Optimized for CI/CD environments
- **Network**: Minimal external dependencies
- **Database**: Lightweight test data sets

## Best Practices

### Writing Tests
1. **Use descriptive test names** that explain the expected behavior
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Keep tests independent** - no dependencies between tests
4. **Use custom commands** for repeated actions
5. **Mock external APIs** to avoid dependencies

### Maintenance
1. **Update tests** when application features change
2. **Monitor test reliability** and fix flaky tests
3. **Review test coverage** regularly
4. **Keep test data current** with application changes

### CI/CD Integration
1. **Run tests on every commit** to main branches
2. **Block deployments** on test failures
3. **Notify team** of test failures immediately
4. **Archive test results** for trend analysis

## Troubleshooting

### Common Issues

#### Tests Fail Locally But Pass in CI
- Check Node.js version consistency
- Verify environment variables
- Review browser version differences

#### Slow Test Execution
- Increase timeouts in `cypress.config.js`
- Optimize database queries
- Review network conditions

#### API Mocking Issues
- Verify API endpoint URLs
- Check mock data structure
- Review timing of API calls

#### Authentication Failures
- Verify test user credentials
- Check session management
- Review JWT token handling

### Getting Help

1. **Review Cypress Documentation**: [docs.cypress.io](https://docs.cypress.io)
2. **Check Application Logs**: Server-side error logs
3. **Browser DevTools**: Network and console tabs
4. **Test Output**: Detailed assertion failures

## Future Enhancements

### Planned Improvements
- **Visual Regression Testing**: Screenshot comparisons
- **Performance Testing**: Load time monitoring
- **Cross-browser Testing**: Expanded browser support
- **Mobile Testing**: Touch and gesture testing
- **Accessibility Testing**: Extended a11y checks

### Contributing
1. **Follow existing patterns** when adding new tests
2. **Update documentation** for new test scenarios
3. **Test locally** before submitting changes
4. **Review CI/CD impact** of test additions

---

**Test Suite Version**: 1.0  
**Last Updated**: December 2024  
**Cypress Version**: 13.x+  
**Node.js Version**: 16.x+
