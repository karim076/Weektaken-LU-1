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
  getCustomerById(customerId, callback) {
    this.customerDAO.getCustomerWithDetails(customerId, (error, customer) => {
      if (error) {
        console.error('Get customer error:', error);
        return callback(error);
      }
      callback(null, customer);
    });
  }

  /**
   * Get customer details (wrapper for controller compatibility)
   */
  getCustomerDetails(customerId, callback) {
    this.customerDAO.getCustomerWithDetails(customerId, (error, customer) => {
      if (error) {
        console.error('Get customer details error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het ophalen van klantgegevens'
        });
      }
      
      if (!customer) {
        return callback(null, {
          success: false,
          message: 'Klant niet gevonden'
        });
      }
      
      callback(null, {
        success: true,
        data: customer
      });
    });
  }

  /**
   * Get all customers with pagination and search
   */
  getAllCustomers(page = 1, limit = 10, search = '', callback) {
    this.customerDAO.getCustomersWithDetails(page, limit, search, (error, customers) => {
      if (error) {
        console.error('Get all customers error:', error);
        return callback(error);
      }

      this.customerDAO.getCustomersCount(search, (countError, totalCount) => {
        if (countError) {
          console.error('Get customers count error:', countError);
          return callback(countError);
        }
        
        callback(null, {
          customers,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            limit
          }
        });
      });
    });
  }

  /**
   * Create new customer with address
   */
  createCustomer(customerData, callback) {
    this.customerDAO.createCustomerWithAddress(customerData, (error, result) => {
      if (error) {
        console.error('Create customer error:', error);
        return callback(null, {
          success: false,
          message: error.message || 'Failed to create customer'
        });
      }
      
      if (result.success) {
        callback(null, {
          success: true,
          customerId: result.customerId,
          addressId: result.addressId,
          message: 'Customer created successfully'
        });
      } else {
        callback(null, {
          success: false,
          message: 'Failed to create customer'
        });
      }
    });
  }

  /**
   * Update customer information
   */
  updateCustomer(customerId, profileData, callback) {
    // Check if username is being changed and if it's already taken
    if (profileData.username) {
      this.customerDAO.findByUsername(profileData.username, customerId, (usernameError, existingUser) => {
        if (usernameError) {
          console.error('Check username error:', usernameError);
          return callback(null, {
            success: false,
            message: 'Fout bij het controleren van gebruikersnaam'
          });
        }
        
        if (existingUser) {
          return callback(null, {
            success: false,
            message: 'Deze gebruikersnaam is al in gebruik'
          });
        }
        
        this.performUpdate(customerId, profileData, callback);
      });
    } else {
      this.performUpdate(customerId, profileData, callback);
    }
  }

  performUpdate(customerId, profileData, callback) {
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
    
    this.customerDAO.updateCustomerAndAddress(customerId, customerData, addressData, (error, result) => {
      if (error) {
        console.error('Update customer error:', error);
        return callback(null, {
          success: false,
          message: error.message || 'Fout bij het bijwerken van het profiel'
        });
      }
      
      callback(null, {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Profiel succesvol bijgewerkt' : 'Geen wijzigingen aangebracht'
      });
    });
  }

  /**
   * Delete customer and return all their rented films
   */
  deleteCustomer(customerId, callback) {
    console.log('CustomerService: Deleting customer', customerId);
    
    // First check if customer has active rentals
    this.customerDAO.getActiveRentals(customerId, (error, activeRentals) => {
      if (error) {
        console.error('Get active rentals error:', error);
        return callback(null, {
          success: false,
          message: error.message || 'Fout bij het verwijderen van de klant'
        });
      }
      
      console.log('CustomerService: Found', activeRentals ? activeRentals.length : 0, 'active rentals');
      
      if (activeRentals && activeRentals.length > 0) {
        // Return all active rentals first
        const RentalDAO = require('../dao/RentalDAO');
        const rentalDAO = new RentalDAO();
        
        // Use a simple counter to track when all rentals are returned
        let rentalsReturned = 0;
        let hasError = false;
        
        const returnCallback = (returnError) => {
          if (returnError && !hasError) {
            hasError = true;
            return callback(null, {
              success: false,
              message: 'Fout bij het teruggeven van films'
            });
          }
          
          rentalsReturned++;
          if (rentalsReturned === activeRentals.length && !hasError) {
            // All rentals returned, now delete customer
            this.performDelete(customerId, activeRentals.length, callback);
          }
        };
        
        // Return each rental
        for (const rental of activeRentals) {
          console.log('CustomerService: Returning rental', rental.rental_id);
          rentalDAO.returnRental(rental.rental_id, returnCallback);
        }
      } else {
        // No active rentals, delete customer directly
        this.performDelete(customerId, 0, callback);
      }
    });
  }

  performDelete(customerId, returnedFilmsCount, callback) {
    this.customerDAO.deleteCustomer(customerId, (error, result) => {
      if (error) {
        console.error('Delete customer error:', error);
        return callback(null, {
          success: false,
          message: error.message || 'Fout bij het verwijderen van de klant'
        });
      }
      
      console.log('CustomerService: Delete result', result);
      
      callback(null, {
        success: result && result.affectedRows > 0,
        message: result && result.affectedRows > 0 
          ? `Klant succesvol verwijderd. ${returnedFilmsCount} films zijn teruggegeven.`
          : 'Klant niet gevonden',
        returnedFilms: returnedFilmsCount
      });
    });
  }

  /**
   * Get customer rental history
   */
  getCustomerRentals(customerId, page = 1, limit = 100, callback) {
    // Use the existing method that gets customer with rental history
    this.customerDAO.getCustomerWithRentalHistory(customerId, (error, result) => {
      if (error) {
        console.error('Get customer rentals error:', error);
        return callback(error);
      }
      
      if (!result || !result.rentals) {
        return callback(null, {
          rentals: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalCount: 0,
            limit
          }
        });
      }
      
      // Return just the rentals array for backward compatibility
      const rentals = result.rentals || [];
      
      // For now, return all rentals without pagination since the DAO method doesn't support it
      callback(null, {
        rentals: rentals,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: rentals.length,
          limit: rentals.length
        }
      });
    });
  }

  /**
   * Get customer statistics
   */
  getCustomerStats(customerId, callback) {
    this.customerDAO.getCustomerStats(customerId, callback);
  }

  /**
   * Get customers with rental statistics
   */
  getCustomersWithStats(limit = 50, callback) {
    this.customerDAO.getCustomersWithStats(limit, callback);
  }

  /**
   * Search customers by name or email
   */
  searchCustomers(searchTerm, page = 1, limit = 10, callback) {
    this.customerDAO.searchCustomers(searchTerm, page, limit, (error, customers) => {
      if (error) {
        console.error('Search customers error:', error);
        return callback(error);
      }

      this.customerDAO.getSearchCustomersCount(searchTerm, (countError, totalCount) => {
        if (countError) {
          console.error('Get search customers count error:', countError);
          return callback(countError);
        }
        
        callback(null, {
          customers,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            limit
          },
          searchTerm
        });
      });
    });
  }

  /**
   * Activate/Deactivate customer
   */
  toggleCustomerActive(customerId, active = true, callback) {
    this.customerDAO.updateCustomerActive(customerId, active, (error, result) => {
      if (error) {
        console.error('Toggle customer active error:', error);
        return callback(null, {
          success: false,
          message: error.message || 'Failed to update customer status'
        });
      }
      
      callback(null, {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 
          ? `Customer ${active ? 'activated' : 'deactivated'} successfully`
          : 'No changes made'
      });
    });
  }

  /**
   * Get active rentals for customer
   */
  getActiveRentals(customerId, callback) {
    this.customerDAO.getActiveRentals(customerId, callback);
  }

  /**
   * Calculate customer late fees
   */
  calculateLateFees(customerId, callback) {
    this.customerDAO.calculateLateFees(customerId, callback);
  }

  /**
   * Get customer payment history
   */
  getPaymentHistory(customerId, page = 1, limit = 10, callback) {
    this.customerDAO.getPaymentHistory(customerId, page, limit, (error, payments) => {
      if (error) {
        console.error('Get payment history error:', error);
        return callback(error);
      }

      this.customerDAO.getPaymentHistoryCount(customerId, (countError, totalCount) => {
        if (countError) {
          console.error('Get payment history count error:', countError);
          return callback(countError);
        }
        
        callback(null, {
          payments,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            limit
          }
        });
      });
    });
  }

  /**
   * Update customer address
   */
  updateCustomerAddress(customerId, addressData, callback) {
    this.customerDAO.updateCustomerAddress(customerId, addressData, (error, result) => {
      if (error) {
        console.error('Update customer address error:', error);
        return callback(null, {
          success: false,
          message: error.message || 'Failed to update address'
        });
      }
      
      callback(null, {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Address updated successfully' : 'No changes made'
      });
    });
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
  getTopCustomers(limit = 10, callback) {
    this.customerDAO.getTopCustomers(limit, callback);
  }

  /**
   * Search customers for staff (werkende versie)
   */
  searchCustomersForStaff(query, callback) {
    this.customerDAO.searchCustomersBasic(query, (error, customers) => {
      if (error) {
        console.error('CustomerService searchCustomersForStaff error:', error);
        return callback(null, []);
      }
      callback(null, customers);
    });
  }

  /**
   * Alle klanten voor staff interface
   */
  getAllCustomersForStaff(callback) {
    this.customerDAO.getAllActiveCustomers((error, customers) => {
      if (error) {
        console.error('CustomerService getAllCustomersForStaff error:', error);
        return callback(null, []);
      }
      callback(null, customers);
    });
  }

  /**
   * Change customer password (for staff - no current password required)
   */
  changeCustomerPassword(customerId, newPassword, callback) {
    console.log('CustomerService changeCustomerPassword called with:', { customerId });
    
    // Hash the new password
    const bcrypt = require('bcrypt');
    bcrypt.hash(newPassword, 10, (hashError, hashedPassword) => {
      if (hashError) {
        console.error('Password hash error:', hashError);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
        });
      }
      
      // Update password in database
      this.customerDAO.updateCustomer(customerId, { 
        password: hashedPassword 
      }, (updateError, result) => {
        if (updateError) {
          console.error('CustomerService changeCustomerPassword error:', updateError);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
          });
        }
        
        if (result.success) {
          callback(null, {
            success: true,
            message: 'Wachtwoord succesvol gewijzigd'
          });
        } else {
          callback(null, {
            success: false,
            message: result.message || 'Fout bij wijzigen wachtwoord'
          });
        }
      });
    });
  }

  getTotalCustomers(callback) {
    this.getTotalCustomersCount(callback);
  }
  /**
   * Statistieken voor staff dashboard
   */
  getTotalCustomers(callback) {
    this.customerDAO.getTotalCustomers((error, result) => {
      if (error) {
        console.error('CustomerService getTotalCustomers error:', error);
        return callback(null, { count: 0 });
      }
      callback(null, result);
    });
  }
}

module.exports = CustomerService;