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
router.get('/dashboard', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.dashboard(req, res);
}));

// Klantenbeheer
router.get('/customers', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.getAllCustomers(req, res);
}));
router.get('/customers/:id', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.getCustomerDetails(req, res);
}));
router.post('/customers/:id/edit', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.editCustomer(req, res);
}));

// Film uitgeven/innemen
router.get('/rental-management', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.rentalManagement(req, res);
}));
router.post('/rental-management/checkout', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.checkoutFilm(req, res);
}));
router.post('/rental-management/checkin', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.checkinFilm(req, res);
}));

// Verhuur status updates
router.post('/rentals/:id/update-status', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.updateRentalStatus(req, res);
}));

// API endpoints voor AJAX calls
router.get('/api/customers/search', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.searchCustomers(req, res);
}));
router.get('/api/films/search', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.searchFilms(req, res);
}));

// Extra API endpoints voor staff dashboard - specific routes first
router.get('/api/rentals/current', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.getCurrentRentals(req, res);
}));
router.get('/api/rentals/overdue', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.getOverdueRentals(req, res);
}));
router.get('/api/rentals/pending', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.getPendingRentals(req, res);
}));

// More specific rental routes before generic :id route
router.put('/api/rentals/:id/due-date', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.updateRentalDueDateAPI(req, res);
}));
router.put('/api/rentals/:id/status', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.updateRentalStatusAPI(req, res);
}));

// Generic rental routes
router.get('/api/rentals/:id', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.getRentalDetails(req, res);
}));
router.get('/api/rentals', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.getAllRentalsAPI(req, res);
}));
router.post('/api/rentals', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.createRental(req, res);
}));
router.post('/api/rentals/return', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.checkinFilm(req, res);
}));

// API endpoints voor klanten en films
router.get('/api/customers', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.getAllCustomersAPI(req, res);
}));
router.get('/api/customers/:id', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.getCustomerDetailsAPI(req, res);
}));
router.put('/api/customers/:id', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.updateCustomerAPI(req, res);
}));
router.delete('/api/customers/:id', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.deleteCustomerAPI(req, res);
}));
// Staff Profile Management Routes
router.put('/api/customers/:id/profile', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.updateCustomerProfileAPI(req, res);
}));
router.post('/api/customers/:id/change-password', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.changeCustomerPasswordAPI(req, res);
}));
router.get('/api/customers/:id/rentals', staffOrAdminWeb, asyncHandler(async (req, res) => {
  await staffController.getCustomerRentalsAPI(req, res);
}));

module.exports = router;
