const CustomerService = require('../services/CustomerService');
const RentalService = require('../services/RentalService');

/**
 * Controller for customer operations using service layer
 */
class CustomerController {
  constructor() {
    this.customerService = new CustomerService();
    this.rentalService = new RentalService();
  }

  /**
   * Staff dashboard - customer overview (US2E1)
   */
  index = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const search = req.query.search || '';

    this.customerService.getCustomersForDashboard(search, page, limit, (error, result) => {
      if (error) {
        console.error('Customer index error:', error);
        return res.status(500).render('error', {
          title: 'Server Fout',
          status: 500,
          message: 'Er is een fout opgetreden bij het laden van klanten'
        });
      }

      if (!result.success) {
        return res.status(500).render('error', {
          title: 'Server Fout',
          status: 500,
          message: result.message
        });
      }

      res.render('staff/customers', {
        title: 'Klanten Beheer - Sakila Staff',
        customers: result.data.customers,
        stats: result.data.stats,
        pagination: result.data.pagination,
        search
      });
    });
  };

  /**
   * Show individual customer details (US2E1)
   */
  show = (req, res) => {
    const customerId = req.params.id;

    this.customerService.getCustomerDetails(customerId, (error, result) => {
      if (error) {
        console.error('Customer show error:', error);
        return res.status(500).render('error', {
          title: 'Server Fout',
          status: 500,
          message: 'Er is een fout opgetreden bij het laden van klantgegevens'
        });
      }

      if (!result.success) {
        return res.status(404).render('error', {
          title: 'Klant Niet Gevonden',
          status: 404,
          message: result.message
        });
      }

      res.render('staff/customer-detail', {
        title: `Klant Details - ${result.data.first_name} ${result.data.last_name}`,
        customer: result.data
      });
    });
  };

  /**
   * Show customer create form (US1E1)
   */
  showCreate = (req, res) => {
    try {
      res.render('staff/customer-create', {
        title: 'Nieuwe Klant Toevoegen',
        error: null,
        success: null
      });
    } catch (error) {
      console.error('Customer show create error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van het formulier'
      });
    }
  };

  /**
   * Create new customer (US1E1)
   */
  create = (req, res) => {
    try {
      const { firstName, lastName, email, phone, address, district, city } = req.body;

      // Validation (NF-02: No code duplication - centralized validation)
      if (!firstName || !lastName || !email) {
        return res.render('staff/customer-create', {
          title: 'Nieuwe Klant Toevoegen',
          error: 'Verplichte velden: voornaam, achternaam en email',
          success: null
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.render('staff/customer-create', {
          title: 'Nieuwe Klant Toevoegen',
          error: 'Ongeldig email adres',
          success: null
        });
      }

      // Use service layer for business logic
      this.customerService.createCustomer({
        firstName,
        lastName,
        email,
        phone: phone || '000-000-0000',
        address: address || 'Adres niet opgegeven',
        district: district || 'District',
        city: city || 'Stad'
      }, (error, result) => {
        if (error) {
          console.error('Customer create error:', error);
          return res.status(500).render('error', {
            title: 'Server Fout',
            status: 500,
            message: 'Er is een fout opgetreden bij het aanmaken van de klant'
          });
        }

        if (!result.success) {
          return res.render('staff/customer-create', {
            title: 'Nieuwe Klant Toevoegen',
            error: result.message,
            success: null
          });
        }

        res.render('staff/customer-create', {
          title: 'Nieuwe Klant Toevoegen',
          error: null,
          success: 'Klant succesvol toegevoegd!'
        });
      });
    } catch (error) {
      console.error('Customer create error:', error);
      res.render('staff/customer-create', {
        title: 'Nieuwe Klant Toevoegen',
        error: 'Er is een fout opgetreden bij het toevoegen van de klant',
        success: null
      });
    }
  };

  /**
   * Show customer edit form (US3E1)
   */
  showEdit = (req, res) => {
    try {
      const customerId = req.params.id;

      this.customerService.getCustomerDetails(customerId, (error, result) => {
        if (error) {
          console.error('Customer showEdit error:', error);
          return res.status(500).render('error', {
            title: 'Server Fout',
            status: 500,
            message: 'Er is een fout opgetreden bij het laden van klantgegevens'
          });
        }

        if (!result.success) {
          return res.status(404).render('error', {
            title: 'Klant Niet Gevonden',
            status: 404,
            message: result.message
          });
        }

        res.render('staff/customer-edit', {
          title: `Klant Bewerken - ${result.data.first_name} ${result.data.last_name}`,
          customer: result.data,
          error: null,
          success: null
        });
      });
    } catch (error) {
      console.error('Customer show edit error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van het formulier'
      });
    }
  };

  /**
   * Update customer (US3E1)
   */
  update = (req, res) => {
    const customerId = req.params.id;
    const { firstName, lastName, email, phone } = req.body;

    // Validation
    if (!firstName || !lastName || !email) {
      this.customerService.getCustomerDetails(customerId, (error, customerResult) => {
        if (error) {
          console.error('Customer update validation error:', error);
          return res.status(500).render('error', {
            title: 'Server Fout',
            status: 500,
            message: 'Er is een fout opgetreden'
          });
        }
        
        return res.render('staff/customer-edit', {
          title: 'Klant Bewerken',
          customer: customerResult.data,
          error: 'Verplichte velden: voornaam, achternaam en email',
          success: null
        });
      });
      return;
    }

    const updateData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone
    };

    this.customerService.updateCustomer(customerId, updateData, (updateError, result) => {
      if (updateError) {
        console.error('Customer update error:', updateError);
        return this.customerService.getCustomerDetails(customerId, (detailError, customerResult) => {
          res.render('staff/customer-edit', {
            title: 'Klant Bewerken',
            customer: customerResult ? customerResult.data : {},
            error: 'Er is een fout opgetreden bij het bijwerken van de klant',
            success: null
          });
        });
      }

      this.customerService.getCustomerDetails(customerId, (detailError, customerResult) => {
        if (detailError) {
          console.error('Customer detail fetch error:', detailError);
          return res.render('staff/customer-edit', {
            title: 'Klant Bewerken',
            customer: {},
            error: 'Er is een fout opgetreden',
            success: null
          });
        }

        if (!result.success) {
          return res.render('staff/customer-edit', {
            title: 'Klant Bewerken',
            customer: customerResult.data,
            error: result.message,
            success: null
          });
        }

        res.render('staff/customer-edit', {
          title: 'Klant Bewerken',
          customer: customerResult.data,
          error: null,
          success: 'Klant succesvol bijgewerkt!'
        });
      });
    });
  };

  /**
   * Delete customer (US4E1)
   */
  delete = (req, res) => {
    const customerId = req.params.id;

    this.customerService.deactivateCustomer(customerId, (error, result) => {
      if (error) {
        console.error('Customer delete error:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het verwijderen van de klant'
        });
      }

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: 'Klant succesvol gedeactiveerd'
      });
    });
  };

  /**
   * Search customers (AJAX endpoint)
   */
  search = (req, res) => {
    const { q: searchTerm, page = 1 } = req.query;

    this.customerService.searchCustomers(searchTerm, page, 20, (error, result) => {
      if (error) {
        console.error('Customer search error:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het zoeken'
        });
      }

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        data: result.data
      });
    });
  };

  /**
   * Show customer profile page
   */
  showProfile = (req, res) => {
    try {
      // Get customer ID from user session (try different possible field names)
      const customerId = req.user.user_id || req.user.customer_id || req.user.id;
      
      console.log('Profile debug info:');
      console.log('  User object:', req.user);
      console.log('  Customer ID:', customerId);
      
      if (!customerId) {
        return res.status(400).render('error', {
          title: 'Invalid User',
          status: 400,
          message: 'Unable to identify customer from session'
        });
      }
      
      console.log('  Calling customerService.getCustomerById with ID:', customerId);
      this.customerService.getCustomerById(customerId, (error, customer) => {
        if (error) {
          console.error('  Customer service error:', error);
          return res.status(500).render('error', {
            title: 'Server Error',
            status: 500,
            message: 'Unable to load customer data'
          });
        }

        console.log('  Customer service returned:', customer);
        
        if (!customer) {
          console.log('  No customer found with ID:', customerId);
          return res.status(404).render('error', {
            title: 'Customer Not Found',
            status: 404,
            message: `Customer data could not be loaded for ID: ${customerId}`
          });
        }

        console.log('  Rendering profile page with customer:', customer.first_name, customer.last_name);
        console.log('  About to call res.render with template: profile-simple');
        
        res.render('profile-simple', {
          title: 'My Profile - Sakila',
          user: req.user,
          customer,
          success: req.query.success,
          error: req.query.error
        });
        
        console.log('  res.render called successfully');
      });
    } catch (error) {
      console.error('Show profile error:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        status: 500,
        message: 'An error occurred while loading your profile: ' + error.message
      });
    }
  };

  /**
   * Update customer profile
   */
  updateProfile = (req, res) => {
    try {
      const customerId = req.user.user_id || req.user.customer_id || req.user.id;
      const { 
        first_name, 
        last_name, 
        email, 
        phone, 
        address, 
        postal_code, 
        city, 
        country, 
        birth_date,
        language, 
        preferred_store, 
        email_notifications, 
        marketing_emails, 
        notes,
        current_password,
        new_password,
        confirm_password
      } = req.body;

      // Validate required fields
      if (!first_name || !last_name || !email) {
        return res.redirect('/profile?error=' + encodeURIComponent('Voornaam, achternaam en email zijn verplicht'));
      }

      // Email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return res.redirect('/profile?error=' + encodeURIComponent('Email adres is niet geldig'));
      }

      // Password validation if changing password
      if (new_password || current_password || confirm_password) {
        if (!current_password) {
          return res.redirect('/profile?error=' + encodeURIComponent('Huidig wachtwoord is vereist om je wachtwoord te wijzigen'));
        }
        if (!new_password) {
          return res.redirect('/profile?error=' + encodeURIComponent('Nieuw wachtwoord is vereist'));
        }
        if (new_password.length < 6) {
          return res.redirect('/profile?error=' + encodeURIComponent('Nieuw wachtwoord moet minstens 6 tekens bevatten'));
        }
        if (new_password !== confirm_password) {
          return res.redirect('/profile?error=' + encodeURIComponent('Wachtwoorden komen niet overeen'));
        }
      }

      // Prepare update data
      const updateData = {
        first_name,
        last_name,
        email,
        phone: phone || null,
        address: address || null,
        postal_code: postal_code || null,
        city: city || null,
        country: country || 'Nederland',
        birth_date: birth_date || null,
        language: language || 'nl',
        preferred_store: preferred_store || null,
        email_notifications: email_notifications === 'on',
        marketing_emails: marketing_emails === 'on',
        notes: notes || null
      };

      // If password change is requested, verify current password first
      if (new_password) {
        const AuthService = require('../services/AuthService');
        const authService = new AuthService();
        
        // Get current customer data to verify password
        this.customerService.getCustomerById(customerId, (customerError, customerResult) => {
          if (customerError || !customerResult.success) {
            return res.redirect('/profile?error=' + encodeURIComponent('Kon huidige klantgegevens niet ophalen'));
          }

          // Verify current password
          const bcrypt = require('bcryptjs');
          bcrypt.compare(current_password, customerResult.data.password || '', (compareError, isValidPassword) => {
            if (compareError) {
              return res.redirect('/profile?error=' + encodeURIComponent('Fout bij wachtwoord verificatie'));
            }
            
            if (!isValidPassword) {
              return res.redirect('/profile?error=' + encodeURIComponent('Huidig wachtwoord is incorrect'));
            }

            // Hash new password
            bcrypt.hash(new_password, 10, (hashError, hashedPassword) => {
              if (hashError) {
                return res.redirect('/profile?error=' + encodeURIComponent('Fout bij wachtwoord versleuteling'));
              }
              
              updateData.password = hashedPassword;
              
              // Update customer with new password
              this.customerService.updateCustomer(customerId, updateData, (updateError, result) => {
                if (updateError || !result.success) {
                  return res.redirect('/profile?error=' + encodeURIComponent(result?.message || 'Fout bij bijwerken profiel'));
                }

                const successMessage = 'Profiel en wachtwoord succesvol bijgewerkt';
                res.redirect('/profile?success=' + encodeURIComponent(successMessage));
              });
            });
          });
        });
      } else {
        // No password change, just update profile
        this.customerService.updateCustomer(customerId, updateData, (updateError, result) => {
          if (updateError || !result.success) {
            return res.redirect('/profile?error=' + encodeURIComponent(result?.message || 'Fout bij bijwerken profiel'));
          }

          const successMessage = 'Profiel succesvol bijgewerkt';
          res.redirect('/profile?success=' + encodeURIComponent(successMessage));
        });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      res.redirect('/profile?error=' + encodeURIComponent('Er is een fout opgetreden bij het bijwerken van je profiel'));
    }
  };

  /**
   * Get customer rentals
   */
  getRentals = (req, res) => {
    try {
      const customerId = req.user.user_id;
      const page = parseInt(req.query.page) || 1;
      
      console.log('Getting rentals for customer:', customerId);
      this.rentalService.getCustomerRentals(customerId, page, 10, (error, result) => {
        if (error) {
          console.error('Get rentals error:', error);
          return res.status(500).render('error', {
            title: 'Server Fout',
            status: 500,
            message: 'Er is een fout opgetreden bij het laden van uw verhuur'
          });
        }
        
        console.log('First rental result:', result.rentals?.[0]);
        console.log('Stats result:', result.stats);
        
        if (!result.success) {
          return res.status(500).render('error', {
            title: 'Server Fout',
            status: 500,
            message: result.message
          });
        }
        
        res.render('customer/rentals', {
          title: 'Mijn Verhuur - Sakila',
          user: req.user,
          rentals: result.rentals,
          activeRentals: result.activeRentals,
          stats: result.stats,
          pagination: result.pagination,
          success: req.query.success,
          error: req.query.error
        });
      });
    } catch (error) {
      console.error('Get rentals error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van uw verhuur'
      });
    }
  };

  /**
   * Get rental details
   */
  getRentalDetails = (req, res) => {
    try {
      const customerId = req.user.user_id;
      const rentalId = req.params.id;
      
      this.rentalService.getRentalDetails(rentalId, (error, result) => {
        if (error) {
          console.error('Get rental details error:', error);
          return res.status(500).render('error', {
            title: 'Server Fout',
            status: 500,
            message: 'Er is een fout opgetreden'
          });
        }
        
        if (!result.success) {
          return res.status(404).render('error', {
            title: 'Verhuur Niet Gevonden',
            status: 404,
            message: result.message
          });
        }

        // Verify this rental belongs to the logged-in customer
        if (result.rental.customer_id !== customerId) {
          return res.status(403).render('error', {
            title: 'Toegang Geweigerd',
            status: 403,
            message: 'U mag alleen uw eigen verhuur bekijken'
          });
        }
        
        res.render('customer/rental-details', {
          title: 'Verhuur Details - Sakila',
          user: req.user,
          rental: result.rental
        });
      });
    } catch (error) {
      console.error('Get rental details error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden'
      });
    }
  };

  /**
   * Create new rental (rent a film)
   */
  createRental = (req, res) => {
    try {
      const customerId = req.user.user_id;
      const { inventory_id } = req.body;

      if (!inventory_id) {
        return res.status(400).json({
          success: false,
          message: 'Inventory ID is required'
        });
      }

      this.rentalService.createRental(customerId, inventory_id, (error, result) => {
        if (error) {
          console.error('Create rental error:', error);
          return res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het huren van de film'
          });
        }
        
        if (!result.success) {
          return res.status(400).json(result);
        }

        res.json(result);
      });
    } catch (error) {
      console.error('Create rental error:', error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het huren van de film'
      });
    }
  };

  /**
   * Get customer payments
   */
  getPayments = (req, res) => {
    try {
      const customerId = req.user.user_id;
      const page = parseInt(req.query.page) || 1;
      
      this.customerService.getPaymentHistory(customerId, page, 10, (error, result) => {
        if (error) {
          console.error('Get payments error:', error);
          return res.status(500).render('error', {
            title: 'Server Fout',
            status: 500,
            message: 'Er is een fout opgetreden bij het laden van uw betalingen'
          });
        }
        
        res.render('customer/payments', {
          title: 'Mijn Betalingen - Sakila',
          user: req.user,
          payments: result.payments,
          pagination: result.pagination
        });
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van uw betalingen'
      });
    }
  };

  /**
   * Get customer rentals data for AJAX
   */
  getCustomerRentalsData = (customerId, callback) => {
    try {
      console.log('=== getCustomerRentalsData called for customer:', customerId);
      console.log('=== this.rentalService:', typeof this.rentalService);
      console.log('=== getCustomerRentals function:', typeof this.rentalService.getCustomerRentals);
      
      // Use RentalService directly for better data
      this.rentalService.getCustomerRentals(customerId, 1, 100, (error, result) => {
        if (error) {
          console.error('Get customer rentals data error:', error);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het laden van de verhuurgegevens'
          });
        }
        
        console.log('RentalService result:', result);
        
        if (!result.success) {
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het laden van de verhuurgegevens'
          });
        }
        
        const rentals = result.rentals || [];
        const stats = result.stats || {};
        
        console.log('Rentals data for customer', customerId, ':', rentals.length, 'rentals found');
        console.log('Stats data:', stats);
        
        callback(null, {
          success: true,
          rentals: rentals,
          stats: stats
        });
      });
    } catch (error) {
      console.error('Get customer rentals data error:', error);
      callback(null, {
        success: false,
        message: 'Er is een fout opgetreden bij het laden van de verhuurgegevens'
      });
    }
  };

  /**
   * Get customer profile data for AJAX
   */
  getCustomerProfileData = (customerId, callback) => {
    try {
      this.customerService.getCustomerById(customerId, (error, customer) => {
        if (error) {
          console.error('Get customer profile data error:', error);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het laden van de profielgegevens'
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
          customer: customer
        });
      });
    } catch (error) {
      console.error('Get customer profile data error:', error);
      callback(null, {
        success: false,
        message: 'Er is een fout opgetreden bij het laden van de profielgegevens'
      });
    }
  };

  /**
   * Update customer profile via AJAX
   */
  updateCustomerProfile = (customerId, profileData, callback) => {
    try {
      this.customerService.updateCustomer(customerId, profileData, (error, result) => {
        if (error) {
          console.error('Update customer profile error:', error);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het bijwerken van het profiel'
          });
        }
        
        if (result.success) {
          callback(null, {
            success: true,
            message: 'Profiel succesvol bijgewerkt'
          });
        } else {
          callback(null, {
            success: false,
            message: result.message
          });
        }
      });
    } catch (error) {
      console.error('Update customer profile error:', error);
      callback(null, {
        success: false,
        message: 'Er is een fout opgetreden bij het bijwerken van het profiel'
      });
    }
  };

  /**
   * Change customer password
   */
  changeCustomerPassword = (customerId, currentPassword, newPassword, callback) => {
    try {
      // Get customer password directly from database
      const CustomerDAO = require('../dao/CustomerDAO');
      const customerDAO = new CustomerDAO();
      
      const customerSql = 'SELECT password FROM customer WHERE customer_id = ?';
      customerDAO.query(customerSql, [customerId], (queryError, customerResult) => {
        if (queryError) {
          console.error('Change customer password error:', queryError);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
          });
        }
        
        if (!customerResult.length) {
          return callback(null, {
            success: false,
            message: 'Klant niet gevonden'
          });
        }

        // Verify current password
        const bcrypt = require('bcryptjs');
        bcrypt.compare(currentPassword, customerResult[0].password || '', (compareError, isValidPassword) => {
          if (compareError) {
            console.error('Password comparison error:', compareError);
            return callback(null, {
              success: false,
              message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
            });
          }
          
          if (!isValidPassword) {
            return callback(null, {
              success: false,
              message: 'Huidig wachtwoord is incorrect'
            });
          }

          // Hash new password
          bcrypt.hash(newPassword, 10, (hashError, hashedPassword) => {
            if (hashError) {
              console.error('Password hashing error:', hashError);
              return callback(null, {
                success: false,
                message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
              });
            }
            
            // Update only the password
            this.customerService.updateCustomer(customerId, {
              password: hashedPassword
            }, (updateError, result) => {
              if (updateError) {
                console.error('Customer update error:', updateError);
                return callback(null, {
                  success: false,
                  message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
                });
              }

              callback(null, {
                success: result.success,
                message: result.success ? 'Wachtwoord succesvol gewijzigd' : result.message
              });
            });
          });
        });
      });
    } catch (error) {
      console.error('Change customer password error:', error);
      callback(null, {
        success: false,
        message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
      });
    }
  };
}
// -----------------------------------------------------------------
// API methods for customer rental actions
// Add these methods to your existing CustomerController class

