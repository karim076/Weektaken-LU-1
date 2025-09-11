const express = require('express');
const router = express.Router();

// ✅ Import destructured methods directly
const { optionalAuth, requireCustomer } = require('../middleware/auth');

// Import controller
const FilmController = require('../controllers/FilmController');
const filmController = new FilmController();

// Apply optional authentication (for rental features)
router.use(optionalAuth);

// Public film routes
router.get('/', filmController.index.bind(filmController));                        
router.get('/search', filmController.search.bind(filmController));                 
router.get('/categories', filmController.getCategories.bind(filmController));      
router.get('/:id', filmController.show.bind(filmController));                      
router.get('/:id/availability', filmController.checkAvailability.bind(filmController));

// Customer rental routes (require authentication)
router.post('/:id/rent', requireCustomer, filmController.rent.bind(filmController));

module.exports = router;
