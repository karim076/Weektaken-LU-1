const bcrypt = require('bcryptjs');
const UserDAO = require('../dao/UserDAO');
const JWTService = require('./JWTService');

class AuthService {
  constructor() {
    this.userDAO = new UserDAO();
    this.jwtService = new JWTService();
  }

  authenticateUser(usernameOrEmail, password, callback) {
    console.log('Attempting login with:', usernameOrEmail);
    
    // Try to find user by username first, then by email
    this.userDAO.findByUsername(usernameOrEmail, (error, user) => {
      if (error) {
        return callback(error);
      }
      
      if (!user) {
        console.log('Username not found, trying email...');
        return this.userDAO.findByEmail(usernameOrEmail, (emailError, emailUser) => {
          if (emailError) {
            return callback(emailError);
          }
          
          if (!emailUser) {
            console.log('User not found:', usernameOrEmail);
            return callback(null, { success: false, error: 'Ongeldige gebruikersnaam/email of wachtwoord' });
          }
          
          this._processUserAuthentication(emailUser, password, callback);
        });
      }
      
      this._processUserAuthentication(user, password, callback);
    });
  }

  _processUserAuthentication(user, password, callback) {
    console.log('User found:', user.username, 'Type:', user.user_type);

    // Verify password using bcryptjs
    this.verifyPassword(password, user.password, (error, isValidPassword) => {
      if (error) {
        return callback(error);
      }
      
      if (!isValidPassword) {
        console.log('Invalid password for:', user.username);
        return callback(null, { success: false, error: 'Ongeldige gebruikersnaam/email of wachtwoord' });
      }

      console.log('Password verified for:', user.username);

      const { password: _, ...userWithoutPassword } = user;
      
      console.log('User data from database:', userWithoutPassword);
      
      // Map user_type to role for consistency
      if (userWithoutPassword.user_type === 'staff' && userWithoutPassword.username === 'Mike') {
        userWithoutPassword.role = 'admin';
        console.log('Mike mapped to admin role');
      } else if (userWithoutPassword.user_type === 'staff') {
        userWithoutPassword.role = 'staff';
        console.log('Staff user mapped to staff role');
      } else {
        userWithoutPassword.role = 'customer';
      }

      // Generate JWT token
      let token;
      try {
        if (userWithoutPassword.user_type === 'customer') {
          token = this.jwtService.generateCustomerToken(userWithoutPassword);
        } else if (userWithoutPassword.user_type === 'staff') {
          token = this.jwtService.generateStaffToken(userWithoutPassword);
        } else {
          token = this.jwtService.generateToken(userWithoutPassword);
        }
      } catch (tokenError) {
        console.error('Token generation failed:', tokenError);
        return callback(null, { success: false, error: 'Er is een fout opgetreden bij het inloggen' });
      }
      
      console.log('Final user object:', userWithoutPassword);
      
      callback(null, { 
        success: true, 
        user: userWithoutPassword, 
        token: token,
        message: 'Login successful' 
      });
    });
  }

  /**
   * Verify password using bcryptjs
   */
  verifyPassword(plainPassword, hashedPassword, callback) {
    bcrypt.compare(plainPassword, hashedPassword, (error, result) => {
      if (error) {
        console.error('Password verification error:', error);
        return callback(error, false);
      }
      callback(null, result);
    });
  }

  /**
   * Hash password using bcryptjs
   */
  hashPassword(password, callback) {
    const saltRounds = 12;
    bcrypt.hash(password, saltRounds, (error, hashedPassword) => {
      if (error) {
        console.error('Password hashing error:', error);
        return callback(new Error('Password hashing failed'));
      }
      callback(null, hashedPassword);
    });
  }
  /**
   * Register new customer
   */
  registerCustomer(userData, callback) {
    this.userDAO.findByUsername(userData.username, (error, existingUser) => {
      if (error) {
        return callback(error);
      }
      
      if (existingUser) {
        return callback(null, { success: false, message: 'Username already exists' });
      }

      this.userDAO.findByEmail(userData.email, (emailError, existingEmail) => {
        if (emailError) {
          return callback(emailError);
        }
        
        if (existingEmail) {
          return callback(null, { success: false, message: 'Email already exists' });
        }

        this.hashPassword(userData.password, (hashError, hashedPassword) => {
          if (hashError) {
            return callback(hashError);
          }
          
          this.userDAO.createCustomer({
            ...userData,
            password: hashedPassword,
            active: true
          }, (createError, result) => {
            if (createError) {
              console.error('registerCustomer error:', createError);
              return callback(null, { success: false, message: 'Registration failed' });
            }
            
            const response = result.success
              ? { success: true, customerId: result.customerId, message: 'Registration successful' }
              : { success: false, message: 'Registration failed' };
            callback(null, response);
          });
        });
      });
    });
  }

