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
    try {
      const customerId = req.params.id;
      const { firstName, lastName, email, phone } = req.body;

      // Validation
      if (!firstName || !lastName || !email) {
        const customerResult = await this.customerService.getCustomerDetails(customerId);
        return res.render('staff/customer-edit', {
          title: 'Klant Bewerken',
          customer: customerResult.data,
          error: 'Verplichte velden: voornaam, achternaam en email',
          success: null
        });
      }

      const result = await this.customerService.updateCustomer(customerId, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone
      });

      const customerResult = await this.customerService.getCustomerDetails(customerId);

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
    } catch (error) {
      console.error('Customer update error:', error);
      const customerResult = await this.customerService.getCustomerDetails(req.params.id);
      res.render('staff/customer-edit', {
        title: 'Klant Bewerken',
        customer: customerResult.data || {},
        error: 'Er is een fout opgetreden bij het bijwerken van de klant',
        success: null
      });
    }
  };

  /**
   * Delete customer (US4E1)
   */
  delete = (req, res) => {
    try {
      const customerId = req.params.id;

      const result = await this.customerService.deactivateCustomer(customerId);

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
    } catch (error) {
      console.error('Customer delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het verwijderen van de klant'
      });
    }
  };

  /**
   * Search customers (AJAX endpoint)
   */
  search = (req, res) => {
    try {
      const { q: searchTerm, page = 1 } = req.query;

      const result = await this.customerService.searchCustomers(searchTerm, page, 20);

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
    } catch (error) {
      console.error('Customer search error:', error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het zoeken'
      });
    }
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
      const customer = await this.customerService.getCustomerById(customerId);
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
        const customerResult = await this.customerService.getCustomerById(customerId);
        if (!customerResult.success) {
          return res.redirect('/profile?error=' + encodeURIComponent('Kon huidige klantgegevens niet ophalen'));
        }

        // Verify current password
        const bcrypt = require('bcryptjs');
        const isValidPassword = await bcrypt.compare(current_password, customerResult.data.password || '');
        
        if (!isValidPassword) {
          return res.redirect('/profile?error=' + encodeURIComponent('Huidig wachtwoord is incorrect'));
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);
        updateData.password = hashedPassword;
      }

      const result = await this.customerService.updateCustomer(customerId, updateData);

      if (result.success) {
        const successMessage = new_password ? 
          'Profiel en wachtwoord succesvol bijgewerkt' : 
          'Profiel succesvol bijgewerkt';
        res.redirect('/profile?success=' + encodeURIComponent(successMessage));
      } else {
        res.redirect('/profile?error=' + encodeURIComponent(result.message));
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
      const result = await this.rentalService.getCustomerRentals(customerId, page, 10);
      
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
      
      const result = await this.rentalService.getRentalDetails(rentalId);
      
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

      const result = await this.rentalService.createRental(customerId, inventory_id);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
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
      
      const result = await this.customerService.getPaymentHistory(customerId, page, 10);
      
      res.render('customer/payments', {
        title: 'Mijn Betalingen - Sakila',
        user: req.user,
        payments: result.payments,
        pagination: result.pagination
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
  getCustomerRentalsData = (customerId) => {
    try {
      console.log('=== getCustomerRentalsData called for customer:', customerId);
      console.log('=== this.rentalService:', typeof this.rentalService);
      console.log('=== getCustomerRentals function:', typeof this.rentalService.getCustomerRentals);
      
      // Use RentalService directly for better data
      const result = await this.rentalService.getCustomerRentals(customerId, 1, 100);
      
      console.log('RentalService result:', result);
      
      if (!result.success) {
        return {
          success: false,
          message: 'Er is een fout opgetreden bij het laden van de verhuurgegevens'
        };
      }
      
      const rentals = result.rentals || [];
      const stats = result.stats || {};
      
      console.log('Rentals data for customer', customerId, ':', rentals.length, 'rentals found');
      console.log('Stats data:', stats);
      
      return {
        success: true,
        rentals: rentals,
        stats: stats
      };
    } catch (error) {
      console.error('Get customer rentals data error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het laden van de verhuurgegevens'
      };
    }
  };

  /**
   * Get customer profile data for AJAX
   */
  getCustomerProfileData = (customerId) => {
    try {
      const customer = await this.customerService.getCustomerById(customerId);
      
      if (!customer) {
        return {
          success: false,
          message: 'Klant niet gevonden'
        };
      }
      
      return {
        success: true,
        customer: customer
      };
    } catch (error) {
      console.error('Get customer profile data error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het laden van de profielgegevens'
      };
    }
  };

  /**
   * Update customer profile via AJAX
   */
  updateCustomerProfile = (customerId, profileData) => {
    try {
      const result = await this.customerService.updateCustomer(customerId, profileData);
      
      if (result.success) {
        return {
          success: true,
          message: 'Profiel succesvol bijgewerkt'
        };
      } else {
        return {
          success: false,
          message: result.message
        };
      }
    } catch (error) {
      console.error('Update customer profile error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het bijwerken van het profiel'
      };
    }
  };

  /**
   * Change customer password
   */
  changeCustomerPassword = (customerId, currentPassword, newPassword) => {
    try {
      // Get customer password directly from database
      const CustomerDAO = require('../dao/CustomerDAO');
      const customerDAO = new CustomerDAO();
      
      const customerSql = 'SELECT password FROM customer WHERE customer_id = ?';
      const customerResult = await customerDAO.query(customerSql, [customerId]);
      
      if (!customerResult.length) {
        return {
          success: false,
          message: 'Klant niet gevonden'
        };
      }

      // Verify current password
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(currentPassword, customerResult[0].password || '');
      
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Huidig wachtwoord is incorrect'
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update only the password
      const result = await this.customerService.updateCustomer(customerId, {
        password: hashedPassword
      });

      return {
        success: result.success,
        message: result.success ? 'Wachtwoord succesvol gewijzigd' : result.message
      };
    } catch (error) {
      console.error('Change customer password error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
      };
    }
  };
}

module.exports = CustomerController;
