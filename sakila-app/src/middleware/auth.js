const JWTService = require('../services/JWTService');

const jwtService = new JWTService();

/**
 * JWT Authentication Middleware
 */
const authenticateToken = (req, res, next) => {
    try {
        // Check for token in Authorization header (Bearer token)
        const authHeader = req.headers['authorization'];
        const bearerToken = authHeader && authHeader.split(' ')[1];
        
        // Check for token in cookies as fallback
        const cookieToken = req.cookies?.token;
        
        const token = bearerToken || cookieToken;
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access token is required' 
            });
        }

        const decoded = jwtService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        
        if (error.message === 'Token expired') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired',
                expired: true 
            });
        }
        
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

/**
 * Customer Role Authorization
 */
const requireCustomer = (req, res, next) => {
    authenticateToken(req, res, (err) => {
        if (err) return;
        
        if (!req.user || req.user.role !== 'customer') {
            return res.status(403).json({ 
                success: false, 
                message: 'Customer access required' 
            });
        }
        
        next();
    });
};

/**
 * Staff Role Authorization
 */
const requireStaff = (req, res, next) => {
    authenticateToken(req, res, (err) => {
        if (err) return;
        
        if (!req.user || req.user.role !== 'staff') {
            return res.status(403).json({ 
                success: false, 
                message: 'Staff access required' 
            });
        }
        
        next();
    });
};

/**
 * Admin Role Authorization
 */
const requireAdmin = (req, res, next) => {
    authenticateToken(req, res, (err) => {
        if (err) return;
        
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }
        
        next();
    });
};

/**
 * Web Authentication for pages (redirects to login instead of JSON)
 */
const requireAuthWeb = (req, res, next) => {
    try {
        // Check for token in cookies
        const token = req.cookies?.token;
        
        if (!token) {
            return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
        }

        const decoded = jwtService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Web auth failed:', error.message);
        
        // Clear invalid token
        res.clearCookie('token');
        
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
};

/**
 * Customer Web Authorization
 */
const requireCustomerWeb = (req, res, next) => {
    requireAuthWeb(req, res, (err) => {
        if (err) return;
        
        if (!req.user || req.user.role !== 'customer') {
            return res.status(403).render('error', {
                title: 'Toegang Geweigerd',
                status: 403,
                message: 'Je hebt geen toegang tot deze pagina. Klant toegang vereist.'
            });
        }
        
        next();
    });
};

/**
 * Staff Web Authorization
 */
const requireStaffWeb = (req, res, next) => {
    requireAuthWeb(req, res, (err) => {
        if (err) return;
        
        if (!req.user || req.user.role !== 'staff') {
            return res.status(403).render('error', {
                title: 'Toegang Geweigerd',
                status: 403,
                message: 'Je hebt geen toegang tot deze pagina. Staff toegang vereist.'
            });
        }
        
        next();
    });
};

/**
 * Admin Web Authorization
 */
const requireAdminWeb = (req, res, next) => {
    requireAuthWeb(req, res, (err) => {
        if (err) return;
        
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).render('error', {
                title: 'Toegang Geweigerd',
                status: 403,
                message: 'Je hebt geen toegang tot deze pagina. Admin toegang vereist.'
            });
        }
        
        next();
    });
};

/**
 * Optional authentication (doesn't redirect, just sets user if token exists)
 */
const optionalAuth = (req, res, next) => {
    try {
        const token = req.cookies?.token;
        
        if (token) {
            const decoded = jwtService.verifyToken(token);
            req.user = decoded;
        }
    } catch (error) {
        // Ignore token errors for optional auth
        res.clearCookie('token');
    }
    
    next();
};

module.exports = {
    authenticateToken,
    requireCustomer,
    requireStaff,
    requireAdmin,
    requireAuthWeb,
    requireCustomerWeb,
    requireStaffWeb,
    requireAdminWeb,
    optionalAuth
};