  registerUser(userData, callback) {
    // Generate username from email
    const username = userData.email.split('@')[0];
    
    // Check if username already exists
    this.userDAO.findByUsername(username, (error, existingUser) => {
      if (error) {
        return callback(error);
      }
      
      if (existingUser) {
        return callback(null, { success: false, error: 'Gebruikersnaam al in gebruik' });
      }

      // Check if email already exists
      this.userDAO.findByEmail(userData.email, (emailError, existingEmail) => {
        if (emailError) {
          return callback(emailError);
        }
        
        if (existingEmail) {
          return callback(null, { success: false, error: 'Email al in gebruik' });
        }

        // Create customer data with provided address fields
        const customerData = {
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          username: username,
          password: userData.password, // Will be hashed in createCustomer
          address: userData.address,
          address2: userData.address2 || null,
          district: userData.district,
          city_id: userData.city_id,
          postal_code: userData.postal_code || null,
          phone: userData.phone,
          store_id: userData.store_id || 1
        };

        this.userDAO.createCustomer(customerData, (createError, result) => {
          if (createError) {
            console.error('registerUser error:', createError);
            return callback(null, { success: false, error: 'Er is een fout opgetreden bij de registratie' });
          }
          
          const response = result.success
            ? { success: true, customerId: result.customerId, message: 'Registration successful' }
            : { success: false, error: 'Registratie mislukt' };
          callback(null, response);
        });
      });
    });
  }

  getUserById(userId, userType, callback) {
    this.userDAO.findById(userId, userType, (error, user) => {
      if (error) {
        console.error('getUserById error:', error);
        return callback(null, null);
      }
      
      if (!user) {
        return callback(null, null);
      }
      
      const { password, ...userWithoutPassword } = user;
      callback(null, userWithoutPassword);
    });
  }

  changePassword(userId, userType, currentPassword, newPassword, callback) {
    this.userDAO.findById(userId, userType, (error, user) => {
      if (error) {
        console.error('changePassword error:', error);
        return callback(null, { success: false, message: 'Failed to change password' });
      }
      
      if (!user) {
        return callback(null, { success: false, message: 'User not found' });
      }

      bcrypt.compare(currentPassword, user.password, (compareError, valid) => {
        if (compareError) {
          return callback(compareError);
        }
        
        if (!valid) {
          return callback(null, { success: false, message: 'Current password incorrect' });
        }

        bcrypt.hash(newPassword, 10, (hashError, hashed) => {
          if (hashError) {
            return callback(hashError);
          }
          
          this.userDAO.updatePassword(userId, userType, hashed, (updateError, result) => {
            if (updateError) {
              console.error('changePassword error:', updateError);
              return callback(null, { success: false, message: 'Failed to change password' });
            }
            
            callback(null, {
              success: result.affectedRows > 0,
              message: result.affectedRows > 0 ? 'Password changed' : 'Failed to change password'
            });
          });
        });
      });
    });
  }
  // Update user profile
  updateProfile(userId, userType, profileData, callback) {
    this.userDAO.updateProfile(userId, userType, profileData, (error, result) => {
      if (error) {
        console.error('updateProfile error:', error);
        return callback(null, { success: false, message: 'Failed to update profile' });
      }
      
      callback(null, {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Profile updated' : 'Failed to update profile'
      });
    });
  }
  // Check if user has required permissions
  validatePermissions(userId, userType, requiredPermission) {
    const perms = {
      customer: ['view_films', 'rent_films', 'view_rentals'],
      staff: ['view_films', 'rent_films', 'view_rentals', 'manage_customers', 'manage_inventory'],
      owner: ['view_films', 'rent_films', 'view_rentals', 'manage_customers', 'manage_inventory', 'manage_staff', 'view_analytics']
    };
    return (perms[userType] || []).includes(requiredPermission);
  }
  // Logout user
  logoutUser(callback) {
    callback(null, { success: true, message: 'Logout successful' });
  }
  // Check if user is active
  isUserActive(userIdOrUsername, userType = null, callback) {
    if (userType) {
      // Called with userId and userType
      this.userDAO.findById(userIdOrUsername, userType, (err, user) => {
        if (err) {
          console.error('isUserActive error:', err);
          return callback(null, false);
        }
        callback(null, user && user.active === 1);
      });
    } else {
      // Called with username only
      this.userDAO.findByUsername(userIdOrUsername, (err, user) => {
        if (err) {
          console.error('isUserActive error:', err);
          return callback(null, false);
        }
        
        if (user) {
          return callback(null, user.active === 1);
        }
        
        // Try finding by email if username not found
        this.userDAO.findByEmail(userIdOrUsername, (err, user) => {
          if (err) {
            console.error('isUserActive error:', err);
            return callback(null, false);
          }
          callback(null, user && user.active === 1);
        });
      });
    }
  }
}

module.exports = AuthService;