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
   * Delete customer and return all their rented films
   */
  async deleteCustomer(customerId) {
    try {
      console.log('CustomerService: Deleting customer', customerId);
      
      // First check if customer has active rentals
      const activeRentals = await this.customerDAO.getActiveRentals(customerId);
      console.log('CustomerService: Found', activeRentals ? activeRentals.length : 0, 'active rentals');
      
      if (activeRentals && activeRentals.length > 0) {
        // Return all active rentals first
        const RentalDAO = require('../dao/RentalDAO');
        const rentalDAO = new RentalDAO();
        
        for (const rental of activeRentals) {
          console.log('CustomerService: Returning rental', rental.rental_id);
          await rentalDAO.returnRental(rental.rental_id);
        }
      }
      
      // Now delete the customer
      const result = await this.customerDAO.deleteCustomer(customerId);
      console.log('CustomerService: Delete result', result);
      
      return {
        success: result && result.affectedRows > 0,
        message: result && result.affectedRows > 0 
          ? `Klant succesvol verwijderd. ${activeRentals ? activeRentals.length : 0} films zijn teruggegeven.`
          : 'Klant niet gevonden',
        returnedFilms: activeRentals ? activeRentals.length : 0
      };
    } catch (error) {
      console.error('Delete customer error:', error);
      return {
        success: false,
        message: error.message || 'Fout bij het verwijderen van de klant'
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

    // Check if customerData is null or undefined
    if (!customerData) {
      throw new Error('Customer data cannot be null or undefined');
    }

    // Check both firstName/first_name formats
    const firstName = customerData.first_name || customerData.firstName;
    const lastName = customerData.last_name || customerData.lastName;
    const email = customerData.email;

    if (!firstName || firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (!lastName || lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    if (!email || !this.isValidEmail(email)) {
      errors.push('Valid email address is required');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      message: errors.length > 0 ? errors.join(', ') : null
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
   * Staff specific methods voor klantenbeheer
   */

  // Haal alle klanten op met zoek en paginering
  async getAllCustomers(options = {}) {
    try {
      const { page = 1, limit = 20, search = '', includeStats = false } = options;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      let params = [];
      
      if (search) {
        whereClause = `WHERE (
          c.first_name LIKE ? OR 
          c.last_name LIKE ? OR 
          c.email LIKE ? OR 
          c.username LIKE ?
        )`;
        const searchParam = `%${search}%`;
        params = [searchParam, searchParam, searchParam, searchParam];
      }
      
      // Basis query voor klanten
      let baseQuery = `
        SELECT 
          c.customer_id,
          c.first_name,
          c.last_name,
          c.email,
          c.username,
          c.active,
          c.create_date,
          c.last_update,
          CONCAT(c.first_name, ' ', c.last_name) as full_name,
          a.address,
          a.district,
          a.postal_code,
          a.phone,
          ci.city,
          co.country
      `;
      
      if (includeStats) {
        baseQuery += `,
          COUNT(DISTINCT r.rental_id) as total_rentals,
          COUNT(DISTINCT CASE WHEN r.return_date IS NULL THEN r.rental_id END) as active_rentals,
          COALESCE(SUM(CASE WHEN r.return_date IS NOT NULL THEN r.amount END), 0) as total_spent
        `;
      }
      
      baseQuery += `
        FROM customer c
        LEFT JOIN address a ON c.address_id = a.address_id
        LEFT JOIN city ci ON a.city_id = ci.city_id
        LEFT JOIN country co ON ci.country_id = co.country_id
      `;
      
      if (includeStats) {
        baseQuery += `LEFT JOIN rental r ON c.customer_id = r.customer_id`;
      }
      
      baseQuery += ` ${whereClause}`;
      
      if (includeStats) {
        baseQuery += ` GROUP BY c.customer_id`;
      }
      
      baseQuery += ` ORDER BY c.last_name, c.first_name LIMIT ? OFFSET ?`;
      
      const customers = await this.customerDAO.query(baseQuery, [...params, limit, offset]);
      
      // Tel totaal aantal klanten voor paginering
      const countQuery = `
        SELECT COUNT(DISTINCT c.customer_id) as total
        FROM customer c
        ${whereClause}
      `;
      const countResult = await this.customerDAO.query(countQuery, params);
      const total = countResult[0].total;
      
      return {
        success: true,
        customers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('CustomerService getAllCustomers error:', error);
      return {
        success: false,
        customers: [],
        pagination: {}
      };
    }
  }

  // Zoek klanten (voor autocomplete)
  async searchCustomers(query) {
    try {
      const customers = await this.customerDAO.query(`
        SELECT 
          customer_id,
          first_name,
          last_name,
          email,
          username,
          CONCAT(first_name, ' ', last_name) as full_name
        FROM customer
        WHERE active = 1
          AND (
            first_name LIKE ? OR 
            last_name LIKE ? OR 
            email LIKE ? OR
            username LIKE ?
          )
        ORDER BY last_name, first_name
        LIMIT 10
      `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);
      
      return customers;
    } catch (error) {
      console.error('CustomerService searchCustomers error:', error);
      return [];
    }
  }

  // Zoek klanten voor staff (werkende versie)
  async searchCustomersForStaff(query) {
    try {
      return await this.customerDAO.searchCustomersBasic(query);
    } catch (error) {
      console.error('CustomerService searchCustomersForStaff error:', error);
      return [];
    }
  }

  // Alle klanten voor staff interface
  async getAllCustomersForStaff() {
    try {
      return await this.customerDAO.getAllActiveCustomers();
    } catch (error) {
      console.error('CustomerService getAllCustomersForStaff error:', error);
      return [];
    }
  }

  // Update klant gegevens (staff functie)
  async updateCustomer(customerId, updates) {
    try {
      console.log('CustomerService updateCustomer called with:', { customerId, updates });
      
      // Valideer input
      const validation = this.validateCustomerData(updates);
      console.log('Validation result:', validation);
      
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }
      
      const result = await this.customerDAO.updateCustomer(customerId, updates);
      console.log('DAO update result:', result);
      
      if (result.success) {
        // Haal bijgewerkte klant op
        const updatedCustomer = await this.customerDAO.getCustomerWithDetails(customerId);
        return {
          success: true,
          customer: updatedCustomer,
          message: 'Klantgegevens succesvol bijgewerkt'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Fout bij bijwerken klantgegevens'
        };
      }
    } catch (error) {
      console.error('CustomerService updateCustomer error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het bijwerken'
      };
    }
  }

  // Change customer password (for staff - no current password required)
  async changeCustomerPassword(customerId, newPassword) {
    try {
      console.log('CustomerService changeCustomerPassword called with:', { customerId });
      
      // Hash the new password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password in database
      const result = await this.customerDAO.updateCustomer(customerId, { 
        password: hashedPassword 
      });
      
      if (result.success) {
        return {
          success: true,
          message: 'Wachtwoord succesvol gewijzigd'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Fout bij wijzigen wachtwoord'
        };
      }
    } catch (error) {
      console.error('CustomerService changeCustomerPassword error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
      };
    }
  }

  // Statistieken voor staff dashboard
  async getTotalCustomers() {
    try {
      const result = await this.customerDAO.query('SELECT COUNT(*) as count FROM customer WHERE active = 1');
      return { count: result[0].count };
    } catch (error) {
      console.error('CustomerService getTotalCustomers error:', error);
      return { count: 0 };
    }
  }
}

module.exports = CustomerService;