/**
 * Cancel rental (DELETE /customer/rentals/:id/cancel)
 */
cancelRental = (req, res) => {
  try {
    const customerId = req.user.user_id;
    const rentalId = req.params.id;
    
    console.log(`Attempting to cancel rental ${rentalId} for customer ${customerId}`);
    
    this.rentalService.cancelRental(rentalId, customerId, (error, result) => {
      if (error) {
        console.error('Cancel rental controller error:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het annuleren van de verhuur'
        });
      }
      
      if (result.success) {
        console.log('Rental cancelled successfully:', result.message);
        res.json({
          success: true,
          message: result.message
        });
      } else {
        console.log('Failed to cancel rental:', result.message);
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    });
  } catch (error) {
    console.error('Cancel rental controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het annuleren van de verhuur'
    });
  }
};

/**
 * Pay rental (POST /customer/rentals/:id/pay)
 */
payRental = (req, res) => {
  try {
    const customerId = req.user.user_id;
    const rentalId = req.params.id;
    const { amount } = req.body;
    
    console.log(`Attempting to pay rental ${rentalId} for customer ${customerId}, amount: €${amount}`);
    
    this.rentalService.payRental(rentalId, customerId, amount, (error, result) => {
      if (error) {
        console.error('Pay rental controller error:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij de betaling'
        });
      }
      
      if (result.success) {
        console.log('Rental payment successful:', result.message);
        res.json({
          success: true,
          message: result.message
        });
      } else {
        console.log('Failed to pay rental:', result.message);
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    });
  } catch (error) {
    console.error('Pay rental controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij de betaling'
    });
  }
};

