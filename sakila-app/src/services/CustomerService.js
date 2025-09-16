const CustomerDAO = require('../dao/CustomerDAO');

/**
 * Service for customer business logic
 */
class CustomerService {
  constructor() {
    this.customerDAO = new CustomerDAO();
  }

  /**
   * Get customer by ID with complete information
   */
  async getCustomerById(customerId) {
    try {
      return await this.customerDAO.getCustomerWithDetails(customerId);
    } catch (error) {
      console.error('Get customer error:', error);
      throw error;
    }
  }

  /**
   * Get customer details (wrapper for controller compatibility)
   */
  async getCustomerDetails(customerId) {
    try {
      const customer = await this.customerDAO.getCustomerWithDetails(customerId);
      
      if (!customer) {
        return {
          success: false,
          message: 'Klant niet gevonden'
        };
      }
      
      return {
        success: true,
        data: customer
      };
    } catch (error) {
      console.error('Get customer details error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van klantgegevens'
      };
    }
  }

  /**
   * Get all customers with pagination and search
   */
  async getAllCustomers(page = 1, limit = 10, search = '') {
    try {
      const customers = await this.customerDAO.getCustomersWithDetails(page, limit, search);
      const totalCount = await this.customerDAO.getCustomersCount(search);
      
      return {
        customers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        }
      };
    } catch (error) {
      console.error('Get all customers error:', error);
      throw error;
    }
  }

  /**
   * Create new customer with address
   */
  async createCustomer(customerData) {
    try {
      const result = await this.customerDAO.createCustomerWithAddress(customerData);
      
      if (result.success) {
        return {
          success: true,
          customerId: result.customerId,
          addressId: result.addressId,
          message: 'Customer created successfully'
        };
      } else {
        return {
          success: false,
          message: 'Failed to create customer'
        };
      }
    } catch (error) {
      console.error('Create customer error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create customer'
      };
    }
  }

  /**
   * Update customer information
   */
  async updateCustomer(customerId, profileData) {
    try {
      // Check if username is being changed and if it's already taken
      if (profileData.username) {
        const existingUser = await this.customerDAO.findByUsername(profileData.username, customerId);
        if (existingUser) {
          return {
            success: false,
            message: 'Deze gebruikersnaam is al in gebruik'
          };
        }
      }
      
      // Separate customer data from address data
      const customerData = {};
      const addressData = {};
      
      // Fields that belong to customer table
      const customerFields = ['username', 'first_name', 'last_name', 'email', 'password'];
      // Fields that belong to address table  
      const addressFields = ['address', 'phone'];
      
      for (const [key, value] of Object.entries(profileData)) {
        if (customerFields.includes(key)) {
          customerData[key] = value;
        } else if (addressFields.includes(key)) {
          addressData[key] = value;
        } else if (key === 'postal_code') {
          // Map postal_code to district for Sakila compatibility
          addressData['district'] = value;
        }
        // Ignore city, country, language for now as they need special handling in Sakila
      }
      
      const result = await this.customerDAO.updateCustomerAndAddress(customerId, customerData, addressData);
      
      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Profiel succesvol bijgewerkt' : 'Geen wijzigingen aangebracht'
      };
    } catch (error) {
      console.error('Update customer error:', error);
      return {
        success: false,
        message: error.message || 'Fout bij het bijwerken van het profiel'
      };
    }
  }

  /**
   * Get customer rental history
   */
  async getCustomerRentals(customerId, page = 1, limit = 100) {
    try {
      // Use the existing method that gets customer with rental history
      const result = await this.customerDAO.getCustomerWithRentalHistory(customerId);
      
      if (!result || !result.rentals) {
        return {
          rentals: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalCount: 0,
            limit
          }
        };
      }
      
      // Return just the rentals array for backward compatibility
      const rentals = result.rentals || [];
      
      // For now, return all rentals without pagination since the DAO method doesn't support it
      return {
        rentals: rentals,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: rentals.length,
          limit: rentals.length
        }
      };
    } catch (error) {
      console.error('Get customer rentals error:', error);
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(customerId) {
    try {
      return await this.customerDAO.getCustomerStats(customerId);
    } catch (error) {
      console.error('Get customer stats error:', error);
      throw error;
    }
  }

  /**
   * Get customers with rental statistics
   */
  async getCustomersWithStats(limit = 50) {
    try {
      return await this.customerDAO.getCustomersWithStats(limit);
    } catch (error) {
      console.error('Get customers with stats error:', error);
      throw error;
    }
  }

  /**
   * Search customers by name or email
   */
  async searchCustomers(searchTerm, page = 1, limit = 10) {
    try {
      const customers = await this.customerDAO.searchCustomers(searchTerm, page, limit);
      const totalCount = await this.customerDAO.getSearchCustomersCount(searchTerm);
      
      return {
        customers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        },
        searchTerm
      };
    } catch (error) {
      console.error('Search customers error:', error);
      throw error;
    }
  }

  /**
   * Activate/Deactivate customer
   */
  async toggleCustomerActive(customerId, active = true) {
    try {
      const result = await this.customerDAO.updateCustomerActive(customerId, active);
      
      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 
          ? `Customer ${active ? 'activated' : 'deactivated'} successfully`
          : 'No changes made'
      };
    } catch (error) {
      console.error('Toggle customer active error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update customer status'
      };
    }
  }

  /**
   * Get active rentals for customer
   */
  async getActiveRentals(customerId) {
    try {
      return await this.customerDAO.getActiveRentals(customerId);
    } catch (error) {
      console.error('Get active rentals error:', error);
      throw error;
    }
  }

  /**
   * Calculate customer late fees
   */
  async calculateLateFees(customerId) {
    try {
      return await this.customerDAO.calculateLateFees(customerId);
    } catch (error) {
      console.error('Calculate late fees error:', error);
      throw error;
    }
  }

  /**
   * Get customer payment history
   */
  async getPaymentHistory(customerId, page = 1, limit = 10) {
    try {
      const payments = await this.customerDAO.getPaymentHistory(customerId, page, limit);
      const totalCount = await this.customerDAO.getPaymentHistoryCount(customerId);
      
      return {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        }
      };
    } catch (error) {
      console.error('Get payment history error:', error);
      throw error;
    }
  }

  /**
   * Update customer address
   */
  async updateCustomerAddress(customerId, addressData) {
    try {
      const result = await this.customerDAO.updateCustomerAddress(customerId, addressData);
      
      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Address updated successfully' : 'No changes made'
      };
    } catch (error) {
      console.error('Update customer address error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update address'
      };
    }
  }

  /**
   * Validate customer data
   */
  validateCustomerData(customerData) {
    const errors = [];

    if (!customerData.firstName || customerData.firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (!customerData.lastName || customerData.lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    if (!customerData.email || !this.isValidEmail(customerData.email)) {
      errors.push('Valid email address is required');
    }

    if (!customerData.address || customerData.address.trim().length < 5) {
      errors.push('Address must be at least 5 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get top customers by rental count
   */
  async getTopCustomers(limit = 10) {
    try {
      return await this.customerDAO.getTopCustomers(limit);
    } catch (error) {
      console.error('Get top customers error:', error);
      throw error;
    }
  }

  /**
   * Get total number of customers
   */
  async getTotalCustomers() {
    try {
      return await this.customerDAO.getCustomersCount('');
    } catch (error) {
      console.error('Get total customers error:', error);
      return 0;
    }
  }
}

module.exports = CustomerService;