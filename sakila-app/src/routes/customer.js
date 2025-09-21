const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/CustomerController');
const authMiddleware = require('../middleware/auth');

// Create controller instance
const customerController = new CustomerController();

// Staff/Admin routes for customer management (no auth middleware needed, handled in main app)
router.get('/create', customerController.showCreate); // Show create form
router.post('/create', customerController.create); // Create customer
router.get('/search', customerController.search); // Search customers

// Customer dashboard routes (require customer authentication)
router.use(authMiddleware.requireCustomerWeb);

// Customer dashboard routes - these must come BEFORE :id routes
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

// Customer specific routes with authentication
router.get('/rentals/:id', customerController.getRentalDetails);

// Cancel rental route - for pending rentals only
router.delete('/rentals/:id/cancel', (req, res) => {
  const customerId = req.user.user_id;
  const rentalId = req.params.id;
  
  console.log(`Attempting to cancel rental ${rentalId} for customer ${customerId}`);
  
  const RentalService = require('../services/RentalService');
  const rentalService = new RentalService();
  
  rentalService.cancelRental(rentalId, customerId, (error, result) => {
    if (error) {
      console.error('Cancel rental route error:', error);
      return res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het annuleren van de verhuur'
      });
    }
    
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
  });
});

// GET /customer/rentals-data - Get rental data for AJAX loading
router.get('/rentals-data', (req, res) => {
    const customerId = req.user.user_id;
    
    // Get customer's rentals using controller method
    customerController.getCustomerRentalsData(customerId, (error, result) => {
        if (error) {
            console.error('Error loading rentals data:', error);
            return res.status(500).json({
                success: false,
                message: 'Er is een fout opgetreden bij het laden van de verhuurgegevens'
            });
        }
        
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
    });
});

// GET /customer/profile-data - Get profile data for AJAX loading
router.get('/profile-data', (req, res) => {
    const customerId = req.user.user_id;
    
    // Get customer profile using controller method
    customerController.getCustomerProfileData(customerId, (error, result) => {
        if (error) {
            console.error('Error loading profile data:', error);
            return res.status(500).json({
                success: false,
                message: 'Er is een fout opgetreden bij het laden van de profielgegevens'
            });
        }
        
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
    });
});

// POST /customer/profile-update - Update profile
router.post('/profile-update', (req, res) => {
    try {
        const customerId = req.user.user_id;
        
        const { 
            username,
            first_name, 
            last_name, 
            email, 
            phone, 
            address, 
            postal_code, 
            city, 
            country, 
            language 
        } = req.body;
        
        if (!username || !first_name || !last_name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Gebruikersnaam, voornaam, achternaam en email zijn verplicht'
            });
        }

        // Email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email adres is niet geldig'
            });
        }
        
        // Prepare data for update
        const updateData = {
            username,
            first_name,
            last_name,
            email,
            phone: phone || null,
            address: address || null,
            postal_code: postal_code || null,
            city: city || null,
            country: country || 'Nederland',
            language: language || 'nl'
        };
        
        // Update customer profile using controller method
        customerController.updateCustomerProfile(customerId, updateData, (error, result) => {
            if (error) {
                console.error('Profile update error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Er is een fout opgetreden bij het bijwerken van het profiel'
                });
            }
            
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
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het bijwerken van het profiel'
        });
    }
});

// POST /customer/change-password - Change password only
router.post('/change-password', (req, res) => {
    try {
        const customerId = req.user.user_id;
        const { current_password, new_password, confirm_password } = req.body;
        
        // Validation
        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({
                success: false,
                message: 'Alle wachtwoord velden zijn verplicht'
            });
        }
        
        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Nieuw wachtwoord moet minstens 6 tekens bevatten'
            });
        }
        
        if (new_password !== confirm_password) {
            return res.status(400).json({
                success: false,
                message: 'Wachtwoorden komen niet overeen'
            });
        }
        
        // Change password using controller method
        customerController.changeCustomerPassword(customerId, current_password, new_password, (error, result) => {
            if (error) {
                console.error('Error changing password:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
                });
            }
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Wachtwoord succesvol gewijzigd'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord'
        });
    }
});

// Pay rental route
router.post('/rentals/:id/pay', (req, res) => {
    try {
        const customerId = req.user.user_id;
        const rentalId = req.params.id;
        const { amount } = req.body;
        
        console.log(`Attempting to pay rental ${rentalId} for customer ${customerId}, amount: €${amount}`);
        
        const RentalService = require('../services/RentalService');
        const rentalService = new RentalService();
        
        rentalService.payRental(rentalId, customerId, amount, (error, result) => {
            if (error) {
                console.error('Pay rental route error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Er is een fout opgetreden bij de betaling'
                });
            }
            
            if (result.success) {
                console.log('Rental payment successful:', result.message);
                res.json({
                    success: true,
                    message: result.message
                });
            } else {
                console.log('Failed to pay rental:', result.message);
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        });
    } catch (error) {
        console.error('Pay rental route error:', error);
        res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij de betaling'
        });
    }
});

// Return rental route
router.post('/rentals/:id/return', (req, res) => {
    try {
        const customerId = req.user.user_id;
        const rentalId = req.params.id;
        
        console.log(`Attempting to return rental ${rentalId} for customer ${customerId}`);
        
        const RentalService = require('../services/RentalService');
        const rentalService = new RentalService();
        
        rentalService.returnRental(rentalId, customerId, (error, result) => {
            if (error) {
                console.error('Return rental route error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Er is een fout opgetreden bij het inleveren'
                });
            }
            
            if (result.success) {
                console.log('Rental returned successfully:', result.message);
                res.json({
                    success: true,
                    message: result.message
                });
            } else {
                console.log('Failed to return rental:', result.message);
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        });
    } catch (error) {
        console.error('Return rental route error:', error);
        res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het inleveren'
        });
    }
});

// Extend rental route
router.post('/rentals/:id/extend', (req, res) => {
    try {
        const customerId = req.user.user_id;
        const rentalId = req.params.id;
        
        console.log(`Attempting to extend rental ${rentalId} for customer ${customerId}`);
        
        const RentalService = require('../services/RentalService');
        const rentalService = new RentalService();
        
        rentalService.extendRental(rentalId, customerId, (error, result) => {
            if (error) {
                console.error('Extend rental route error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Er is een fout opgetreden bij het verlengen'
                });
            }
            
            if (result.success) {
                console.log('Rental extended successfully:', result.message);
                res.json({
                    success: true,
                    message: result.message
                });
            } else {
                console.log('Failed to extend rental:', result.message);
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        });
    } catch (error) {
        console.error('Extend rental route error:', error);
        res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het verlengen'
        });
    }
});

// Staff routes (no auth required, handled at app level) - these come LAST
router.get('/', customerController.index); // Customer list for staff  
router.get('/:id', customerController.show); // Show customer details
router.get('/:id/edit', customerController.showEdit); // Show edit form  
router.put('/:id', customerController.update); // Update customer
router.delete('/:id', customerController.delete); // Delete customer

module.exports = router;