/**
 * Return rental (POST /customer/rentals/:id/return)
 */
returnRental = (req, res) => {
  try {
    const customerId = req.user.user_id;
    const rentalId = req.params.id;
    
    console.log(`Attempting to return rental ${rentalId} for customer ${customerId}`);
    
    this.rentalService.returnRental(rentalId, customerId, (error, result) => {
      if (error) {
        console.error('Return rental controller error:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het inleveren'
        });
      }
      
      if (result.success) {
        console.log('Rental returned successfully:', result.message);
        res.json({
          success: true,
          message: result.message
        });
      } else {
        console.log('Failed to return rental:', result.message);
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    });
  } catch (error) {
    console.error('Return rental controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het inleveren'
    });
  }
};

/**
 * Extend rental (POST /customer/rentals/:id/extend)
 */
extendRental = (req, res) => {
  try {
    const customerId = req.user.user_id;
    const rentalId = req.params.id;
    
    console.log(`Attempting to extend rental ${rentalId} for customer ${customerId}`);
    
    this.rentalService.extendRental(rentalId, customerId, (error, result) => {
      if (error) {
        console.error('Extend rental controller error:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het verlengen'
        });
      }
      
      if (result.success) {
        console.log('Rental extended successfully:', result.message);
        res.json({
          success: true,
          message: result.message
        });
      } else {
        console.log('Failed to extend rental:', result.message);
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    });
  } catch (error) {
    console.error('Extend rental controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het verlengen'
    });
  }
};

