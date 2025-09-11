const jwt = require('jsonwebtoken');
require('dotenv').config();

class JWTService {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'fallback-secret-key';
        this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    }

    /**
     * Generate JWT token for user
     */
    generateToken(payload) {
        try {
            return jwt.sign(payload, this.secret, {
                expiresIn: this.expiresIn,
                issuer: 'sakila-app'
            });
        } catch (error) {
            console.error('Error generating JWT token:', error);
            throw new Error('Token generation failed');
        }
    }

    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.secret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid token');
            } else {
                console.error('Token verification error:', error);
                throw new Error('Token verification failed');
            }
        }
    }

    /**
     * Decode JWT token without verification (for debugging)
     */
    decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    /**
     * Generate token for customer
     */
    generateCustomerToken(customer) {
        const payload = {
            user_id: customer.user_id || customer.customer_id,
            customer_id: customer.user_id || customer.customer_id,
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name,
            username: customer.username,
            full_name: customer.full_name,
            role: 'customer',
            type: 'customer'
        };

        return this.generateToken(payload);
    }

    /**
     * Generate token for staff
     */
    generateStaffToken(staff) {
        const payload = {
            user_id: staff.staff_id,
            staff_id: staff.staff_id,
            email: staff.email,
            first_name: staff.first_name,
            last_name: staff.last_name,
            role: 'staff',
            type: 'staff'
        };

        return this.generateToken(payload);
    }

    /**
     * Generate token for owner
     */
    generateOwnerToken(owner) {
        const payload = {
            user_id: owner.owner_id,
            owner_id: owner.owner_id,
            email: owner.email,
            first_name: owner.first_name,
            last_name: owner.last_name,
            role: 'owner',
            type: 'owner'
        };

        return this.generateToken(payload);
    }

    /**
     * Refresh token (generate new token with same payload but new expiration)
     */
    refreshToken(oldToken) {
        try {
            const decoded = this.verifyToken(oldToken);
            
            // Remove JWT specific fields before generating new token
            delete decoded.iat;
            delete decoded.exp;
            delete decoded.iss;
            
            return this.generateToken(decoded);
        } catch (error) {
            throw new Error('Cannot refresh invalid token');
        }
    }
}

module.exports = JWTService;
