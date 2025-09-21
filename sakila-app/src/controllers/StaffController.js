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
  dashboard(req, res) {
    console.log('Staff Dashboard - User:', req.user.username, 'Role:', req.user.role);
    
    // Haal dashboard statistieken op
    this.getStaffStats((statsError, stats) => {
      if (statsError) {
        console.error('Staff dashboard stats error:', statsError);
        return res.status(500).render('error', {
          title: 'Dashboard Fout',
          status: 500,
          message: 'Kon dashboard statistieken niet laden'
        });
      }
      
      this.rentalService.getRecentRentals(10, (recentError, recentRentals) => {
        if (recentError) {
          console.error('Staff dashboard recent rentals error:', recentError);
          return res.status(500).render('error', {
            title: 'Dashboard Fout',
            status: 500,
            message: 'Kon recente verhuur niet laden'
          });
        }
        
        this.rentalService.getOverdueRentals((overdueError, overdueRentals) => {
          if (overdueError) {
            console.error('Staff dashboard overdue rentals error:', overdueError);
            return res.status(500).render('error', {
              title: 'Dashboard Fout',
              status: 500,
              message: 'Kon achterstallige verhuur niet laden'
            });
          }
          
          res.render('dashboard', {
            title: 'Staff Dashboard',
            user: req.user,
            dashboardType: 'staff',
            stats,
            recentRentals: recentRentals.rentals || [],
            overdueRentals: overdueRentals.rentals || []
          });
        });
      });
    });
  }

  // Alle klanten weergeven
  getAllCustomers(req, res) {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const limit = 20;
    
    this.customerService.getAllCustomers(page, limit, search, (error, result) => {
      if (error) {
        console.error('Get customers error:', error);
        return res.status(500).render('error', {
          title: 'Klanten Fout',
          status: 500,
          message: 'Kon klanten niet laden'
        });
      }
      
      res.render('staff/customers', {
        title: 'Klantenbeheer',
        user: req.user,
        customers: result.customers || [],
        pagination: result.pagination || {},
        search
      });
    });
  }

  // Klant details
  getCustomerDetails(req, res) {
    const customerId = req.params.id;
    
    this.customerService.getCustomerDetails(customerId, (error, customer) => {
      if (error) {
        console.error('Customer details error:', error);
        return res.status(500).render('error', {
          title: 'Klant Details Fout',
          status: 500,
          message: 'Kon klantgegevens niet laden'
        });
      }
      
      if (!customer) {
        return res.status(404).render('error', {
          title: 'Klant Niet Gevonden',
          status: 404,
          message: 'Klant bestaat niet'
        });
      }
      
      // Haal klant verhuurgeschiedenis op
      this.rentalService.getCustomerRentals(customerId, (rentalError, rentals) => {
        if (rentalError) {
          console.error('Customer rentals error:', rentalError);
          return res.status(500).render('error', {
            title: 'Verhuur Geschiedenis Fout',
            status: 500,
            message: 'Kon verhuurgeschiedenis niet laden'
          });
        }
        
        res.render('staff/customer-details', {
          title: `Klant: ${customer.full_name}`,
          user: req.user,
          customer,
          rentals: rentals.rentals || []
        });
      });
    });
  }

  // Klant bewerken
  editCustomer(req, res) {
    const customerId = req.params.id;
    const updates = req.body;
    
    this.customerService.updateCustomer(customerId, updates, (error, result) => {
      if (error) {
        console.error('Edit customer error:', error);
        return res.status(500).render('error', {
          title: 'Bewerken Fout',
          status: 500,
          message: 'Kon klantgegevens niet bijwerken'
        });
      }
      
      if (result.success) {
        req.flash = req.flash || {};
        req.flash.success = 'Klantgegevens succesvol bijgewerkt';
        res.redirect(`/staff/customers/${customerId}`);
      } else {
        // Haal klantgegevens op voor foutmelding
        this.customerService.getCustomerDetails(customerId, (detailError, customer) => {
          if (detailError) {
            return res.status(500).render('error', {
              title: 'Bewerken Fout',
              status: 500,
              message: 'Kon klantgegevens niet laden'
            });
          }
          
          res.status(400).render('staff/customer-details', {
            title: 'Klant Bewerken',
            user: req.user,
            customer: customer,
            error: result.message
          });
        });
      }
    });
  }

  // Verhuur beheer pagina
  rentalManagement(req, res) {
    res.render('staff/rental-management', {
      title: 'Verhuur Beheer',
      user: req.user
    });
  }

  // Film uitgeven
  checkoutFilm(req, res) {
    const { customer_id, film_id, rental_duration } = req.body;
    const staff_id = req.user.user_id;
    
    this.rentalService.createRental({
      customer_id,
      film_id,
      staff_id,
      rental_duration: rental_duration || 3
    }, (error, result) => {
      if (error) {
        console.error('Checkout film error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij uitgeven film'
        });
      }
      
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
    });
  }

  // Film innemen
  checkinFilm(req, res) {
    const { rental_id } = req.body;
    const staff_id = req.user.staff_id || req.user.user_id; // Handle both staff_id and user_id
    
    console.log('CheckinFilm called with:', { rental_id, staff_id, user: req.user });
    
    this.rentalService.returnRental(rental_id, staff_id, (error, result) => {
      if (error) {
        console.error('Checkin film error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij innemen film'
        });
      }
      
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
    });
  }

  // Verhuur status updaten
  updateRentalStatus(req, res) {
    const rentalId = req.params.id;
    const { status } = req.body;
    
    this.rentalService.updateRentalStatus(rentalId, status, (error, result) => {
      if (error) {
        console.error('Update rental status error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij bijwerken status'
        });
      }
      
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
    });
  }

  // API: Zoek klanten
  searchCustomers(req, res) {
    const query = req.query.q || req.query.search || '';
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    if (req.query.q) {
      // Voor autocomplete - gebruik service layer
      this.customerService.searchCustomersForStaff(query, (error, customers) => {
        if (error) {
          console.error('Search customers error:', error);
          return res.status(500).json({
            success: false,
            message: 'Fout bij zoeken klanten: ' + error.message
          });
        }
        res.json(customers || []);
      });
    } else {
      // Voor paginatie
      this.customerService.getAllCustomers(
        parseInt(req.query.page) || 1,
        parseInt(req.query.limit) || 20,
        query,
        (error, result) => {
          if (error) {
            console.error('Search customers error:', error);
            return res.status(500).json({
              success: false,
              message: 'Fout bij zoeken klanten: ' + error.message
            });
          }
          
          res.json({
            success: true,
            customers: result.customers || [],
            pagination: result.pagination || {}
          });
        }
      );
    }
  }

  // API: Zoek films
  searchFilms(req, res) {
    const query = req.query.q || '';
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    this.filmService.searchFilmsForStaff(query, (error, films) => {
      if (error) {
        console.error('Search films error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij zoeken films: ' + error.message
        });
      }
      res.json(films || []);
    });
  }

  // API: Verhuur details
  getRentalDetails(req, res) {
    const rentalId = req.params.id;
    
    this.rentalService.getRentalById(rentalId, (error, rental) => {
      if (error) {
        console.error('Get rental details error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij ophalen verhuur details'
        });
      }
      
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
    });
  }

  // API: Update rental due date
  updateRentalDueDateAPI(req, res) {
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
    
    this.rentalService.updateDueDate(rentalId, due_date, staffId, reason, (error, result) => {
      if (error) {
        console.error('Update rental due date error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij bijwerken inleverdatum'
        });
      }
      
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
    });
  }

  // Helper: Staff statistieken
  getStaffStats(callback) {
    // Get total customers first
    this.customerService.getTotalCustomers((error, totalCustomers) => {
      if (error) {
        console.error('Get staff stats error:', error);
        return callback(null, {
          totalCustomers: 0,
          totalRentals: 0,
          activeRentals: 0,
          overdueCount: 0,
          todayRentals: 0
        });
      }
      
      // Get total rentals
      this.rentalService.getTotalRentals((error, totalRentals) => {
        if (error) {
          console.error('Get staff stats error:', error);
          return callback(null, {
            totalCustomers: 0,
            totalRentals: 0,
            activeRentals: 0,
            overdueCount: 0,
            todayRentals: 0
          });
        }
        
        // Get active rentals
        this.rentalService.getActiveRentals((error, activeRentals) => {
          if (error) {
            console.error('Get staff stats error:', error);
            return callback(null, {
              totalCustomers: 0,
              totalRentals: 0,
              activeRentals: 0,
              overdueCount: 0,
              todayRentals: 0
            });
          }
          
          // Get overdue count
          this.rentalService.getOverdueCount((error, overdueCount) => {
            if (error) {
              console.error('Get staff stats error:', error);
              return callback(null, {
                totalCustomers: 0,
                totalRentals: 0,
                activeRentals: 0,
                overdueCount: 0,
                todayRentals: 0
              });
            }
            
            // Get today rentals
            this.rentalService.getTodayRentals((error, todayRentals) => {
              if (error) {
                console.error('Get staff stats error:', error);
                return callback(null, {
                  totalCustomers: 0,
                  totalRentals: 0,
                  activeRentals: 0,
                  overdueCount: 0,
                  todayRentals: 0
                });
              }
              
              callback(null, {
                totalCustomers: totalCustomers.count || 0,
                totalRentals: totalRentals.count || 0,
                activeRentals: activeRentals.count || 0,
                overdueCount: overdueCount.count || 0,
                todayRentals: todayRentals.count || 0
              });
            });
          });
        });
      });
    });
  }

  // API: Huidige verhuur (alleen in behandeling/pending)
  getCurrentRentals(req, res) {
    this.rentalService.getPendingRentals((error, rentals) => {
      if (error) {
        console.error('Get current rentals error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij ophalen huidige verhuur'
        });
      }
      
      res.json({
        success: true,
        rentals: rentals.rentals || []
      });
    });
  }

  // API: Te late verhuur
  getOverdueRentals(req, res) {
    this.rentalService.getOverdueRentals((error, rentals) => {
      if (error) {
        console.error('Get overdue rentals error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij ophalen te late verhuur'
        });
      }
      
      res.json({
        success: true,
        rentals: rentals.rentals || []
      });
    });
  }

  // API: In behandeling verhuur (voor dashboard)
  getPendingRentals(req, res) {
    this.rentalService.getPendingRentals((error, rentals) => {
      if (error) {
        console.error('Get pending rentals error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij ophalen in behandeling verhuur'
        });
      }
      
      res.json({
        success: true,
        rentals: rentals.rentals || []
      });
    });
  }

  // API: Alle klanten (voor klantenbeheer)
  getAllCustomersAPI(req, res) {
    this.customerService.getAllCustomersForStaff((error, customers) => {
      if (error) {
        console.error('Get all customers API error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij ophalen klanten: ' + error.message
        });
      }
      res.json(customers || []);
    });
  }

  // API: Alle verhuur (voor verhuurbeheer)
  getAllRentalsAPI(req, res) {
    this.rentalService.getAllRentalsForStaff((error, rentals) => {
      if (error) {
        console.error('Get all rentals API error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij ophalen verhuur'
        });
      }
      res.json(rentals || []);
    });
  }

  // API: Nieuwe verhuur aanmaken (voor snelle verhuur)
  createRental(req, res) {
    const { customer_id, film_id } = req.body;
    
    if (!customer_id || !film_id) {
      return res.status(400).json({
        success: false,
        message: 'Klant ID en Film ID zijn verplicht'
      });
    }

    const rentalData = {
      customer_id: parseInt(customer_id),
      film_id: parseInt(film_id),
      staff_id: req.user.staff_id || req.user.user_id
    };

    this.rentalService.createRental(rentalData, (error, result) => {
      if (error) {
        console.error('Create rental error:', error);
        return res.status(500).json({
          success: false,
          message: error.message || 'Fout bij aanmaken verhuur'
        });
      }

      res.json({
        success: true,
        rental_id: result.rental_id,
        return_date: result.return_date,
        message: 'Verhuur succesvol aangemaakt'
      });
    });
  }

  // API: Klant details met verhuur geschiedenis
  getCustomerDetailsAPI(req, res) {
    const customerId = req.params.id;
    console.log('Getting customer details for ID:', customerId);
    
    this.customerService.getCustomerDetails(customerId, (customerError, customerResult) => {
      if (customerError) {
        console.error('Get customer details API error:', customerError);
        return res.status(500).json({
          success: false,
          message: 'Fout bij ophalen klant details: ' + customerError.message
        });
      }
      
      console.log('Customer result:', customerResult);
      
      if (!customerResult.success) {
        return res.status(404).json({
          success: false,
          message: customerResult.message || 'Klant niet gevonden'
        });
      }

      this.rentalService.getCustomerAllRentals(customerId, (rentalError, rentals) => {
        if (rentalError) {
          console.error('Get customer rentals error:', rentalError);
          // Still return customer data even if rentals fail
          return res.json({
            success: true,
            customer: customerResult.data,
            rentals: []
          });
        }

        console.log('Rentals for customer details:', rentals ? rentals.length : 0);

        res.json({
          success: true,
          customer: customerResult.data,
          rentals: rentals || []
        });
      });
    });
  }

  // API: Klant gegevens bijwerken
  updateCustomerAPI(req, res) {
    const customerId = req.params.id;
    const updates = req.body;
    
    console.log('Updating customer', customerId, 'with data:', updates);
    
    this.customerService.updateCustomer(customerId, updates, (error, result) => {
      if (error) {
        console.error('Update customer API error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij bijwerken klant: ' + error.message
        });
      }
      
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
    });
  }

  // API: Klant verhuur (films die hij heeft gehuurd)
  getCustomerRentalsAPI(req, res) {
    const customerId = req.params.id;
    console.log('Getting rentals for customer ID:', customerId);
    
    this.rentalService.getCustomerAllRentals(customerId, (error, rentals) => {
      if (error) {
        console.error('Get customer rentals API error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij ophalen verhuur: ' + error.message
        });
      }
      
      console.log('Rentals found:', rentals ? rentals.length : 0);
      console.log('Sample rental data:', rentals ? rentals.slice(0, 2) : 'No rentals');
      
      res.json({
        success: true,
        rentals: rentals || []
      });
    });
  }

  // API: Klant verwijderen
  deleteCustomerAPI(req, res) {
    const customerId = req.params.id;
    
    this.customerService.deleteCustomer(customerId, (error, result) => {
      if (error) {
        console.error('Delete customer API error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij verwijderen klant: ' + error.message
        });
      }
      
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
    });
  }

  // API: Verhuur status wijzigen (voor staff)
  updateRentalStatusAPI(req, res) {
    const rentalId = req.params.id;
    const { status } = req.body;
    const staffId = req.user.staff_id || req.user.user_id;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is verplicht'
      });
    }

    this.rentalService.updateRentalStatus(rentalId, status, staffId, (error, result) => {
      if (error) {
        console.error('Update rental status API error:', error);
        return res.status(500).json({
          success: false,
          message: 'Fout bij bijwerken status: ' + error.message
        });
      }
      
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
    });
  }

  // API: Update customer profile (staff version - can edit any customer)
  updateCustomerProfileAPI(req, res) {
    const customerId = req.params.id;
    const profileData = req.body;
    console.log(`[StaffController] Update customer profile API called for ID: ${customerId}`, profileData);
    
    this.customerService.updateCustomer(customerId, profileData, (error, result) => {
      if (error) {
        console.error(`[StaffController] Error in update customer profile API:`, error);
        return res.status(500).json({ 
          success: false, 
          message: 'Fout bij het bijwerken van klantprofiel' 
        });
      }
      
      console.log(`[StaffController] Update customer profile result:`, result);
      res.json(result);
    });
  }

  // API: Change customer password (staff version - can change any customer password)
  changeCustomerPasswordAPI(req, res) {
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
    this.customerService.changeCustomerPassword(customerId, new_password, (error, result) => {
      if (error) {
        console.error(`[StaffController] Error in change customer password API:`, error);
        return res.status(500).json({ 
          success: false, 
          message: 'Fout bij het wijzigen van wachtwoord' 
        });
      }
      
      console.log(`[StaffController] Change customer password result:`, result);
      res.json(result);
    });
  }
}

module.exports = StaffController;
