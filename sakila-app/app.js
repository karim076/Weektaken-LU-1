const express = require('express');
const http = require('node:http');
const path = require('path');
const session = require('express-session');

// Initialize database connection
const databaseConfig = require('./src/config/database');

// Import middleware from src structure
const { errorHandler, notFound } = require('./src/middleware/error');
const { optionalAuth } = require('./src/middleware/auth');

<<<<<<< Updated upstream
// Import routes from src structure
const customerRoutes = require('./src/routes/customers');
const filmRoutes = require('./src/routes/films');
const adminRoutes = require('./src/routes/admin');
=======
// Session configuration (for backward compatibility)
app.use(session({
    secret: process.env.SESSION_SECRET || 'sakila-app-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        maxAge: 15 * 60 * 1000 // 15 minutes
    }
}));
>>>>>>> Stashed changes

// Import controllers from src structure
const HomeController = require('./src/controllers/HomeController');
const AuthController = require('./src/controllers/AuthController');

const app = express();
const port = 3001;
const hostname = '127.0.0.1';

// Initialize database connection pool
databaseConfig.createPool().catch(console.error);

// Session configuration
app.use(session({
  secret: 'sakila-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware voor parsing van request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// View engine instellen (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create controller instances
const homeController = new HomeController();
const authController = new AuthController();

<<<<<<< Updated upstream
// Authentication routes
app.get('/login', (req, res) => authController.showLogin(req, res));
app.post('/login', (req, res) => authController.login(req, res));
app.get('/register', (req, res) => authController.showRegister(req, res));
app.post('/register', (req, res) => authController.register(req, res));
app.post('/logout', (req, res) => authController.logout(req, res));
app.get('/dashboard', (req, res) => authController.showDashboard(req, res));
=======
// Import routes
const filmRoutes = require('./src/routes/films');
const customerRoutes = require('./src/routes/customer');
const adminRoutes = require('./src/routes/admin');
<<<<<<< Updated upstream
=======

// Favicon route (prevent 404 errors)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});
>>>>>>> Stashed changes

// Favicon route (prevent 404 errors)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});
>>>>>>> Stashed changes

// Routes
// Favicon route to prevent 404
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Home route via controller with optional auth
app.get('/', optionalAuth, (req, res) => homeController.index(req, res));

<<<<<<< Updated upstream
// Feature routes using src structure
app.use('/customers', customerRoutes);
app.use('/films', filmRoutes);
app.use('/admin', adminRoutes);
=======
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
app.use('/customer', customerRoutes);
app.use('/admin', authMiddleware.requireAdminWeb, adminRoutes);
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await databaseConfig.close();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await databaseConfig.close();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

server.listen(port, hostname, () => {
  console.log(`Sakila App server draait op http://${hostname}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Architecture: DAO -> Services -> Controllers -> Views added to the project structure');
});

module.exports = app;
