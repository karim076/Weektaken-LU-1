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
  showLogin = (req, res) => {
    try {
      const redirect = req.query.redirect || '/dashboard';
      
      res.render('login', {
        title: 'Inloggen - Sakila App',
        redirect,
        error: null
      });
    } catch (error) {
      console.error('Show login error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van de inlogpagina'
      });
    }
  };

  /**
   * Process login
   */
  login = async (req, res) => {
    try {
      const { username, password, redirect = '/dashboard' } = req.body;

      if (!username || !password) {
        return res.render('login', {
          title: 'Inloggen - Sakila App',
          redirect,
          error: 'Vul alle velden in'
        });
      }

      const result = await this.authService.authenticateUser(username, password);

      if (!result.success) {
        return res.render('login', {
          title: 'Inloggen - Sakila App',
          redirect,
          error: result.message
        });
      }

<<<<<<< Updated upstream
      // Set session
      req.session.sessionId = result.user.sessionId;
      req.session.userId = result.user.id;
      req.session.userType = result.user.type;
=======
      // Set JWT token in httpOnly cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      };
      
      res.cookie('token', result.token, cookieOptions);
>>>>>>> Stashed changes

      // Redirect based on user type or to requested page
      let redirectUrl = redirect;
      if (redirect === '/dashboard' || redirect === '/') {
        switch (result.user.type) {
          case 'customer':
            redirectUrl = '/';
            break;
          case 'staff':
            redirectUrl = '/customers';
            break;
          case 'owner':
            redirectUrl = '/admin';
            break;
          default:
            redirectUrl = '/';
        }
      }

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Login error:', error);
      res.render('login', {
        title: 'Inloggen - Sakila App',
        redirect: req.body.redirect || '/dashboard',
        error: 'Er is een fout opgetreden bij het inloggen'
      });
    }
  };

  /**
   * Show registration form
   */
  showRegister = (req, res) => {
    try {
      res.render('register', {
        title: 'Registreren - Sakila App',
        error: null,
        success: null
      });
    } catch (error) {
      console.error('Show register error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van de registratiepagina'
      });
    }
  };

  /**
   * Process registration
   */
  register = async (req, res) => {
    try {
      const { firstName, lastName, email, username, password, confirmPassword } = req.body;

      // Validation
      if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: 'Vul alle velden in',
          success: null
        });
      }

      if (password !== confirmPassword) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: 'Wachtwoorden komen niet overeen',
          success: null
        });
      }

      if (password.length < 6) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: 'Wachtwoord moet minimaal 6 karakters bevatten',
          success: null
        });
      }

      // Register customer
      const result = await this.authService.registerCustomer({
        firstName,
        lastName,
        email,
        username,
        password,
        storeId: 1 // Default store
      });

      if (!result.success) {
        return res.render('register', {
          title: 'Registreren - Sakila App',
          error: result.message,
          success: null
        });
      }

      res.render('register', {
        title: 'Registreren - Sakila App',
        error: null,
        success: 'Account succesvol aangemaakt! U kunt nu inloggen.'
      });
    } catch (error) {
      console.error('Register error:', error);
      res.render('register', {
        title: 'Registreren - Sakila App',
        error: 'Er is een fout opgetreden bij het registreren',
        success: null
      });
    }
  };

  /**
   * Process logout
   */
  logout = async (req, res) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (sessionId) {
        await this.authService.destroySession(sessionId);
      }

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
  };

  /**
   * Show dashboard (redirect based on user type)
   */
  showDashboard = async (req, res) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (!sessionId) {
        return res.redirect('/login');
      }

      const user = await this.authService.getSession(sessionId);
      
      if (!user) {
        req.session.destroy();
        return res.redirect('/login');
      }

      // Redirect to appropriate dashboard
      switch (user.type) {
        case 'customer':
          res.redirect('/');
          break;
        case 'staff':
          res.redirect('/customers');
          break;
        case 'owner':
          res.redirect('/admin');
          break;
        default:
          res.redirect('/');
      }
    } catch (error) {
      console.error('Show dashboard error:', error);
      res.redirect('/login');
    }
  };
}

module.exports = AuthController;
