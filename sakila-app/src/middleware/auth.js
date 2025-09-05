/**
 * Authentication middleware for Sakila App
 * Provides session-based authentication and authorization
 */

/**
 * Require user to be authenticated
 */
function requireAuth(req, res, next) {
  console.log('   Auth middleware - requireAuth');
  console.log('   Session ID:', req.session?.id);
  console.log('   Is Authenticated:', req.session?.isAuthenticated);
  console.log('   User:', req.session?.user?.username);
  
  if (!req.session || !req.session.user || !req.session.isAuthenticated) {
    console.log('Auth failed, redirecting to login');
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }

  // Set user data for views
  req.user = req.session.user;
  res.locals.user = req.session.user;
  console.log('Auth success, continuing');
  next();
}

/**
 * Require user to be staff
 */
function requireStaff(req, res, next) {
  console.log('   Auth middleware - requireStaff');
  console.log('   User:', req.session?.user?.username);
  console.log('   User Type:', req.session?.user?.user_type);
  console.log('   User Role:', req.session?.user?.role);
  
  if (!req.session || !req.session.user || !req.session.isAuthenticated) {
    console.log('No session or not authenticated');
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }

  const user = req.session.user;
  
  // Fix missing role
  if (!user.role) {
    if (user.user_type === 'staff' && user.username === 'Mike') {
      user.role = 'admin';
      req.session.user.role = 'admin';
      console.log('Fixed Mike role to admin');
    } else if (user.user_type === 'staff') {
      user.role = 'staff';
      req.session.user.role = 'staff';
      console.log('Fixed staff role');
    }
  }
  
  if (user.role !== 'staff') {
    console.log('User role is not staff:', user.role);
    return res.status(403).render('error', {
      title: 'Toegang Geweigerd',
      status: 403,
      message: 'U heeft geen staff toegang tot deze pagina'
    });
  }

  req.user = user;
  res.locals.user = user;
  console.log('Staff auth success');
  next();
}

/**
 * Require user to be admin (owner)
 */
function requireAdmin(req, res, next) {
  console.log('   Auth middleware - requireAdmin');
  console.log('   Session ID:', req.session?.id);
  console.log('   Is Authenticated:', req.session?.isAuthenticated);
  console.log('   User:', req.session?.user?.username);
  console.log('   User Type:', req.session?.user?.user_type);
  console.log('   User Role:', req.session?.user?.role);
  
  if (!req.session || !req.session.user || !req.session.isAuthenticated) {
    console.log('No session or not authenticated');
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }

  const user = req.session.user;
  
  // Fix missing role - assign based on user_type and username
  if (!user.role) {
    if (user.user_type === 'staff' && user.username === 'Mike') {
      user.role = 'admin';
      req.session.user.role = 'admin'; // Update session
      console.log('Fixed Mike role to admin');
    } else if (user.user_type === 'staff') {
      user.role = 'staff';
      req.session.user.role = 'staff';
      console.log('Fixed staff role');
    } else if (user.user_type === 'customer') {
      user.role = 'customer';
      req.session.user.role = 'customer';
      console.log('Fixed customer role');
    }
  }
  
  if (user.role !== 'admin') {
    console.log('User role is not admin:', user.role);
    return res.status(403).render('error', {
      title: 'Toegang Geweigerd',
      status: 403,
      message: 'U heeft geen beheerder toegang tot deze pagina'
    });
  }

  req.user = user;
  res.locals.user = user;
  console.log('Admin auth success');
  next();
}

/**
 * Require user to be customer
 */
function requireCustomer(req, res, next) {
  console.log('Auth middleware - requireCustomer');
  console.log('User:', req.session?.user?.username);
  console.log('User Type:', req.session?.user?.user_type);
  console.log('User Role:', req.session?.user?.role);
  
  if (!req.session || !req.session.user || !req.session.isAuthenticated) {
    console.log('No session or not authenticated');
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }

  const user = req.session.user;
  
  // Fix missing role
  if (!user.role && user.user_type === 'customer') {
    user.role = 'customer';
    req.session.user.role = 'customer';
    console.log('Fixed customer role');
  }
  
  if (user.role !== 'customer') {
    console.log('User role is not customer:', user.role);
    return res.status(403).render('error', {
      title: 'Toegang Geweigerd',
      status: 403,
      message: 'U moet ingelogd zijn als klant om films te kunnen huren'
    });
  }

  req.user = user;
  res.locals.user = user;
  console.log('Customer auth success');
  next();
}

/**
 * Optional authentication - add user info if available but don't require login
 */
function optionalAuth(req, res, next) {
  if (req.session && req.session.user && req.session.isAuthenticated) {
    req.user = req.session.user;
    res.locals.user = req.session.user;
  } else {
    req.user = null;
    res.locals.user = null;
  }
  next();
}

/**
 * Require admin or staff access
 */
function requireAdminOrStaff(req, res, next) {
  if (!req.session || !req.session.user || !req.session.isAuthenticated) {
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }

  const user = req.session.user;
  if (user.role !== 'admin' && user.role !== 'staff') {
    return res.status(403).render('error', {
      title: 'Toegang Geweigerd',
      status: 403,
      message: 'U heeft geen beheerder toegang tot deze pagina'
    });
  }

  req.user = user;
  res.locals.user = user;
  next();
}

module.exports = {
  requireAuth,
  requireStaff,
  requireAdmin, 
  requireCustomer,
  requireAdminOrStaff,
  optionalAuth
};
