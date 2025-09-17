// Load environment variables first
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Initialize database connection
const databaseConfig = require('./src/config/database');

// Import middleware
const authMiddleware = require('./src/middleware/auth');
const errorMiddleware = require('./src/middleware/error');

// Import controllers
const HomeController = require('./src/controllers/HomeController');
const AuthController = require('./src/controllers/AuthController');
const CustomerController = require('./src/controllers/CustomerController');

// Import routes
const filmRoutes = require('./src/routes/films');
const customerRoutes = require('./src/routes/customer');
const adminRoutes = require('./src/routes/admin');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// ===== MIDDLEWARE SETUP =====

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'sakila-app-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        maxAge: 15 * 60 * 1000 // 15 minutes
    }
}));

// View engine setup (EJS templates)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Static files serving
app.use(express.static(path.join(__dirname, 'src', 'public')));

// ===== CONTROLLER INSTANCES =====

const homeController = new HomeController();
const authController = new AuthController();
const customerController = new CustomerController();

// ===== UTILITY ROUTES =====

// Favicon route (prevent 404 errors)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// ===== MAIN APPLICATION ROUTES =====

// Home routes
app.get('/', authMiddleware.optionalAuth, homeController.index.bind(homeController));
app.get('/home', authMiddleware.optionalAuth, homeController.index.bind(homeController));

// Authentication routes
app.get('/login', authController.showLogin.bind(authController));
app.post('/login', authController.login.bind(authController));
app.get('/register', authController.showRegister.bind(authController));
app.post('/register', authController.register.bind(authController));
app.post('/logout', authController.logout.bind(authController));

// Dashboard route (redirects based on user type)
app.get('/dashboard', authMiddleware.requireAuthWeb, homeController.dashboard.bind(homeController));

// ===== API ROUTES =====

// Cities API endpoint for forms
app.get('/api/cities', async (req, res) => {
  try {
    const BaseDAO = require('./src/dao/BaseDAO');
    const baseDAO = new BaseDAO();
    
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

// ===== FEATURE ROUTES =====

// Film management routes
app.use('/films', filmRoutes);

// Customer management routes (both staff and customer functionality)
app.use('/customer', customerRoutes);

// Admin panel routes (protected)
app.use('/admin', authMiddleware.requireAdminWeb, adminRoutes);

// ===== ERROR HANDLING =====

// 404 handler (must be after all routes)
app.use(errorMiddleware.notFound);

// Global error handler (must be last)
app.use(errorMiddleware.errorHandler);

// ===== SERVER STARTUP =====

const server = app.listen(port, () => {
    console.log(`Sakila App server is running on http://localhost:${port}`);
    console.log(`Views directory: ${path.join(__dirname, 'src', 'views')}`);
    console.log(`Static files: ${path.join(__dirname, 'src', 'public')}`);
});

// ===== GRACEFUL SHUTDOWN =====

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
