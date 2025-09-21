const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/error');
const auth = require('../middleware/auth');
const StaffController = require('../controllers/StaffController');

// Maak een instance van de controller
const staffController = new StaffController();

// Staff middleware - alleen staff/admin toegang (aangepast voor meerdere rollen)
const staffOrAdminWeb = (req, res, next) => {
  auth.requireAuthWeb(req, res, (err) => {
    if (err) return;
    
    if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
      return res.status(403).render('error', {
        title: 'Toegang Geweigerd',
        status: 403,
        message: 'Deze pagina is alleen toegankelijk voor medewerkers en beheerders'
      });
    }
    
    next();
  });
};

// Staff Dashboard
router.get('/dashboard', staffOrAdminWeb, (req, res) => {
  staffController.dashboard(req, res);
});

// Klantenbeheer
router.get('/customers', staffOrAdminWeb, (req, res) => {
  staffController.getAllCustomers(req, res);
});
router.get('/customers/:id', staffOrAdminWeb, (req, res) => {
  staffController.getCustomerDetails(req, res);
});
router.post('/customers/:id/edit', staffOrAdminWeb, (req, res) => {
  staffController.editCustomer(req, res);
});

// Film uitgeven/innemen
router.get('/rental-management', staffOrAdminWeb, (req, res) => {
  staffController.rentalManagement(req, res);
});
router.post('/rental-management/checkout', staffOrAdminWeb, (req, res) => {
  staffController.checkoutFilm(req, res);
});
router.post('/rental-management/checkin', staffOrAdminWeb, (req, res) => {
  staffController.checkinFilm(req, res);
});

// Verhuur status updates
router.post('/rentals/:id/update-status', staffOrAdminWeb, (req, res) => {
  staffController.updateRentalStatus(req, res);
});

// API endpoints voor AJAX calls
router.get('/api/customers/search', staffOrAdminWeb, (req, res) => {
  staffController.searchCustomers(req, res);
});
router.get('/api/films/search', staffOrAdminWeb, (req, res) => {
  staffController.searchFilms(req, res);
});

// Extra API endpoints voor staff dashboard - specific routes first
router.get('/api/rentals/current', staffOrAdminWeb, (req, res) => {
  staffController.getCurrentRentals(req, res);
});
router.get('/api/rentals/overdue', staffOrAdminWeb, (req, res) => {
  staffController.getOverdueRentals(req, res);
});
router.get('/api/rentals/pending', staffOrAdminWeb, (req, res) => {
  staffController.getPendingRentals(req, res);
});

// More specific rental routes before generic :id route
router.put('/api/rentals/:id/due-date', staffOrAdminWeb, (req, res) => {
  staffController.updateRentalDueDateAPI(req, res);
});
router.put('/api/rentals/:id/status', staffOrAdminWeb, (req, res) => {
  staffController.updateRentalStatusAPI(req, res);
});

// Generic rental routes
router.get('/api/rentals/:id', staffOrAdminWeb, (req, res) => {
  staffController.getRentalDetails(req, res);
});
router.get('/api/rentals', staffOrAdminWeb, (req, res) => {
  staffController.getAllRentalsAPI(req, res);
});
router.post('/api/rentals', staffOrAdminWeb, (req, res) => {
  staffController.createRental(req, res);
});
router.post('/api/rentals/return', staffOrAdminWeb, (req, res) => {
  staffController.checkinFilm(req, res);
});

// API endpoints voor klanten en films
router.get('/api/customers', staffOrAdminWeb, (req, res) => {
  staffController.getAllCustomersAPI(req, res);
});
router.get('/api/customers/:id', staffOrAdminWeb, (req, res) => {
  staffController.getCustomerDetailsAPI(req, res);
});
router.put('/api/customers/:id', staffOrAdminWeb, (req, res) => {
  staffController.updateCustomerAPI(req, res);
});
router.delete('/api/customers/:id', staffOrAdminWeb, (req, res) => {
  staffController.deleteCustomerAPI(req, res);
});
// Staff Profile Management Routes
router.put('/api/customers/:id/profile', staffOrAdminWeb, (req, res) => {
  staffController.updateCustomerProfileAPI(req, res);
});
router.post('/api/customers/:id/change-password', staffOrAdminWeb, (req, res) => {
  staffController.changeCustomerPasswordAPI(req, res);
});
router.get('/api/customers/:id/rentals', staffOrAdminWeb, (req, res) => {
  staffController.getCustomerRentalsAPI(req, res);
});

module.exports = router;