/**
 * Get customer rentals data for AJAX (GET /customer/rentals-data)
 */
getCustomerRentalsData = (req, res) => {
  try {
    const customerId = req.user.user_id;
    
    // Use the existing method from the current controller
    this.getCustomerRentalsData(customerId, (error, result) => {
      if (error) {
        console.error('Error loading rentals data:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het laden van de verhuurgegevens'
        });
      }
      
      if (result.success) {
        res.json({
          success: true,
          rentals: result.rentals,
          stats: result.stats
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    });
  } catch (error) {
    console.error('Get customer rentals data error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het laden van de verhuurgegevens'
    });
  }
};

/**
 * Get customer profile data for AJAX (GET /customer/profile-data)
 */
getCustomerProfileData = (req, res) => {
  try {
    const customerId = req.user.user_id;
    
    // Use the existing method from the current controller
    this.getCustomerProfileData(customerId, (error, result) => {
      if (error) {
        console.error('Error loading profile data:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het laden van de profielgegevens'
        });
      }
      
      if (result.success) {
        res.json({
          success: true,
          customer: result.customer
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message
        });
      }
    });
  } catch (error) {
    console.error('Get customer profile data error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het laden van de profielgegevens'
    });
  }
};

/**
 * Update customer profile via AJAX (POST /customer/profile-update)
 */
