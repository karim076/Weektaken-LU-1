const express = require('express');
const http = require('node:http');
const path = require('path');
const session = require('express-session');

// Initialize database connection
const databaseConfig = require('./src/config/database');

// Import middleware from src structure
const { errorHandler, notFound } = require('./src/middleware/error');
const { optionalAuth } = require('./src/middleware/auth');

// Import routes from src structure
const customerRoutes = require('./src/routes/customers');
const filmRoutes = require('./src/routes/films');
const adminRoutes = require('./src/routes/admin');

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

// Authentication routes
app.get('/login', (req, res) => authController.showLogin(req, res));
app.post('/login', (req, res) => authController.login(req, res));
app.get('/register', (req, res) => authController.showRegister(req, res));
app.post('/register', (req, res) => authController.register(req, res));
app.post('/logout', (req, res) => authController.logout(req, res));
app.get('/dashboard', (req, res) => authController.showDashboard(req, res));

// Routes
// Favicon route to prevent 404
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Home route via controller with optional auth
app.get('/', optionalAuth, (req, res) => homeController.index(req, res));

// Feature routes using src structure
app.use('/customers', customerRoutes);
app.use('/films', filmRoutes);
app.use('/admin', adminRoutes);

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
