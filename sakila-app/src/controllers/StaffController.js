const CustomerService = require('../services/CustomerService');
const FilmService = require('../services/FilmService');
const RentalService = require('../services/RentalService');

class StaffController {
  constructor() {
    this.customerService = new CustomerService();
    this.filmService = new FilmService();
    this.rentalService = new RentalService();
  }

  // Staff Dashboard
  async dashboard(req, res) {
    try {
      console.log('Staff Dashboard - User:', req.user.username, 'Role:', req.user.role);
      
      // Haal dashboard statistieken op
      const stats = await this.getStaffStats();
      const recentRentals = await this.rentalService.getRecentRentals(10);
      const overdueRentals = await this.rentalService.getOverdueRentals();
      
      res.render('dashboard', {
        title: 'Staff Dashboard',
        user: req.user,
        dashboardType: 'staff',
        stats,
        recentRentals: recentRentals.rentals || [],
        overdueRentals: overdueRentals.rentals || []
      });
    } catch (error) {
      console.error('Staff dashboard error:', error);
      res.status(500).render('error', {
        title: 'Dashboard Fout',
        status: 500,
        message: 'Kon dashboard niet laden'
      });
    }
  }

  // Alle klanten weergeven
  async getAllCustomers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const search = req.query.search || '';
      const limit = 20;
      
      const result = await this.customerService.getAllCustomers(page, limit, search);
      
