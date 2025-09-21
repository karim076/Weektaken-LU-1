const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const CustomerService = require('../../src/services/CustomerService');
const CustomerDAO = require('../../src/dao/CustomerDAO');

// Mock dependencies
jest.mock('../../src/dao/CustomerDAO');

describe('CustomerService', () => {
  let customerService;
  let mockCustomerDAO;

  beforeEach(() => {
    // Create minimal mocks for critical testing
    mockCustomerDAO = {
      getCustomerWithDetails: jest.fn(),
      getCustomersWithDetails: jest.fn(),
      getCustomersCount: jest.fn(),
      createCustomerWithAddress: jest.fn(),
      updateCustomerAndAddress: jest.fn(),
      findByUsername: jest.fn(),
      searchCustomers: jest.fn(),
      getSearchCustomersCount: jest.fn()
    };

    CustomerDAO.mockImplementation(() => mockCustomerDAO);
    customerService = new CustomerService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Critical Core Functionality Tests
  describe('Core Customer Operations', () => {
    test('should get customer by ID successfully', (done) => {
      const mockCustomer = { customer_id: 1, first_name: 'John', last_name: 'Doe' };
      mockCustomerDAO.getCustomerWithDetails.mockImplementation((id, callback) => {
        callback(null, mockCustomer);
      });

      customerService.getCustomerById(1, (error, result) => {
        expect(error).toBeNull();
        expect(result).toEqual(mockCustomer);
        done();
      });
    });

    test('should create customer successfully', (done) => {
      const customerData = { first_name: 'John', last_name: 'Doe', email: 'john@test.com' };
      mockCustomerDAO.createCustomerWithAddress.mockImplementation((data, callback) => {
        callback(null, { success: true, customerId: 1 });
      });

      customerService.createCustomer(customerData, (error, result) => {
        expect(error).toBeNull();
        expect(result.success).toBe(true);
        done();
      });
    });
  });

  // Critical Error Handling
  describe('Critical Error Handling', () => {
    test('should throw error for null customer data validation', () => {
      expect(() => customerService.validateCustomerData(null)).toThrow('Customer data cannot be null or undefined');
      expect(() => customerService.validateCustomerData(undefined)).toThrow('Customer data cannot be null or undefined');
    });

    test('should handle failed customer creation gracefully', (done) => {
      const customerData = { first_name: 'John', last_name: 'Doe' };
      mockCustomerDAO.createCustomerWithAddress.mockImplementation((data, callback) => {
        callback(new Error('Database constraint violation'));
      });

      customerService.createCustomer(customerData, (error, result) => {
        expect(error).toBeNull();
        expect(result.success).toBe(false);
        expect(result.message).toContain('Database constraint violation');
        done();
      });
    });
  });
});
