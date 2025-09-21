// const express = require('express');
// const router = express.Router();

// // Import middleware
// const { requireAdmin } = require('../middleware/auth');

// // Import controllers
// const AdminController = require('../controllers/AdminController');

// // Create controller instances
// const adminController = new AdminController();

// // Apply admin authentication to all routes
// router.use(requireAdmin);

// // Dashboard routes
// router.get('/', adminController.dashboard.bind(adminController));                    // Admin dashboard
// router.get('/dashboard', adminController.dashboard.bind(adminController));          // Admin dashboard (alternative route)

// // Staff Management
// router.get('/staff', adminController.staffManagement.bind(adminController));        // Staff overview

// // Customer Management  
// router.get('/customers', adminController.customerManagement.bind(adminController)); // Customer overview

// module.exports = router;