updateCustomerProfile = (req, res) => {
  try {
    const customerId = req.user.user_id;
    
    const { 
      username,
      first_name, 
      last_name, 
      email, 
      phone, 
      address, 
      postal_code, 
      city, 
      country, 
      language 
    } = req.body;
    
    // Validation
    if (!username || !first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Gebruikersnaam, voornaam, achternaam en email zijn verplicht'
      });
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email adres is niet geldig'
      });
    }
    
    // Prepare data for update
    const updateData = {
      username,
      first_name,
      last_name,
      email,
      phone: phone || null,
      address: address || null,
      postal_code: postal_code || null,
      city: city || null,
      country: country || 'Nederland',
      language: language || 'nl'
    };
    
    // Use the existing method from the current controller
    this.updateCustomerProfile(customerId, updateData, (error, result) => {
      if (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het bijwerken van het profiel'
        });
      }
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Profiel succesvol bijgewerkt'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het bijwerken van het profiel'
    });
  }
};

/**
 * Change customer password (POST /customer/change-password)
 */
changeCustomerPassword = (req, res) => {
  try {
    const customerId = req.user.user_id;
    const { current_password, new_password, confirm_password } = req.body;
    
    // Validation
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Alle wachtwoord velden zijn verplicht'
      });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nieuw wachtwoord moet minstens 6 tekens bevatten'
      });
    }
    
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Wachtwoorden komen niet overeen'
      });
    }
    
    // Use the existing method from the current controller
    this.changeCustomerPassword(customerId, current_password, new_password, (error, result) => {
      if (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
        });
      }
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Wachtwoord succesvol gewijzigd'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
    });
  }
};

module.exports = CustomerController;
