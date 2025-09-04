const CustomerDAO = require('../dao/CustomerDAO');

/**
 * Service for customer business logic
 */
class CustomerService {
  constructor() {
    this.customerDAO = new CustomerDAO();
  }

  /**
   * Create new customer (US1E1)
   */
  async createCustomer(customerData) {
    try {
      const { firstName, lastName, email, phone, address, district, city } = customerData;

      // Generate username from email
      const username = email.split('@')[0];

      // Default password (should be changed by customer)
      const defaultPassword = 'customer123';

      const result = await this.customerDAO.createCustomerWithAddress(
        {
          firstName,
          lastName,
          email,
          username,
          password: defaultPassword, // Will be hashed in DAO
          storeId: 1 // Default store
        },
        {
          address,
          district,
          cityId: 1, // Default city
          phone
        }
      );

      return {
        success: true,
        data: {
          customerId: result.insertId
        },
        message: 'Klant succesvol toegevoegd'
      };
    } catch (error) {
      console.error('Create customer error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het toevoegen van de klant'
      };
    }
  }

  /**
   * Get customers with pagination and search for staff dashboard
   */
  async getCustomersForDashboard(search = '', page = 1, limit = 20) {
    try {
      const customers = await this.customerDAO.getCustomersWithStats(search, page, limit);
      const totalCount = await this.customerDAO.getSearchCustomersCount(search);
      const stats = await this.customerDAO.getCustomerStats();

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          customers,
          stats,
          pagination: {
            page,
            totalPages,
            total: totalCount,
            limit
          }
        }
      };
    } catch (error) {
      console.error('Get customers for dashboard error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van klantgegevens'
      };
    }
  }

  /**
   * Get customer details by ID
   */
  async getCustomerDetails(customerId) {
    try {
      const customer = await this.customerDAO.getCustomerWithAddress(customerId);
      
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
   * Update customer information
   */
  async updateCustomer(customerId, updateData) {
    try {
      const result = await this.customerDAO.update(customerId, updateData);
      
      if (result.affectedRows === 0) {
        return {
          success: false,
          message: 'Klant niet gevonden of geen wijzigingen aangebracht'
        };
      }

      return {
        success: true,
        message: 'Klantgegevens succesvol bijgewerkt'
      };
    } catch (error) {
      console.error('Update customer error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het bijwerken van klantgegevens'
      };
    }
  }

  /**
   * Deactivate customer
   */
  async deactivateCustomer(customerId) {
    try {
      const result = await this.customerDAO.update(customerId, { active: 0 });
      
      if (result.affectedRows === 0) {
        return {
          success: false,
          message: 'Klant niet gevonden'
        };
      }

      return {
        success: true,
        message: 'Klant succesvol gedeactiveerd'
      };
    } catch (error) {
      console.error('Deactivate customer error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het deactiveren van de klant'
      };
    }
  }

  /**
   * Activate customer
   */
  async activateCustomer(customerId) {
    try {
      const result = await this.customerDAO.update(customerId, { active: 1 });
      
      if (result.affectedRows === 0) {
        return {
          success: false,
          message: 'Klant niet gevonden'
        };
      }

      return {
        success: true,
        message: 'Klant succesvol geactiveerd'
      };
    } catch (error) {
      console.error('Activate customer error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het activeren van de klant'
      };
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStatistics() {
    try {
      const stats = await this.customerDAO.getCustomerStats();
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Get customer statistics error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van statistieken'
      };
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(searchTerm, page = 1, limit = 20) {
    try {
      return await this.getCustomersForDashboard(searchTerm, page, limit);
    } catch (error) {
      console.error('Search customers error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het zoeken naar klanten'
      };
    }
  }
}

module.exports = CustomerService;
