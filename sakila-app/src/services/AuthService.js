const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const UserDAO = require('../dao/UserDAO');
const CustomerDAO = require('../dao/CustomerDAO');
const SessionDAO = require('../dao/SessionDAO');

/**
 * Service for authentication and user management
 */
class AuthService {
  constructor() {
    this.userDAO = new UserDAO();
    this.customerDAO = new CustomerDAO();
    this.sessionDAO = new SessionDAO();
    this.saltRounds = 10;
    this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Authenticate user
   */
  async authenticateUser(usernameOrEmail, password) {
    try {
      const user = await this.userDAO.findByUsernameOrEmail(usernameOrEmail);
      
      if (!user) {
        return { success: false, message: 'Gebruiker niet gevonden' };
      }

      if (!user.active) {
        return { success: false, message: 'Account is gedeactiveerd' };
      }

      const isPasswordValid = await this.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        return { success: false, message: 'Onjuist wachtwoord' };
      }

      // Create session
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + this.sessionDuration);
      
      await this.sessionDAO.createSession(sessionId, user.user_id, user.user_type, expiresAt);

      return {
        success: true,
        user: {
          id: user.user_id,
          type: user.user_type,
          username: user.username,
          fullName: user.full_name,
          email: user.email,
          storeId: user.store_id,
          sessionId: sessionId
        }
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, message: 'Er is een fout opgetreden bij het inloggen' };
    }
  }

  /**
   * Get session and user details
   */
  async getSession(sessionId) {
    try {
      if (!sessionId) {
        return null;
      }

      const sessionData = await this.sessionDAO.getSessionWithUser(sessionId);
      
      if (!sessionData) {
        return null;
      }

      // Update last accessed time
      await this.sessionDAO.updateLastAccessed(sessionId);

      return {
        id: sessionData.user_id,
        type: sessionData.user_type,
        username: sessionData.username,
        fullName: sessionData.full_name,
        email: sessionData.email,
        storeId: sessionData.store_id,
        sessionId: sessionData.session_id
      };
    } catch (error) {
      console.error('Session retrieval error:', error);
      return null;
    }
  }

  /**
   * Destroy session (logout)
   */
  async destroySession(sessionId) {
    try {
      await this.sessionDAO.deleteSession(sessionId);
      return true;
    } catch (error) {
      console.error('Session destruction error:', error);
      return false;
    }
  }

  /**
   * Register new customer
   */
  async registerCustomer(customerData) {
    try {
      const { firstName, lastName, email, username, password, storeId = 1, address } = customerData;
      
      // Check if username/email already exists
      const usernameExists = await this.userDAO.usernameExists(username);
      const emailExists = await this.userDAO.emailExists(email);

      if (usernameExists) {
        return { success: false, message: 'Gebruikersnaam bestaat al' };
      }

      if (emailExists) {
        return { success: false, message: 'Email adres is al geregistreerd' };
      }

      const hashedPassword = await this.hashPassword(password);
      
      // Create customer with address
      const result = await this.customerDAO.createCustomerWithAddress(
        {
          firstName,
          lastName,
          email,
          username,
          password: hashedPassword,
          storeId
        },
        {
          address: address || 'Customer Address',
          district: 'District',
          cityId: 1,
          phone: '000-000-0000'
        }
      );

      return { 
        success: true, 
        customerId: result.insertId,
        message: 'Account succesvol aangemaakt' 
      };
    } catch (error) {
      console.error('Customer registration error:', error);
      return { success: false, message: 'Er is een fout opgetreden bij het aanmaken van het account' };
    }
  }

  /**
   * Clean expired sessions
   */
  async cleanExpiredSessions() {
    try {
      await this.sessionDAO.cleanExpiredSessions();
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  /**
   * Get user by ID and type
   */
  async getUserById(userId, userType) {
    try {
      return await this.userDAO.findByIdAndType(userId, userType);
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(userId, userType) {
    try {
      await this.sessionDAO.deleteUserSessions(userId, userType);
      return true;
    } catch (error) {
      console.error('Logout all devices error:', error);
      return false;
    }
  }
}

module.exports = AuthService;