      res.render('staff/customers', {
        title: 'Klantenbeheer',
        user: req.user,
        customers: result.customers || [],
        pagination: result.pagination || {},
        search
      });
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).render('error', {
        title: 'Klanten Fout',
        status: 500,
        message: 'Kon klanten niet laden'
      });
    }
  }

  // Klant details
  async getCustomerDetails(req, res) {
    try {
      const customerId = req.params.id;
      const customer = await this.customerService.getCustomerDetails(customerId);
      
      if (!customer) {
        return res.status(404).render('error', {
          title: 'Klant Niet Gevonden',
          status: 404,
          message: 'Klant bestaat niet'
        });
      }
      
      // Haal klant verhuurgeschiedenis op
      const rentals = await this.rentalService.getCustomerRentals(customerId);
      
      res.render('staff/customer-details', {
        title: `Klant: ${customer.full_name}`,
        user: req.user,
        customer,
        rentals: rentals.rentals || []
      });
    } catch (error) {
      console.error('Customer details error:', error);
      res.status(500).render('error', {
        title: 'Klant Details Fout',
        status: 500,
        message: 'Kon klantgegevens niet laden'
      });
    }
  }

  // Klant bewerken
  async editCustomer(req, res) {
    try {
      const customerId = req.params.id;
      const updates = req.body;
      
      const result = await this.customerService.updateCustomer(customerId, updates);
      
      if (result.success) {
        req.flash = req.flash || {};
        req.flash.success = 'Klantgegevens succesvol bijgewerkt';
        res.redirect(`/staff/customers/${customerId}`);
      } else {
        res.status(400).render('staff/customer-details', {
          title: 'Klant Bewerken',
          user: req.user,
          customer: await this.customerService.getCustomerDetails(customerId),
          error: result.message
        });
      }
    } catch (error) {
      console.error('Edit customer error:', error);
      res.status(500).render('error', {
        title: 'Bewerken Fout',
        status: 500,
        message: 'Kon klantgegevens niet bijwerken'
      });
    }
  }

  // Verhuur beheer pagina
  async rentalManagement(req, res) {
    try {
      res.render('staff/rental-management', {
        title: 'Verhuur Beheer',
        user: req.user
      });
    } catch (error) {
      console.error('Rental management error:', error);
      res.status(500).render('error', {
        title: 'Verhuur Beheer Fout',
        status: 500,
        message: 'Kon verhuur beheer niet laden'
      });
    }
  }

  // Film uitgeven
  async checkoutFilm(req, res) {
    try {
      const { customer_id, film_id, rental_duration } = req.body;
      const staff_id = req.user.user_id;
      
      const result = await this.rentalService.createRental({
        customer_id,
        film_id,
        staff_id,
        rental_duration: rental_duration || 3
      });
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Film succesvol uitgegeven',
          rental: result.rental
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Checkout film error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij uitgeven film'
      });
    }
  }

  // Film innemen
  async checkinFilm(req, res) {
    try {
      const { rental_id } = req.body;
      const staff_id = req.user.staff_id || req.user.user_id; // Handle both staff_id and user_id
      
      console.log('CheckinFilm called with:', { rental_id, staff_id, user: req.user });
      
      const result = await this.rentalService.returnRental(rental_id, staff_id);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Film succesvol ingenomen',
          rental: result.rental
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Checkin film error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij innemen film'
      });
    }
  }

  // Verhuur status updaten
  async updateRentalStatus(req, res) {
    try {
      const rentalId = req.params.id;
      const { status } = req.body;
      
      const result = await this.rentalService.updateRentalStatus(rentalId, status);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Status succesvol bijgewerkt'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Update rental status error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij bijwerken status'
      });
    }
  }

  // API: Zoek klanten
  async searchCustomers(req, res) {
    try {
      const query = req.query.q || req.query.search || '';
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      if (req.query.q) {
        // Voor autocomplete - gebruik service layer
        const customers = await this.customerService.searchCustomersForStaff(query);
        res.json(customers || []);
      } else {
        // Voor paginatie
        const result = await this.customerService.getAllCustomers(
          parseInt(req.query.page) || 1,
          parseInt(req.query.limit) || 20,
          query
        );
        
        res.json({
          success: true,
          customers: result.customers || [],
          pagination: result.pagination || {}
        });
      }
    } catch (error) {
      console.error('Search customers error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij zoeken klanten: ' + error.message
      });
    }
  }

  // API: Zoek films
  async searchFilms(req, res) {
    try {
      const query = req.query.q || '';
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const films = await this.filmService.searchFilmsForStaff(query);
      res.json(films || []);
    } catch (error) {
      console.error('Search films error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij zoeken films: ' + error.message
      });
    }
  }

  // API: Verhuur details
  async getRentalDetails(req, res) {
    try {
      const rentalId = req.params.id;
      const rental = await this.rentalService.getRentalById(rentalId);
      
      if (rental) {
        res.json({
          success: true,
          rental
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Verhuur niet gevonden'
        });
      }
    } catch (error) {
      console.error('Get rental details error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij ophalen verhuur details'
      });
    }
  }

  // API: Update rental due date
  async updateRentalDueDateAPI(req, res) {
    try {
      const rentalId = req.params.id;
      const { due_date, reason } = req.body;
      
      // Debug logging for authentication
      console.log('updateRentalDueDateAPI called:', {
        rentalId,
        due_date,
        reason,
        user: req.user
      });
      
      const staffId = req.user.staff_id || req.user.user_id;
      console.log('Using staffId:', staffId);
      
      if (!due_date) {
        return res.status(400).json({
          success: false,
          message: 'Inleverdatum is verplicht'
        });
      }
      
      // Validate date format and ensure it's not in the past
      const newDueDate = new Date(due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(newDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Ongeldige datum format'
        });
      }
      
      if (newDueDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Inleverdatum kan niet in het verleden liggen'
        });
      }
      
      const result = await this.rentalService.updateDueDate(rentalId, due_date, staffId, reason);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Inleverdatum succesvol bijgewerkt',
          due_date: due_date
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Fout bij bijwerken inleverdatum'
        });
      }
    } catch (error) {
      console.error('Update rental due date error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij bijwerken inleverdatum'
      });
    }
  }

  // Helper: Staff statistieken
  async getStaffStats() {
    try {
      const [
        totalCustomers,
        totalRentals,
        activeRentals,
        overdueCount,
        todayRentals
      ] = await Promise.all([
        this.customerService.getTotalCustomers(),
        this.rentalService.getTotalRentals(),
        this.rentalService.getActiveRentals(),
        this.rentalService.getOverdueCount(),
        this.rentalService.getTodayRentals()
      ]);

      return {
        totalCustomers: totalCustomers.count || 0,
        totalRentals: totalRentals.count || 0,
        activeRentals: activeRentals.count || 0,
        overdueCount: overdueCount.count || 0,
        todayRentals: todayRentals.count || 0
      };
    } catch (error) {
      console.error('Get staff stats error:', error);
      return {
        totalCustomers: 0,
        totalRentals: 0,
        activeRentals: 0,
        overdueCount: 0,
        todayRentals: 0
      };
    }
  }

  // API: Huidige verhuur (alleen in behandeling/pending)
  async getCurrentRentals(req, res) {
    try {
      const rentals = await this.rentalService.getPendingRentals();
      
      res.json({
        success: true,
        rentals: rentals.rentals || []
      });
    } catch (error) {
      console.error('Get current rentals error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij ophalen huidige verhuur'
      });
    }
  }

  // API: Te late verhuur
  async getOverdueRentals(req, res) {
    try {
      const rentals = await this.rentalService.getOverdueRentals();
      
      res.json({
        success: true,
        rentals: rentals.rentals || []
      });
    } catch (error) {
      console.error('Get overdue rentals error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij ophalen te late verhuur'
      });
    }
  }

  // API: In behandeling verhuur (voor dashboard)
  async getPendingRentals(req, res) {
    try {
      const rentals = await this.rentalService.getPendingRentals();
      
      res.json({
        success: true,
        rentals: rentals.rentals || []
      });
    } catch (error) {
      console.error('Get pending rentals error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij ophalen in behandeling verhuur'
      });
    }
  }

  // API: Alle klanten (voor klantenbeheer)
  async getAllCustomersAPI(req, res) {
    try {
      const customers = await this.customerService.getAllCustomersForStaff();
      res.json(customers || []);
    } catch (error) {
      console.error('Get all customers API error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij ophalen klanten: ' + error.message
      });
    }
  }

  // API: Alle verhuur (voor verhuurbeheer)
  async getAllRentalsAPI(req, res) {
    try {
      const rentals = await this.rentalService.getAllRentalsForStaff();
      res.json(rentals || []);
    } catch (error) {
      console.error('Get all rentals API error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij ophalen verhuur'
      });
    }
  }

  // API: Nieuwe verhuur aanmaken (voor snelle verhuur)
  async createRental(req, res) {
    try {
      const { customer_id, film_id } = req.body;
      
      if (!customer_id || !film_id) {
        return res.status(400).json({
          success: false,
          message: 'Klant ID en Film ID zijn verplicht'
        });
      }

      const result = await this.rentalService.createRental({
        customer_id: parseInt(customer_id),
        film_id: parseInt(film_id),
        staff_id: req.user.staff_id || req.user.user_id
      });

      res.json({
        success: true,
        rental_id: result.rental_id,
        return_date: result.return_date,
        message: 'Verhuur succesvol aangemaakt'
      });
    } catch (error) {
      console.error('Create rental error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Fout bij aanmaken verhuur'
      });
    }
  }

  // API: Klant details met verhuur geschiedenis
  async getCustomerDetailsAPI(req, res) {
    try {
      const customerId = req.params.id;
      console.log('Getting customer details for ID:', customerId);
      
      const customerResult = await this.customerService.getCustomerDetails(customerId);
      console.log('Customer result:', customerResult);
      
      if (!customerResult.success) {
        return res.status(404).json({
          success: false,
          message: customerResult.message || 'Klant niet gevonden'
        });
      }

      const rentals = await this.rentalService.getCustomerAllRentals(customerId);
      console.log('Rentals for customer details:', rentals ? rentals.length : 0);

      res.json({
        success: true,
        customer: customerResult.data,
        rentals: rentals || []
      });
    } catch (error) {
      console.error('Get customer details API error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij ophalen klant details: ' + error.message
      });
    }
  }

  // API: Klant gegevens bijwerken
  async updateCustomerAPI(req, res) {
    try {
      const customerId = req.params.id;
      const updates = req.body;
      
      console.log('Updating customer', customerId, 'with data:', updates);
      
      const result = await this.customerService.updateCustomer(customerId, updates);
      console.log('Update result:', result);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Klantgegevens succesvol bijgewerkt',
          customer: result.customer
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Update customer API error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij bijwerken klant: ' + error.message
      });
    }
  }

  // API: Klant verhuur (films die hij heeft gehuurd)
  async getCustomerRentalsAPI(req, res) {
    try {
      const customerId = req.params.id;
      console.log('Getting rentals for customer ID:', customerId);
      
      const rentals = await this.rentalService.getCustomerAllRentals(customerId);
      console.log('Rentals found:', rentals ? rentals.length : 0);
      console.log('Sample rental data:', rentals ? rentals.slice(0, 2) : 'No rentals');
      
      res.json({
        success: true,
        rentals: rentals || []
      });
    } catch (error) {
      console.error('Get customer rentals API error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij ophalen verhuur: ' + error.message
      });
    }
  }

  // API: Klant verwijderen
  async deleteCustomerAPI(req, res) {
    try {
      const customerId = req.params.id;
      
      const result = await this.customerService.deleteCustomer(customerId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          returnedFilms: result.returnedFilms
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Delete customer API error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij verwijderen klant: ' + error.message
      });
    }
  }

  // API: Verhuur status wijzigen (voor staff)
  async updateRentalStatusAPI(req, res) {
    try {
      const rentalId = req.params.id;
      const { status } = req.body;
      const staffId = req.user.staff_id || req.user.user_id;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is verplicht'
        });
      }

      const result = await this.rentalService.updateRentalStatus(rentalId, status, staffId);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Status succesvol bijgewerkt',
          rental: result.rental
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Update rental status API error:', error);
      res.status(500).json({
        success: false,
        message: 'Fout bij bijwerken status: ' + error.message
      });
    }
  }

  // API: Update customer profile (staff version - can edit any customer)
  async updateCustomerProfileAPI(req, res) {
    try {
      const customerId = req.params.id;
      const profileData = req.body;
      console.log(`[StaffController] Update customer profile API called for ID: ${customerId}`, profileData);
      
      const result = await this.customerService.updateCustomer(customerId, profileData);
      console.log(`[StaffController] Update customer profile result:`, result);
      
      res.json(result);
    } catch (error) {
      console.error(`[StaffController] Error in update customer profile API:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Fout bij het bijwerken van klantprofiel' 
      });
    }
  }

  // API: Change customer password (staff version - can change any customer password)
  async changeCustomerPasswordAPI(req, res) {
    try {
      const customerId = req.params.id;
      const { new_password, confirm_password } = req.body;
      console.log(`[StaffController] Change customer password API called for ID: ${customerId}`);
      
      // Validation
      if (!new_password) {
        return res.json({ success: false, message: 'Nieuw wachtwoord is vereist.' });
      }
      if (new_password.length < 6) {
        return res.json({ success: false, message: 'Nieuw wachtwoord moet minstens 6 tekens bevatten.' });
      }
      if (new_password !== confirm_password) {
        return res.json({ success: false, message: 'Wachtwoorden komen niet overeen.' });
      }

      // Staff can change any customer password without knowing current password
      const result = await this.customerService.changeCustomerPassword(customerId, new_password);
      console.log(`[StaffController] Change customer password result:`, result);
      
      res.json(result);
    } catch (error) {
      console.error(`[StaffController] Error in change customer password API:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Fout bij het wijzigen van wachtwoord' 
      });
    }
  }
}

module.exports = StaffController;
