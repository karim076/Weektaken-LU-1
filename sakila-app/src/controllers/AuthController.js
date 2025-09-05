const AuthService = require('../services/AuthService');

/**
 * Controller for authentication operations
 */
class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Show login form
   */
  showLogin(req, res) {
    try {
      const redirect = req.query.redirect || '/dashboard';
      
      res.render('login', {
        title: 'Login - Sakila App',
        redirect,
        error: null
      });
    } catch (error) {
      console.error('Show login error:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        status: 500,
        message: 'An error occurred while loading the login page'
      });
    }
  }

  /**
   * Process login
   */
  async login(req, res) {
    try {
      const { username, password, redirect = '/dashboard' } = req.body;

      if (!username || !password) {
        return res.render('login', {
          title: 'Login - Sakila App',
          redirect,
          error: 'Please fill in all fields'
        });
      }

      const result = await this.authService.authenticateUser(username, password);

      if (!result.success) {
        return res.render('login', {
          title: 'Login - Sakila App',
          redirect,
          error: result.error
        });
      }

      // Set session data
      req.session.user = result.user;
      req.session.isAuthenticated = true;

      console.log('User logged in successfully:');
      console.log('   Username:', result.user.username);
      console.log('   User Type:', result.user.user_type);
      console.log('   Role:', result.user.role);
      console.log('   Session ID:', req.session.id);
      console.log('   Session Data:', req.session);

      // Redirect based on role or requested page
      if (redirect !== '/dashboard') {
        res.redirect(redirect);
      } else {
        // Force role assignment if missing
        let userRole = result.user.role;
        if (!userRole) {
          if (result.user.user_type === 'staff' && result.user.username === 'Mike') {
            userRole = 'admin';
          } else if (result.user.user_type === 'staff') {
            userRole = 'staff';
          } else if (result.user.user_type === 'customer') {
            userRole = 'customer';
          }
          
          // Update session with correct role
          req.session.user.role = userRole;
          console.log('Fixed role in session:', userRole);
        }
        
        switch(userRole) {
          case 'admin':
            res.redirect('/admin/dashboard');
            break;
          case 'staff':
            res.redirect('/staff/dashboard');
            break;
          case 'customer':
            res.redirect('/customer/dashboard');
            break;
          default:
            res.redirect('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      res.render('login', {
        title: 'Login - Sakila App',
        redirect: req.body.redirect || '/dashboard',
        error: 'An error occurred during login'
      });
    }
  }

  /**
   * Show registration form
   */
  showRegister(req, res) {
    try {
      res.render('register', {
        title: 'Register - Sakila App',
        error: null,
        success: null
      });
    } catch (error) {
      console.error('Show register error:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        status: 500,
        message: 'An error occurred while loading the registration page'
      });
    }
  }

  /**
   * Process registration
   */
  async register(req, res) {
    try {
      const { first_name, last_name, email, password, confirm_password, user_type = 'customer' } = req.body;

      // Basic validation
      if (!first_name || !last_name || !email || !password || !confirm_password) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: 'Vul alle velden in',
          success: null
        });
      }

      if (password !== confirm_password) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: 'Wachtwoorden komen niet overeen',
          success: null
        });
      }

      if (password.length < 6) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: 'Wachtwoord moet minimaal 6 karakters lang zijn',
          success: null
        });
      }

      // Attempt registration
      const result = await this.authService.registerUser({
        first_name,
        last_name,
        email,
        password,
        user_type
      });

      if (!result.success) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: result.error,
          success: null
        });
      }

      // Registration successful
      res.render('register', {
        title: 'Registreren - Sakila App',
        error: null,
        success: 'Registratie succesvol! Je kunt nu inloggen.'
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.render('register', {
        title: 'Registreren - Sakila App',
        error: 'Er is een fout opgetreden bij de registratie',
        success: null
      });
    }
  }

  /**
   * Process logout
   */
  async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        res.redirect('/');
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.redirect('/');
    }
  }

  /**
   * Show dashboard based on user role
   */
  async showDashboard(req, res) {
    try {
      console.log('🏠 Dashboard requested');
      console.log('   Session ID:', req.session?.id);
      console.log('   Is Authenticated:', req.session?.isAuthenticated);
      console.log('   User in Session:', req.session?.user?.username);
      
      const user = req.session.user;
      if (!user) {
        console.log('❌ No user in session, redirecting to login');
        return res.redirect('/login');
      }

      // Check if user is still active (temporarily disabled for debugging)
      // const isActive = await this.authService.isUserActive(user.user_id, user.user_type);
      // if (!isActive) {
      //   console.log('❌ User account is inactive');
      //   req.session.destroy();
      //   return res.redirect('/login?error=account_inactive');
      // }
      
      console.log('⚡ Skipping isUserActive check for debugging');

      // Render dashboard based on role
      switch(user.role) {
        case 'admin':
          res.render('dashboard', {
            title: 'Admin Dashboard - Sakila App',
            user,
            dashboardType: 'admin'
          });
          break;
        case 'staff':
          res.render('dashboard', {
            title: 'Staff Dashboard - Sakila App',
            user,
            dashboardType: 'staff'
          });
          break;
        case 'customer':
          res.render('dashboard', {
            title: 'Customer Dashboard - Sakila App',
            user,
            dashboardType: 'customer'
          });
          break;
        default:
          res.redirect('/');
      }
    } catch (error) {
      console.error('Show dashboard error:', error);
      res.redirect('/login');
    }
  }
}

module.exports = AuthController;
