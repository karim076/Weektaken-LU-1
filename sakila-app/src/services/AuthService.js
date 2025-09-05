const bcrypt = require('bcrypt');
const UserDAO = require('../dao/UserDAO');

class AuthService {
  constructor() {
    this.userDAO = new UserDAO();
  }

  async authenticateUser(usernameOrEmail, password) {
    try {
      console.log('🔍 Attempting login with:', usernameOrEmail);
      
      // Try to find user by username first, then by email
      let user = await this.userDAO.findByUsername(usernameOrEmail);
      if (!user) {
        console.log('🔍 Username not found, trying email...');
        user = await this.userDAO.findByEmail(usernameOrEmail);
      }
      
      if (!user) {
        console.log('❌ User not found:', usernameOrEmail);
        return { success: false, error: 'Ongeldige gebruikersnaam/email of wachtwoord' };
      }

      console.log('✅ User found:', user.username, 'Type:', user.user_type);

      const isValidPassword = await this.userDAO.verifyPassword(user.username, password);
      if (!isValidPassword) {
        console.log('❌ Invalid password for:', user.username);
        return { success: false, error: 'Ongeldige gebruikersnaam/email of wachtwoord' };
      }

      console.log('✅ Password verified for:', user.username);

      const { password: _, ...userWithoutPassword } = user;
      
      console.log('🔍 User data from database:', userWithoutPassword);
      
      // Map user_type to role for consistency
      if (userWithoutPassword.user_type === 'staff' && userWithoutPassword.username === 'Mike') {
        userWithoutPassword.role = 'admin'; // Mike is the admin/owner
        console.log('👑 Mike mapped to admin role');
      } else if (userWithoutPassword.user_type === 'staff') {
        userWithoutPassword.role = 'staff';
        console.log('👨‍💼 Staff user mapped to staff role');
      } else if (userWithoutPassword.user_type === 'customer') {
        userWithoutPassword.role = 'customer';
        console.log('👤 Customer user mapped to customer role');
      }
      
      console.log('✅ Final user object:', userWithoutPassword);
      
      return { success: true, user: userWithoutPassword, message: 'Login successful' };
    } catch (err) {
      console.error('authenticateUser error:', err);
      return { success: false, error: 'Authenticatie mislukt' };
    }
  }

  async registerCustomer(userData) {
    try {
      const existingUser = await this.userDAO.findByUsername(userData.username);
      if (existingUser) return { success: false, message: 'Username already exists' };

      const existingEmail = await this.userDAO.findByEmail(userData.email);
      if (existingEmail) return { success: false, message: 'Email already exists' };

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const result = await this.userDAO.createCustomer({
        ...userData,
        password: hashedPassword,
        active: true
      });

      return result.success
        ? { success: true, customerId: result.customerId, message: 'Registration successful' }
        : { success: false, message: 'Registration failed' };
    } catch (err) {
      console.error('registerCustomer error:', err);
      return { success: false, message: 'Registration failed' };
    }
  }

  async getUserById(userId, userType) {
    try {
      const user = await this.userDAO.findById(userId, userType);
      if (!user) return null;
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (err) {
      console.error('getUserById error:', err);
      return null;
    }
  }

  async changePassword(userId, userType, currentPassword, newPassword) {
    try {
      const user = await this.userDAO.findById(userId, userType);
      if (!user) return { success: false, message: 'User not found' };

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return { success: false, message: 'Current password incorrect' };

      const hashed = await bcrypt.hash(newPassword, 10);
      const result = await this.userDAO.updatePassword(userId, userType, hashed);

      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Password changed' : 'Failed to change password'
      };
    } catch (err) {
      console.error('changePassword error:', err);
      return { success: false, message: 'Failed to change password' };
    }
  }

  async updateProfile(userId, userType, profileData) {
    try {
      const result = await this.userDAO.updateProfile(userId, userType, profileData);
      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Profile updated' : 'Failed to update profile'
      };
    } catch (err) {
      console.error('updateProfile error:', err);
      return { success: false, message: 'Failed to update profile' };
    }
  }

  async validatePermissions(userId, userType, requiredPermission) {
    const perms = {
      customer: ['view_films', 'rent_films', 'view_rentals'],
      staff: ['view_films', 'rent_films', 'view_rentals', 'manage_customers', 'manage_inventory'],
      owner: ['view_films', 'rent_films', 'view_rentals', 'manage_customers', 'manage_inventory', 'manage_staff', 'view_analytics']
    };
    return (perms[userType] || []).includes(requiredPermission);
  }

  async logoutUser() {
    return { success: true, message: 'Logout successful' };
  }

  async isUserActive(userIdOrUsername, userType = null) {
    try {
      let user;
      if (userType) {
        // Called with userId and userType
        user = await this.userDAO.findById(userIdOrUsername, userType);
      } else {
        // Called with username only
        user = await this.userDAO.findByUsername(userIdOrUsername);
        if (!user) {
          user = await this.userDAO.findByEmail(userIdOrUsername);
        }
      }
      return user && user.active === 1;
    } catch (err) {
      console.error('isUserActive error:', err);
      return false;
    }
  }
}

module.exports = AuthService;