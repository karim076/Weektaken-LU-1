const CustomerService = require('../services/CustomerService');

/**
 * Controller for customer operations using service layer
 */
class CustomerController {
  constructor() {
    this.customerService = new CustomerService();
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
}

module.exports = CustomerController;
