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
  index = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const search = req.query.search || '';

      const result = await this.customerService.getCustomersForDashboard(search, page, limit);

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
    } catch (error) {
      console.error('Customer index error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van klanten'
      });
    }
  };

  /**
   * Show individual customer details (US2E1)
   */
  show = async (req, res) => {
    try {
      const customerId = req.params.id;

      const result = await this.customerService.getCustomerDetails(customerId);

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
    } catch (error) {
      console.error('Customer show error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van klantgegevens'
      });
    }
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
  create = async (req, res) => {
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
      const result = await this.customerService.createCustomer({
        firstName,
        lastName,
        email,
        phone: phone || '000-000-0000',
        address: address || 'Adres niet opgegeven',
        district: district || 'District',
        city: city || 'Stad'
      });

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
  showEdit = async (req, res) => {
    try {
      const customerId = req.params.id;

      const result = await this.customerService.getCustomerDetails(customerId);

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
  update = async (req, res) => {
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
  delete = async (req, res) => {
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
  search = async (req, res) => {
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
  showProfile = async (req, res) => {
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
  updateProfile = async (req, res) => {
    try {
      const customerId = req.user.user_id || req.user.customer_id || req.user.id;
      const { first_name, last_name, email } = req.body;

      if (!first_name || !last_name || !email) {
        return res.redirect('/customer/profile?error=All fields are required');
      }

      const result = await this.customerService.updateCustomer(customerId, {
        first_name,
        last_name,
        email
      });

      if (result.success) {
        res.redirect('/profile?success=Profile updated successfully');
      } else {
        res.redirect('/profile?error=' + encodeURIComponent(result.message));
      }
    } catch (error) {
      console.error('Update profile error:', error);
      res.redirect('/profile?error=An error occurred');
    }
  };

  /**
   * Get customer rentals
   */
  getRentals = async (req, res) => {
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
  getRentalDetails = async (req, res) => {
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
  createRental = async (req, res) => {
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
  getPayments = async (req, res) => {
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
}

module.exports = CustomerController;
