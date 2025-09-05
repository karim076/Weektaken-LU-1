const express = require('express');
const router = express.Router();

// Import middleware
const { requireStaff } = require('../middleware/auth');

// Import controller
const CustomerController = require('../controllers/CustomerController');

// Create controller instance
const customerController = new CustomerController();

// Apply staff authentication to all routes
router.use(requireStaff);

// Customer management routes for staff
router.get('/', customerController.index);                    // US2E1: View customers
router.get('/create', customerController.showCreate);         // US1E1: Show create form
router.post('/', customerController.create);                  // US1E1: Create customer
router.get('/search', customerController.search);             // Search customers (AJAX)
router.get('/:id', customerController.show);                  // US2E1: View customer details
router.get('/:id/edit', customerController.showEdit);         // US3E1: Show edit form
router.put('/:id', customerController.update);                // US3E1: Update customer
router.delete('/:id', customerController.delete);             // US4E1: Delete customer

module.exports = router;