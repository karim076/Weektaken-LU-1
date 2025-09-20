const FilmService = require('../services/FilmService');
const CustomerService = require('../services/CustomerService');
const RentalService = require('../services/RentalService');

class HomeController {
  constructor() {
    this.filmService = new FilmService();
    this.customerService = new CustomerService();
    this.rentalService = new RentalService();
  }
  
  // GET /
  async index(req, res) {
    try {
      // Get popular films for the homepage
      const filmsResult = await this.filmService.getPopularFilms(1, 12); // Top 12 films
      
      res.render('home', {
        title: 'Welcome - Sakila App',
        message: 'Welcome to the Sakila App',
        user: req.user || null,
        films: filmsResult.success ? filmsResult.data.films : [],
        error: filmsResult.success ? null : 'Unable to load films'
      });
    } catch (error) {
      console.error('Home controller error:', error);
      res.status(500).render('error', { 
        title: 'Error',
        status: 500,
        message: 'An error occurred while loading the homepage.',
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  }

  // GET /dashboard
  async dashboard(req, res) {
    try {
      // Determine dashboard type based on user role
      let dashboardType = 'default';
      let userData = req.user;
      
      if (req.user) {
        const userType = req.user.user_type || req.user.type;
        const userRole = req.user.role;
        
        // Check role first, then fall back to user_type
        if (userRole) {
          dashboardType = userRole;
        } else {
          switch (userType) {
            case 'customer':
            case 1:
              dashboardType = 'customer';
              break;
            case 'staff':
            case 2:
              dashboardType = 'staff';
              break;
            case 'admin':
            case 3:
              dashboardType = 'admin';
              break;
            default:
              dashboardType = 'default';
          }
        }
        
        // For customer users, get complete customer data including first_name and last_name
        if (dashboardType === 'customer' && req.user.customer_id) {
          try {
            const customerResult = await this.customerService.getCustomerDetails(req.user.customer_id);
            if (customerResult.success && customerResult.data) {
              // Merge customer data with existing user data
              userData = {
                ...req.user,
                ...customerResult.data,
                // Keep original fields for compatibility
                user_id: req.user.user_id,
                customer_id: req.user.customer_id
              };
            }
          } catch (error) {
            console.error('Error getting customer details for dashboard:', error);
            // Continue with original user data if customer details fail
          }
        }
      }

      console.log('Dashboard debug info:');
      console.log('  User:', userData);
      console.log('  User Type:', userData?.user_type);
      console.log('  User Role:', userData?.role);
      console.log('  Dashboard Type:', dashboardType);

      // Prepare dashboard-specific data
      let dashboardData = {
        title: 'Dashboard - Sakila App',
        user: userData,
        dashboardType: dashboardType
      };

      // Add staff-specific data if needed
      if (dashboardType === 'staff') {
        try {
          // Get staff statistics
          const stats = await this.getStaffStats();
          const recentRentals = await this.rentalService.getRecentRentals(10);
          const overdueRentals = await this.rentalService.getOverdueRentals();
          
          dashboardData.stats = stats;
          dashboardData.recentRentals = recentRentals.rentals || [];
          dashboardData.overdueRentals = overdueRentals.rentals || [];
        } catch (error) {
          console.error('Error getting staff dashboard data:', error);
          // Continue with basic dashboard if staff data fails
          dashboardData.stats = {};
          dashboardData.recentRentals = [];
          dashboardData.overdueRentals = [];
        }
      }

      res.render('dashboard', dashboardData);
    } catch (error) {
      console.error('Dashboard controller error:', error);
      res.status(500).render('error', { 
        title: 'Error',
        status: 500,
        message: 'An error occurred while loading the dashboard.',
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  }

  // Get staff statistics for dashboard
  async getStaffStats() {
    try {
      // Get basic stats from database
      const customerCount = await this.customerService.getTotalCustomers();
      const rentalStats = await this.rentalService.getRentalStats();
      
      return {
        totalCustomers: customerCount.count || 0,
        totalRentals: rentalStats.total || 0,
        activeRentals: rentalStats.active || 0,
        overdueCount: rentalStats.overdue || 0,
        todayRentals: rentalStats.today || 0
      };
    } catch (error) {
      console.error('Get staff stats error:', error);
      return {
        totalCustomers: 0,
        totalRentals: 0,
        activeRentals: 0,
        overdueCount: 0,
        todayRentals: 0
      };
    }
  }
}

module.exports = HomeController;
