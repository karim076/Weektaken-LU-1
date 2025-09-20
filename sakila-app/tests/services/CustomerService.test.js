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
    test('should get customer by ID successfully', async () => {
      const mockCustomer = { customer_id: 1, first_name: 'John', last_name: 'Doe' };
      mockCustomerDAO.getCustomerWithDetails.mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomerById(1);
      expect(result).toEqual(mockCustomer);
    });

    test('should create customer successfully', async () => {
      const customerData = { first_name: 'John', last_name: 'Doe', email: 'john@test.com' };
      mockCustomerDAO.createCustomerWithAddress.mockResolvedValue({ success: true, customerId: 1 });

      const result = await customerService.createCustomer(customerData);
      expect(result.success).toBe(true);
    });


  });



  // Critical Error Handling
  describe('Critical Error Handling', () => {
    test('should throw error for null customer data validation', () => {
      expect(() => customerService.validateCustomerData(null)).toThrow('Customer data cannot be null or undefined');
      expect(() => customerService.validateCustomerData(undefined)).toThrow('Customer data cannot be null or undefined');
    });



    test('should handle failed customer creation gracefully', async () => {
      const customerData = { first_name: 'John', last_name: 'Doe' };
      mockCustomerDAO.createCustomerWithAddress.mockRejectedValue(new Error('Database constraint violation'));

      const result = await customerService.createCustomer(customerData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Database constraint violation');
    });
  });


});
