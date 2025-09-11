const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/CustomerController');
const authMiddleware = require('../middleware/auth');

// Create controller instance
const customerController = new CustomerController();

// Middleware to require customer authentication for all routes
router.use(authMiddleware.requireCustomerWeb);

// Customer dashboard routes
router.get('/dashboard', (req, res) => {
  // Redirect to main dashboard
  res.redirect('/dashboard');
});

// Redirect old routes to dashboard with hash
router.get('/profile', (req, res) => {
  res.redirect('/dashboard#profile');
});

// Customer rental routes - redirect to dashboard
router.get('/rentals', (req, res) => {
  res.redirect('/dashboard#rentals');
});

router.get('/rentals/:id', customerController.getRentalDetails);

// Cancel rental route - for pending rentals only
router.delete('/rentals/:id/cancel', async (req, res) => {
  try {
    const customerId = req.user.user_id;
    const rentalId = req.params.id;
    
    console.log(`Attempting to cancel rental ${rentalId} for customer ${customerId}`);
    
    const RentalService = require('../services/RentalService');
    const rentalService = new RentalService();
    
    const result = await rentalService.cancelRental(rentalId, customerId);
    
    if (result.success) {
      console.log('Rental cancelled successfully:', result.message);
      res.json({
        success: true,
        message: result.message
      });
    } else {
      console.log('Failed to cancel rental:', result.message);
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Cancel rental route error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het annuleren van de verhuur'
    });
  }
});

// GET /customer/rentals-data - Get rental data for AJAX loading
router.get('/rentals-data', async (req, res) => {
    try {
        const customerId = req.user.user_id;
        
        // Get customer's rentals using controller method
        const result = await customerController.getCustomerRentalsData(customerId);
        
        if (result.success) {
            res.json({
                success: true,
                rentals: result.rentals,
                stats: result.stats
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error loading rentals data:', error);
        res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het laden van de verhuurgegevens'
        });
    }
});

// GET /customer/profile-data - Get profile data for AJAX loading
router.get('/profile-data', async (req, res) => {
    try {
        const customerId = req.user.user_id;
        
        // Get customer profile using controller method
        const result = await customerController.getCustomerProfileData(customerId);
        
        if (result.success) {
            res.json({
                success: true,
                customer: result.customer
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
        res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het laden van de profielgegevens'
        });
    }
});

// POST /customer/profile-update - Update profile
router.post('/profile-update', async (req, res) => {
    try {
        const customerId = req.user.user_id;
        const { first_name, last_name, email } = req.body;
        
        if (!first_name || !last_name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Alle velden zijn verplicht'
            });
        }
        
        // Update customer profile using controller method
        const result = await customerController.updateCustomerProfile(customerId, {
            first_name,
            last_name,
            email
        });
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Profiel succesvol bijgewerkt'
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het bijwerken van het profiel'
        });
    }
});

module.exports = router;
