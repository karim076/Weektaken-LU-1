const FilmService = require('../services/FilmService');

class HomeController {
  constructor() {
    this.filmService = new FilmService();
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
      console.log('  User:', req.user);
      console.log('  User Type:', req.user?.user_type);
      console.log('  User Role:', req.user?.role);
      console.log('  Dashboard Type:', dashboardType);

      res.render('dashboard', {
        title: 'Dashboard - Sakila App',
        user: req.user,
        dashboardType: dashboardType
      });
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
}

module.exports = HomeController;
