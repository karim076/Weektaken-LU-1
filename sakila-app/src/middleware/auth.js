const AuthService = require('../services/AuthService');

/**
 * Authentication middleware using the new service layer
 */
class AuthMiddleware {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Require authentication
   */
  requireAuth = async (req, res, next) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (!sessionId) {
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
      }

      const user = await this.authService.getSession(sessionId);
      
      if (!user) {
        req.session.destroy();
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
      }

      req.user = user;
      res.locals.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.redirect('/login');
    }
  };

  /**
   * Require staff access
   */
  requireStaff = async (req, res, next) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (!sessionId) {
        return res.status(403).render('error', {
          title: 'Toegang Geweigerd',
          status: 403,
          message: 'U moet ingelogd zijn als staff om deze pagina te bekijken'
        });
      }

      const user = await this.authService.getSession(sessionId);
      
      if (!user || user.type !== 'staff') {
        return res.status(403).render('error', {
          title: 'Toegang Geweigerd',
          status: 403,
          message: 'U heeft geen staff toegang tot deze pagina'
        });
      }

      req.user = user;
      res.locals.user = user;
      next();
    } catch (error) {
      console.error('Staff auth middleware error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij de autorisatie'
      });
    }
  };

  /**
   * Require owner access
   */
  requireOwner = async (req, res, next) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (!sessionId) {
        return res.status(403).render('error', {
          title: 'Toegang Geweigerd',
          status: 403,
          message: 'U moet ingelogd zijn als eigenaar om deze pagina te bekijken'
        });
      }

      const user = await this.authService.getSession(sessionId);
      
      if (!user || user.type !== 'owner') {
        return res.status(403).render('error', {
          title: 'Toegang Geweigerd',
          status: 403,
          message: 'U heeft geen eigenaar toegang tot deze pagina'
        });
      }

      req.user = user;
      res.locals.user = user;
      next();
    } catch (error) {
      console.error('Owner auth middleware error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij de autorisatie'
      });
    }
  };

  /**
   * Optional authentication
   */
  optionalAuth = async (req, res, next) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (sessionId) {
        const user = await this.authService.getSession(sessionId);
        if (user) {
          req.user = user;
          res.locals.user = user;
        }
      }
      
      next();
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      next();
    }
  };

  /**
   * Require customer access
   */
  requireCustomer = async (req, res, next) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (!sessionId) {
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
      }

      const user = await this.authService.getSession(sessionId);
      
      if (!user || user.type !== 'customer') {
        return res.status(403).render('error', {
          title: 'Toegang Geweigerd',
          status: 403,
          message: 'U moet ingelogd zijn als klant om films te kunnen huren'
        });
      }

      req.user = user;
      res.locals.user = user;
      next();
    } catch (error) {
      console.error('Customer auth middleware error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij de autorisatie'
      });
    }
  };

  /**
   * Require admin access (staff or owner)
   */
  requireAdmin = async (req, res, next) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (!sessionId) {
        return res.status(403).render('error', {
          title: 'Toegang Geweigerd',
          status: 403,
          message: 'U moet ingelogd zijn als beheerder om deze pagina te bekijken'
        });
      }

      const user = await this.authService.getSession(sessionId);
      
      if (!user || (user.type !== 'staff' && user.type !== 'owner')) {
        return res.status(403).render('error', {
          title: 'Toegang Geweigerd',
          status: 403,
          message: 'U heeft geen beheerder toegang tot deze pagina'
        });
      }

      req.user = user;
      res.locals.user = user;
      next();
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij de autorisatie'
      });
    }
  };
}

// Create instance and export the methods
const authMiddleware = new AuthMiddleware();

module.exports = {
  requireAuth: authMiddleware.requireAuth,
  requireStaff: authMiddleware.requireStaff,
  requireOwner: authMiddleware.requireOwner,
  optionalAuth: authMiddleware.optionalAuth,
  requireCustomer: authMiddleware.requireCustomer,
  requireAdmin: authMiddleware.requireAdmin
};
