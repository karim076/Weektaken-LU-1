const OwnerDAO = require('../dao/OwnerDAO');
const AuthService = require('./AuthService');

/**
 * Service for owner business logic
 */
class OwnerService {
  constructor() {
    this.ownerDAO = new OwnerDAO();
    this.authService = new AuthService();
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const stats = await this.ownerDAO.getDashboardStats();
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van statistieken'
      };
    }
  }

  /**
   * Get all staff members with store assignments
   */
  async getAllStaff() {
    try {
      const staff = await this.ownerDAO.getStaffWithStoreAssignments();
      
      return {
        success: true,
        data: staff
      };
    } catch (error) {
      console.error('Get all staff error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van personeelsgegevens'
      };
    }
  }

  /**
   * Get staff member details
   */
  async getStaffDetails(staffId) {
    try {
      const staff = await this.ownerDAO.getStaffWithAssignments(staffId);
      
      if (!staff) {
        return {
          success: false,
          message: 'Personeelslid niet gevonden'
        };
      }

      return {
        success: true,
        data: staff
      };
    } catch (error) {
      console.error('Get staff details error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van personeelsgegevens'
      };
    }
  }

  /**
   * Create new staff member
   */
  async createStaff(staffData) {
    try {
      const { firstName, lastName, email, username, password, storeId } = staffData;

      // Check if username/email already exists
      const usernameExists = await this.authService.userDAO.usernameExists(username);
      const emailExists = await this.authService.userDAO.emailExists(email);

      if (usernameExists) {
        return {
          success: false,
          message: 'Gebruikersnaam bestaat al'
        };
      }

      if (emailExists) {
        return {
          success: false,
          message: 'Email adres is al geregistreerd'
        };
      }

      // Hash password
      const hashedPassword = await this.authService.hashPassword(password);

      // Create staff member
      const result = await this.ownerDAO.createStaff({
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        storeId,
        active: true
      });

      return {
        success: true,
        data: {
          staffId: result.insertId
        },
        message: 'Personeelslid succesvol aangemaakt'
      };
    } catch (error) {
      console.error('Create staff error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het aanmaken van het personeelslid'
      };
    }
  }

  /**
   * Update staff member
   */
  async updateStaff(staffId, staffData) {
    try {
      // Hash password if provided
      if (staffData.password) {
        staffData.password = await this.authService.hashPassword(staffData.password);
      }

      const result = await this.ownerDAO.updateStaff(staffId, staffData);
      
      if (result.affectedRows === 0) {
        return {
          success: false,
          message: 'Personeelslid niet gevonden of geen wijzigingen aangebracht'
        };
      }

      return {
        success: true,
        message: 'Personeelsgegevens succesvol bijgewerkt'
      };
    } catch (error) {
      console.error('Update staff error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het bijwerken van personeelsgegevens'
      };
    }
  }

  /**
   * Delete/deactivate staff member
   */
  async deleteStaff(staffId) {
    try {
      const result = await this.ownerDAO.updateStaff(staffId, { active: false });
      
      if (result.affectedRows === 0) {
        return {
          success: false,
          message: 'Personeelslid niet gevonden'
        };
      }

      // Logout staff from all devices
      await this.authService.logoutAllDevices(staffId, 'staff');

      return {
        success: true,
        message: 'Personeelslid succesvol gedeactiveerd'
      };
    } catch (error) {
      console.error('Delete staff error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het deactiveren van het personeelslid'
      };
    }
  }

  /**
   * Assign staff to store
   */
  async assignStaffToStore(staffId, storeId, assignedBy) {
    try {
      await this.ownerDAO.assignStaffToStore(staffId, storeId, assignedBy);
      
      return {
        success: true,
        message: 'Personeelslid succesvol toegewezen aan winkel'
      };
    } catch (error) {
      console.error('Assign staff to store error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het toewijzen van het personeelslid'
      };
    }
  }

  /**
   * Remove staff from store
   */
  async removeStaffFromStore(staffId, storeId) {
    try {
      await this.ownerDAO.removeStaffFromStore(staffId, storeId);
      
      return {
        success: true,
        message: 'Personeelslid succesvol verwijderd van winkel'
      };
    } catch (error) {
      console.error('Remove staff from store error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het verwijderen van het personeelslid'
      };
    }
  }

  /**
   * Get all stores
   */
  async getAllStores() {
    try {
      const stores = await this.ownerDAO.getAllStores();
      
      return {
        success: true,
        data: stores
      };
    } catch (error) {
      console.error('Get all stores error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van winkelgegevens'
      };
    }
  }

  /**
   * Get store staff assignments
   */
  async getStoreStaffAssignments(storeId) {
    try {
      const assignments = await this.ownerDAO.getStoreStaffAssignments(storeId);
      
      return {
        success: true,
        data: assignments
      };
    } catch (error) {
      console.error('Get store staff assignments error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van winkeltoewijzingen'
      };
    }
  }

  /**
   * Get staff management overview
   */
  async getStaffManagementOverview() {
    try {
      const [staffResult, storesResult] = await Promise.all([
        this.getAllStaff(),
        this.getAllStores()
      ]);

      if (!staffResult.success || !storesResult.success) {
        return {
          success: false,
          message: 'Er is een fout opgetreden bij het ophalen van gegevens'
        };
      }

      return {
        success: true,
        data: {
          staff: staffResult.data,
          stores: storesResult.data
        }
      };
    } catch (error) {
      console.error('Get staff management overview error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van beheeroverzicht'
      };
    }
  }
}

module.exports = OwnerService;
