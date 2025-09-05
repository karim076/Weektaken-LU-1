const express = require('express');
const router = express.Router();

// Import middleware
const { requireCustomer } = require('../middleware/auth');

// Import controllers
const CustomerController = require('../controllers/CustomerController');

// Create controller instances
const customerController = new CustomerController();

// Apply customer authentication to all routes
router.use(requireCustomer);

// Customer dashboard routes  
router.get('/dashboard', (req, res) => {
  res.render('dashboard', {
    title: 'Customer Dashboard - Sakila',
    user: req.user,
    dashboardType: 'customer'
  });
});

// Rental routes - these are specific to customer module
router.get('/rentals', customerController.getRentals.bind(customerController));
router.get('/rentals/:id', customerController.getRentalDetails.bind(customerController));
router.post('/rentals', customerController.createRental.bind(customerController));

// Payment routes - these are specific to customer module
router.get('/payments', customerController.getPayments.bind(customerController));

module.exports = router;
