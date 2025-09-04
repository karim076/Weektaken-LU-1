const express = require('express');
const router = express.Router();

// Import middleware
const { requireOwner } = require('../middleware/auth');

// Import controllers
const OwnerController = require('../controllers/OwnerController');
const FilmController = require('../controllers/FilmController');

// Create controller instances
const ownerController = new OwnerController();
const filmController = new FilmController();

// Apply owner authentication to all routes
router.use(requireOwner);

// Dashboard
router.get('/', ownerController.index);                       // Admin dashboard

// Staff management routes (Epic 5)
router.get('/staff', ownerController.manageStaff);            // US2E5: View all staff
router.get('/staff/create', ownerController.showCreateStaff); // US1E5: Show create staff form
router.post('/staff', ownerController.createStaff);           // US1E5: Create staff
router.get('/staff/:id/edit', ownerController.showEditStaff); // Show edit staff form
router.put('/staff/:id', ownerController.updateStaff);        // Update staff
router.delete('/staff/:id', ownerController.deleteStaff);     // US3E5: Delete staff

// Store-staff assignment routes
router.post('/staff/assign', ownerController.assignStaffToStore);       // Assign staff to store
router.post('/staff/remove', ownerController.removeStaffFromStore);     // Remove staff from store
router.get('/stores/:storeId/staff', ownerController.getStoreStaff);     // Get store staff

// Film management routes (Epic 6) 
router.get('/films', filmController.index);                   // Films overview for admin
router.get('/films/create', filmController.showCreate);       // US1E6: Show create film form
router.post('/films', filmController.create);                 // US1E6: Create film
// US2E6 & US3E6 can be added later for edit/delete functionality

module.exports = router;
