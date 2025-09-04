const express = require('express');
const router = express.Router();

// Import middleware
const { optionalAuth, requireCustomer } = require('../middleware/auth');

// Import controller
const FilmController = require('../controllers/FilmController');

// Create controller instance
const filmController = new FilmController();

// Apply optional authentication (for rental features)
router.use(optionalAuth);

// Public film routes
router.get('/', filmController.index);                        // US1E3: Browse films
router.get('/search', filmController.search);                 // US2E3: Search films (AJAX)
router.get('/categories', filmController.getCategories);      // Get categories (AJAX)
router.get('/:id', filmController.show);                      // Film details
router.get('/:id/availability', filmController.checkAvailability); // Check availability (AJAX)

// Customer-only routes (require login)
router.post('/:id/rent', requireCustomer, filmController.rent); // US1E2: Rent film (customer)

module.exports = router;
