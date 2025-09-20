/**
 * Data validation utilities
 * Bevat verschillende validatie functies vergelijkbaar met DataAnnotations in C#
 */

class ValidationUtils {
  /**
   * Validate email format
   * @param {string} email 
   * @returns {boolean}
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validate password strength
   * @param {string} password 
   * @returns {object} { isValid: boolean, errors: string[] }
   */
  static validatePassword(password) {
    const errors = [];
    
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate username format
   * @param {string} username 
   * @returns {boolean}
   */
  static isValidUsername(username) {
    if (!username || typeof username !== 'string') return false;
    
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 50) return false;
    
    // Only alphanumeric characters and underscores allowed
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(trimmed);
  }

  /**
   * Validate required string field
   * @param {string} value 
   * @param {string} fieldName 
   * @returns {object} { isValid: boolean, error?: string }
   */
  static validateRequired(value, fieldName = 'Field') {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  }

  /**
   * Validate string length
   * @param {string} value 
   * @param {number} minLength 
   * @param {number} maxLength 
   * @param {string} fieldName 
   * @returns {object}
   */
  static validateLength(value, minLength = 0, maxLength = 255, fieldName = 'Field') {
    const errors = [];
    
    if (!value || typeof value !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return { isValid: false, errors };
    }

    const trimmed = value.trim();
    
    if (trimmed.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters long`);
    }
    
    if (trimmed.length > maxLength) {
      errors.push(`${fieldName} must be no more than ${maxLength} characters long`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate phone number format
   * @param {string} phone 
   * @returns {boolean}
   */
  static isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (10-15 digits)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Validate customer registration data
   * @param {object} customerData 
   * @returns {object} { isValid: boolean, errors: string[] }
   */
  static validateCustomerRegistration(customerData) {
    const errors = [];
    
    if (!customerData || typeof customerData !== 'object') {
      errors.push('Customer data is required');
      return { isValid: false, errors };
    }

    // Validate first name
    const firstNameValidation = this.validateRequired(customerData.first_name, 'First name');
    if (!firstNameValidation.isValid) {
      errors.push(firstNameValidation.error);
    } else {
      const lengthValidation = this.validateLength(customerData.first_name, 1, 50, 'First name');
      if (!lengthValidation.isValid) {
        errors.push(...lengthValidation.errors);
      }
    }

    // Validate last name
    const lastNameValidation = this.validateRequired(customerData.last_name, 'Last name');
    if (!lastNameValidation.isValid) {
      errors.push(lastNameValidation.error);
    } else {
      const lengthValidation = this.validateLength(customerData.last_name, 1, 50, 'Last name');
      if (!lengthValidation.isValid) {
        errors.push(...lengthValidation.errors);
      }
    }

    // Validate email
    if (!this.isValidEmail(customerData.email)) {
      errors.push('Please provide a valid email address');
    }

    // Validate username
    if (!this.isValidUsername(customerData.username)) {
      errors.push('Username must be 3-50 characters long and contain only letters, numbers, and underscores');
    }

    // Validate password
    const passwordValidation = this.validatePassword(customerData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Sanitize input string
   * @param {string} input 
   * @returns {string}
   */
  static sanitizeInput(input) {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate rental amount
   * @param {number} amount 
   * @returns {object}
   */
  static validateRentalAmount(amount) {
    const errors = [];
    
    if (typeof amount !== 'number' || isNaN(amount)) {
      errors.push('Amount must be a valid number');
      return { isValid: false, errors };
    }

    if (amount < 0) {
      errors.push('Amount cannot be negative');
    }

    if (amount > 1000) {
      errors.push('Amount cannot exceed 1000');
    }

    // Check for reasonable precision (max 2 decimal places)
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      errors.push('Amount cannot have more than 2 decimal places');
    }

    return { isValid: errors.length === 0, errors };
  }
}

module.exports = ValidationUtils;
