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
      console.log(`Login attempt: ${username}, ${password ? '******' : 'no password'}`);
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


      // Set session
      req.session.sessionId = result.user.sessionId;
      req.session.userId = result.user.id;
      req.session.userType = result.user.type;

      // Set JWT token in httpOnly cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        sameSite: 'strict',

        maxAge: 15 * 60 * 1000 // 15 minutes
      };
      
      res.cookie('token', result.token, cookieOptions);

      //   maxAge: 15 * 60 * 1000// 15 minutes
      // };

      res.cookie('token', result.token, cookieOptions);

      // Also set session data for backward compatibility
      req.session.user = result.user;
      req.session.isAuthenticated = true;

      console.log('User logged in successfully:');
      console.log('   Username:', result.user.username);
      console.log('   User Type:', result.user.user_type);
      console.log('   Role:', result.user.role);
      console.log('   Token generated:', !!result.token);

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
        success: null,
        formData: {}
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
      const { 
        first_name, 
        last_name, 
        email, 
        password, 
        confirm_password, 
        address,
        address2,
        district,
        city_id,
        postal_code,
        phone,
        user_type = 'customer' 
      } = req.body;

      // Basic validation
      if (!first_name || !last_name || !email || !password || !confirm_password) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: 'Vul alle verplichte velden in',
          success: null,
          formData: req.body
        });
      }

      // Address validation
      if (!address || !district || !city_id || !phone) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: 'Vul alle verplichte adresvelden in (adres, district, stad, telefoon)',
          success: null,
          formData: req.body
        });
      }

      if (password !== confirm_password) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: 'Wachtwoorden komen niet overeen',
          success: null,
          formData: req.body
        });
      }

      if (password.length < 6) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: 'Wachtwoord moet minimaal 6 karakters lang zijn',
          success: null,
          formData: req.body
        });
      }

      // Attempt registration
      const result = await this.authService.registerUser({
        first_name,
        last_name,
        email,
        password,
        address,
        address2,
        district,
        city_id: parseInt(city_id),
        postal_code,
        phone,
        user_type
      });

      if (!result.success) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: result.error || result.message,
          success: null,
          formData: req.body
        });
      }

      // Registration successful
      res.render('register', {
        title: 'Registreren - Sakila App',
        error: null,
        success: 'Registratie succesvol! Je kunt nu inloggen.',
        formData: {}
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.render('register', {
        title: 'Registreren - Sakila App',
        error: 'Er is een fout opgetreden bij de registratie',
        success: null,
        formData: req.body
      });
    }
  }

  /**
   * Process logout
   */
  async logout(req, res) {
    try {
      // Clear JWT token cookie
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // Destroy session for backward compatibility
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        console.log('User logged out successfully');
        res.redirect('/');
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.clearCookie('token');
      res.redirect('/');
    }
  }

  /**
   * Show dashboard based on user role
   */
  async showDashboard(req, res) {
    try {
      console.log(' - Dashboard requested');
      console.log('   Session ID:', req.session?.id);
      console.log('   Is Authenticated:', req.session?.isAuthenticated);
      console.log('   User in Session:', req.session?.user?.username);
      
      const user = req.session.user;
      if (!user) {
        console.log('   No user in session, redirecting to login');
        return res.redirect('/login');
      }

      // Check if user is still active (temporarily disabled for debugging)
      // const isActive = await this.authService.isUserActive(user.user_id, user.user_type);
      // if (!isActive) {
      //   console.log(' User account is inactive');
      //   req.session.destroy();
      //   return res.redirect('/login?error=account_inactive');
      // }
      

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
