const { describe, test, expect } = require('@jest/globals');
const ValidationUtils = require('../../src/utils/ValidationUtils');

describe('ValidationUtils', () => {
  describe('isValidEmail', () => {
    test('should return true for valid email addresses', () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(ValidationUtils.isValidEmail('user+tag@example.org')).toBe(true);
      expect(ValidationUtils.isValidEmail('123@example.com')).toBe(true);
    });

    test('should return false for invalid email addresses', () => {
      expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@')).toBe(false);
      expect(ValidationUtils.isValidEmail('@example.com')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@.com')).toBe(false);
      expect(ValidationUtils.isValidEmail('test space@example.com')).toBe(false);
    });

    test('should return false for null, undefined, or non-string inputs', () => {
      expect(ValidationUtils.isValidEmail(null)).toBe(false);
      expect(ValidationUtils.isValidEmail(undefined)).toBe(false);
      expect(ValidationUtils.isValidEmail(123)).toBe(false);
      expect(ValidationUtils.isValidEmail('')).toBe(false);
      expect(ValidationUtils.isValidEmail('   ')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should return valid for strong passwords', () => {
      // Arrange
      const strongPassword = 'StrongPass123';

      // Act
      const result = ValidationUtils.validatePassword(strongPassword);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should require minimum length', () => {
      // Arrange
      const shortPassword = 'Ab1';

      // Act
      const result = ValidationUtils.validatePassword(shortPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should require uppercase letter', () => {
      const password = 'lowercase123';
      const result = ValidationUtils.validatePassword(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('should require lowercase letter', () => {
      const password = 'UPPERCASE123';
      const result = ValidationUtils.validatePassword(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('should require at least one number', () => {
      const password = 'NoNumbers';
      const result = ValidationUtils.validatePassword(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('should handle null or undefined password', () => {
      expect(ValidationUtils.validatePassword(null).isValid).toBe(false);
      expect(ValidationUtils.validatePassword(undefined).isValid).toBe(false);
      expect(ValidationUtils.validatePassword('').isValid).toBe(false);
    });

    test('should accumulate multiple errors', () => {
      const weakPassword = 'weak';
      const result = ValidationUtils.validatePassword(weakPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3); // length, uppercase, number (lowercase is satisfied)
    });
  });

  describe('isValidUsername', () => {
    test('should return true for valid usernames', () => {
      expect(ValidationUtils.isValidUsername('validuser')).toBe(true);
      expect(ValidationUtils.isValidUsername('user123')).toBe(true);
      expect(ValidationUtils.isValidUsername('user_name')).toBe(true);
      expect(ValidationUtils.isValidUsername('User_123')).toBe(true);
    });

    test('should return false for invalid usernames', () => {
      expect(ValidationUtils.isValidUsername('ab')).toBe(false); // too short
      expect(ValidationUtils.isValidUsername('a'.repeat(51))).toBe(false); // too long
      expect(ValidationUtils.isValidUsername('user-name')).toBe(false); // hyphen not allowed
      expect(ValidationUtils.isValidUsername('user name')).toBe(false); // space not allowed
      expect(ValidationUtils.isValidUsername('user@name')).toBe(false); // @ not allowed
    });

    test('should handle edge cases', () => {
      expect(ValidationUtils.isValidUsername(null)).toBe(false);
      expect(ValidationUtils.isValidUsername(undefined)).toBe(false);
      expect(ValidationUtils.isValidUsername('')).toBe(false);
      expect(ValidationUtils.isValidUsername('   ')).toBe(false);
    });
  });

  describe('validateRequired', () => {
    test('should pass for non-empty strings', () => {
      const result = ValidationUtils.validateRequired('valid value', 'Test Field');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should fail for empty or whitespace strings', () => {
      expect(ValidationUtils.validateRequired('', 'Test Field').isValid).toBe(false);
      expect(ValidationUtils.validateRequired('   ', 'Test Field').isValid).toBe(false);
      expect(ValidationUtils.validateRequired(null, 'Test Field').isValid).toBe(false);
      expect(ValidationUtils.validateRequired(undefined, 'Test Field').isValid).toBe(false);
    });

    test('should include field name in error message', () => {
      const result = ValidationUtils.validateRequired('', 'Username');
      
      expect(result.error).toBe('Username is required');
    });

    test('should use default field name when not provided', () => {
      const result = ValidationUtils.validateRequired('');
      
      expect(result.error).toBe('Field is required');
    });
  });

  describe('validateLength', () => {
    test('should pass for strings within length bounds', () => {
      const result = ValidationUtils.validateLength('valid', 3, 10, 'Test Field');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail for strings too short', () => {
      const result = ValidationUtils.validateLength('ab', 3, 10, 'Test Field');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test Field must be at least 3 characters long');
    });

    test('should fail for strings too long', () => {
      const result = ValidationUtils.validateLength('toolongstring', 3, 5, 'Test Field');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test Field must be no more than 5 characters long');
    });

    test('should handle non-string inputs', () => {
      const result = ValidationUtils.validateLength(123, 3, 10, 'Test Field');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test Field must be a string');
    });
  });

  describe('isValidPhone', () => {
    test('should return true for valid phone numbers', () => {
      expect(ValidationUtils.isValidPhone('1234567890')).toBe(true);
      expect(ValidationUtils.isValidPhone('+1-234-567-8900')).toBe(true);
      expect(ValidationUtils.isValidPhone('(123) 456-7890')).toBe(true);
      expect(ValidationUtils.isValidPhone('+31 6 12345678')).toBe(true);
    });

    test('should return false for invalid phone numbers', () => {
      expect(ValidationUtils.isValidPhone('123')).toBe(false); // too short
      expect(ValidationUtils.isValidPhone('1234567890123456')).toBe(false); // too long
      expect(ValidationUtils.isValidPhone('abcdefghij')).toBe(false); // no digits
      expect(ValidationUtils.isValidPhone('')).toBe(false);
      expect(ValidationUtils.isValidPhone(null)).toBe(false);
    });
  });

  describe('validateCustomerRegistration', () => {
    test('should pass for valid customer data', () => {
      // Arrange
      const validCustomer = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'SecurePass123'
      };

      // Act
      const result = ValidationUtils.validateCustomerRegistration(validCustomer);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail when required fields are missing', () => {
      const incompleteCustomer = {
        first_name: '',
        last_name: 'Doe',
        email: 'invalid-email',
        username: 'a', // too short
        password: 'weak' // too weak
      };

      const result = ValidationUtils.validateCustomerRegistration(incompleteCustomer);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('First name is required');
    });

    test('should validate all fields and accumulate errors', () => {
      const badCustomer = {
        first_name: '',
        last_name: '',
        email: 'bad-email',
        username: 'ab',
        password: '123'
      };

      const result = ValidationUtils.validateCustomerRegistration(badCustomer);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(5); // Multiple validation errors
    });

    test('should handle null or undefined customer data', () => {
      expect(ValidationUtils.validateCustomerRegistration(null).isValid).toBe(false);
      expect(ValidationUtils.validateCustomerRegistration(undefined).isValid).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('should trim whitespace and remove HTML tags', () => {
      expect(ValidationUtils.sanitizeInput('  hello world  ')).toBe('hello world');
      expect(ValidationUtils.sanitizeInput('hello<script>alert("xss")</script>world')).toBe('helloscriptalert("xss")/scriptworld');
      expect(ValidationUtils.sanitizeInput('test>content<here')).toBe('testcontenthere');
    });

    test('should limit string length', () => {
      const longString = 'a'.repeat(1500);
      const result = ValidationUtils.sanitizeInput(longString);
      
      expect(result.length).toBe(1000);
    });

    test('should handle null and undefined inputs', () => {
      expect(ValidationUtils.sanitizeInput(null)).toBe('');
      expect(ValidationUtils.sanitizeInput(undefined)).toBe('');
      expect(ValidationUtils.sanitizeInput(123)).toBe('');
    });
  });

  describe('validateRentalAmount', () => {
    test('should pass for valid rental amounts', () => {
      expect(ValidationUtils.validateRentalAmount(5.99).isValid).toBe(true);
      expect(ValidationUtils.validateRentalAmount(0).isValid).toBe(true);
      expect(ValidationUtils.validateRentalAmount(100.50).isValid).toBe(true);
    });

    test('should fail for negative amounts', () => {
      const result = ValidationUtils.validateRentalAmount(-5.99);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount cannot be negative');
    });

    test('should fail for amounts over 1000', () => {
      const result = ValidationUtils.validateRentalAmount(1001);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount cannot exceed 1000');
    });

    test('should fail for invalid number inputs', () => {
      expect(ValidationUtils.validateRentalAmount('not a number').isValid).toBe(false);
      expect(ValidationUtils.validateRentalAmount(null).isValid).toBe(false);
      expect(ValidationUtils.validateRentalAmount(undefined).isValid).toBe(false);
      expect(ValidationUtils.validateRentalAmount(NaN).isValid).toBe(false);
    });

    test('should fail for amounts with too many decimal places', () => {
      const result = ValidationUtils.validateRentalAmount(5.999);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount cannot have more than 2 decimal places');
    });
  });

  describe('Edge Cases and Integration', () => {
    test('should handle concurrent validation calls', () => {
      // Test thread safety (JavaScript is single-threaded, but good to test)
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(Promise.resolve(ValidationUtils.isValidEmail('test@example.com')));
      }

      return Promise.all(promises).then(results => {
        expect(results.every(result => result === true)).toBe(true);
      });
    });

    test('should maintain consistent behavior across multiple calls', () => {
      const email = 'test@example.com';
      
      // Call multiple times
      for (let i = 0; i < 10; i++) {
        expect(ValidationUtils.isValidEmail(email)).toBe(true);
      }
    });

    test('should handle extreme input sizes gracefully', () => {
      const extremelyLongString = 'a'.repeat(100000);
      
      expect(() => {
        ValidationUtils.validateLength(extremelyLongString, 1, 10, 'Test');
      }).not.toThrow();
    });
  });
});
