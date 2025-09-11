// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration (for backward compatibility)
app.use(session({
    secret: process.env.SESSION_SECRET || 'sakila-app-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// View engine setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views')); // Improved path

// Static files
app.use(express.static(path.join(__dirname, 'src', 'public'))); // Improved path

// Import middleware
const authMiddleware = require('./src/middleware/auth');
const errorMiddleware = require('./src/middleware/error');

// Import controllers
const HomeController = require('./src/controllers/HomeController');
const AuthController = require('./src/controllers/AuthController');
const OwnerController = require('./src/controllers/OwnerController');
const CustomerService = require('./src/services/CustomerService');

// Instantiate controllers
const homeController = new HomeController();
const authController = new AuthController();
const ownerController = new OwnerController();

// Import routes
const filmRoutes = require('./src/routes/films');
const customerRoutes = require('./src/routes/customers');
const adminRoutes = require('./src/routes/admin');
const customerDashboardRoutes = require('./src/routes/customer');

// Home routes
app.get('/', authMiddleware.optionalAuth, homeController.index.bind(homeController));
app.get('/home', authMiddleware.optionalAuth, homeController.index.bind(homeController));

// Auth routes
app.get('/login', authController.showLogin.bind(authController));
app.post('/login', authController.login.bind(authController));
app.get('/register', authController.showRegister.bind(authController));
app.post('/register', authController.register.bind(authController));
app.post('/logout', authController.logout.bind(authController));

// API routes
app.get('/api/cities', async (req, res) => {
  try {
    const BaseDAO = require('./src/dao/BaseDAO');
    const baseDAO = new BaseDAO();
    
    // Get all cities, ordered alphabetically, no limit
    const cities = await baseDAO.query('SELECT city_id, city FROM city ORDER BY city');
    
    res.json({
      success: true,
      cities: cities
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities'
    });
  }
});

// Dashboard route (general)
app.get('/dashboard', authMiddleware.requireAuthWeb, homeController.dashboard.bind(homeController));

// Profile route (general) - using CustomerController
const CustomerController = require('./src/controllers/CustomerController');
const customerController = new CustomerController();

// Simple profile route that should definitely work
app.get('/profile', authMiddleware.requireCustomerWeb, async (req, res) => {
  try {
    console.log('Direct profile route called');
    const customerId = req.user.user_id || req.user.customer_id || req.user.id;
    const CustomerService = require('./src/services/CustomerService');
    const customerService = new CustomerService();
    const customer = await customerService.getCustomerById(customerId);
    
    console.log('Got customer data, rendering simple profile');
    res.render('profile-simple', {
      title: 'My Profile - Sakila',
      user: req.user,
      customer
    });
  } catch (error) {
    console.error('Profile route error:', error);
    res.status(500).send(`Profile Error: ${error.message}`);
  }
});

app.post('/profile', authMiddleware.requireCustomerWeb, customerController.updateProfile.bind(customerController));

// Simple test profile route
app.get('/profile-test', authMiddleware.requireCustomerWeb, async (req, res) => {
  try {
    console.log('Profile-test: Starting test');
    const customerId = req.user.user_id || req.user.customer_id || req.user.id;
    const customerService = new CustomerService();
    const customer = await customerService.getCustomerById(customerId);
    
    console.log('Profile-test: Got customer data, attempting EJS render');
    
    res.render('/customer/profile', {
      title: 'Profile Test - Sakila',
      user: req.user,
      customer,
      success: null,
      error: null
    });
  } catch (error) {
    console.error('Profile-test EJS error:', error);
    res.send(`
      <h1>Profile Test ERROR</h1>
      <pre>Error: ${error.message}
      Stack: ${error.stack}</pre>
    `);
  }
});

// API routes
app.use('/films', filmRoutes);
app.use('/customers', customerRoutes);
app.use('/admin', authMiddleware.requireAdminWeb, adminRoutes);
app.use('/customer', customerDashboardRoutes);

// Error handling middleware (should be last)
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);
 
// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

const server = app.listen(port, () => {
    console.log(`Sakila App server is running on http://localhost:${port}`);
    console.log(`Views directory: ${path.join(__dirname, '/src/views')}`);
    console.log(`Static files: ${path.join(__dirname, '/src/public')}`);
});