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
  index(req, res) {
    // Get popular films for the homepage
    this.filmService.getPopularFilms(1, 12, (error, filmsResult) => {
      if (error) {
        console.error('Home controller error:', error);
        return res.status(500).render('error', { 
          title: 'Error',
          status: 500,
          message: 'An error occurred while loading the homepage.',
          stack: process.env.NODE_ENV === 'development' ? error.stack : null
        });
      }
      
      res.render('home', {
        title: 'Welcome - Sakila App',
        message: 'Welcome to the Sakila App',
        user: req.user || null,
        films: filmsResult.success ? filmsResult.data.films : [],
        error: filmsResult.success ? null : 'Unable to load films'
      });
    });
  }

  // GET /dashboard
  dashboard(req, res) {
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
      this.getStaffStats((error, stats) => {
        if (error) {
          console.error('Error getting staff dashboard data:', error);
          dashboardData.stats = {};
          dashboardData.recentRentals = [];
          dashboardData.overdueRentals = [];
          return res.render('dashboard', dashboardData);
        }
        
        dashboardData.stats = stats;
        dashboardData.recentRentals = [];
        dashboardData.overdueRentals = [];
        res.render('dashboard', dashboardData);
      });
    } else {
      res.render('dashboard', dashboardData);
    }
  }

  // Get staff statistics for dashboard
  getStaffStats(callback) {
    this.customerService.getTotalCustomers((error, customerCount) => {
      if (error) {
        console.error('Get staff stats error:', error);
        return callback(null, {
          totalCustomers: 0,
          totalRentals: 0,
          activeRentals: 0,
          overdueCount: 0,
          todayRentals: 0
        });
      }
      
      const stats = {
        totalCustomers: customerCount.count || 0,
        totalRentals: 0,
        activeRentals: 0,
        overdueCount: 0,
        todayRentals: 0
      };
      
      callback(null, stats);
    });
  }
}

module.exports = HomeController;
