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

    test('should get all customers with pagination', async () => {
      const mockCustomers = [{ customer_id: 1, first_name: 'John' }];
      mockCustomerDAO.getCustomersWithDetails.mockResolvedValue(mockCustomers);
      mockCustomerDAO.getCustomersCount.mockResolvedValue(1);

      const result = await customerService.getAllCustomers(1, 10, '');
      expect(result.customers).toEqual(mockCustomers);
      expect(result.pagination.totalCount).toBe(1);
    });

    test('should update customer when username not taken', async () => {
      const profileData = { first_name: 'Jane', email: 'jane@test.com' };
      mockCustomerDAO.findByUsername.mockResolvedValue(null);
      mockCustomerDAO.updateCustomerAndAddress.mockResolvedValue({ affectedRows: 1 });

      const result = await customerService.updateCustomer(1, profileData);
      expect(result.success).toBe(true);
    });

    test('should reject update when username already exists', async () => {
      const profileData = { username: 'existinguser' };
      mockCustomerDAO.findByUsername.mockResolvedValue({ customer_id: 2 });

      const result = await customerService.updateCustomer(1, profileData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('gebruikersnaam is al in gebruik');
    });
  });

  // SQL Injection Prevention Tests  
  describe('SQL Injection Prevention', () => {
    test('should safely handle malicious search terms', async () => {
      const maliciousSearch = "'; DROP TABLE customers; --";
      mockCustomerDAO.searchCustomers.mockResolvedValue([]);
      mockCustomerDAO.getSearchCustomersCount.mockResolvedValue(0);

      // Should not throw - parameterized queries prevent injection
      await customerService.searchCustomers(maliciousSearch, 1, 10);
      expect(mockCustomerDAO.searchCustomers).toHaveBeenCalledWith(maliciousSearch, 1, 10);
    });

    test('should safely handle special characters in customer data', async () => {
      const customerData = {
        first_name: "O'Connor",
        last_name: 'Test"User',
        email: "test@example.com",
        address: "123 Main St; DROP TABLE users; --"
      };
      mockCustomerDAO.createCustomerWithAddress.mockResolvedValue({ success: true, customerId: 1 });

      const result = await customerService.createCustomer(customerData);
      expect(result.success).toBe(true);
    });

    test('should safely handle malicious update data', async () => {
      const maliciousData = {
        first_name: "'; UPDATE customers SET active=0; --",
        email: "malicious@evil.com"
      };
      mockCustomerDAO.findByUsername.mockResolvedValue(null);
      mockCustomerDAO.updateCustomerAndAddress.mockResolvedValue({ affectedRows: 1 });

      const result = await customerService.updateCustomer(1, maliciousData);
      expect(result.success).toBe(true);
    });
  });

  // Critical Error Handling
  describe('Critical Error Handling', () => {
    test('should throw error for null customer data validation', () => {
      expect(() => customerService.validateCustomerData(null)).toThrow('Customer data cannot be null or undefined');
      expect(() => customerService.validateCustomerData(undefined)).toThrow('Customer data cannot be null or undefined');
    });

    test('should handle database connection failures', async () => {
      const dbError = new Error('Connection timeout');
      mockCustomerDAO.getCustomersWithDetails.mockRejectedValue(dbError);

      await expect(customerService.getAllCustomers()).rejects.toThrow('Connection timeout');
    });

    test('should handle failed customer creation gracefully', async () => {
      const customerData = { first_name: 'John', last_name: 'Doe' };
      mockCustomerDAO.createCustomerWithAddress.mockRejectedValue(new Error('Database constraint violation'));

      const result = await customerService.createCustomer(customerData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Database constraint violation');
    });
  });

  // Validation Tests
  describe('Input Validation', () => {
    test('should validate customer data correctly', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe', 
        email: 'john@example.com',
        address: '123 Main Street'
      };

      const result = customerService.validateCustomerData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject invalid customer data', () => {
      const invalidData = {
        firstName: 'J',
        lastName: '',
        email: 'invalid-email',
        address: 'abc'
      };

      const result = customerService.validateCustomerData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate email addresses correctly', () => {
      expect(customerService.isValidEmail('test@example.com')).toBe(true);
      expect(customerService.isValidEmail('invalid-email')).toBe(false);
      expect(customerService.isValidEmail('')).toBe(false);
    });
  });
});
