const OwnerDAO = require('../dao/OwnerDAO');

/**
 * Service for owner/admin business logic
 */
class OwnerService {
  constructor() {
    this.ownerDAO = new OwnerDAO();
  }

  /**
   * Get dashboard overview statistics
   */
  async getDashboardOverview() {
    try {
      const stats = await this.ownerDAO.getDashboardStats();
      const rentalStats = await this.ownerDAO.getRentalStats(30);
      const topFilms = await this.ownerDAO.getTopFilms(5);
      const inventorySummary = await this.ownerDAO.getInventorySummary();

      return {
        stats,
        rentalStats,
        topFilms,
        inventorySummary
      };
    } catch (error) {
      console.error('Get dashboard overview error:', error);
      throw error;
    }
  }

  /**
   * Get all staff members with store assignments
   */
  async getAllStaff() {
    try {
      return await this.ownerDAO.getStaffWithStoreAssignments();
    } catch (error) {
      console.error('Get all staff error:', error);
      throw error;
    }
  }

  /**
   * Get staff member details with assignments
   */
  async getStaffDetails(staffId) {
    try {
      return await this.ownerDAO.getStaffWithAssignments(staffId);
    } catch (error) {
      console.error('Get staff details error:', error);
      throw error;
    }
  }

  /**
   * Create new staff member
   */
  async createStaff(staffData) {
    try {
      // Validate staff data
      const validation = this.validateStaffData(staffData);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        };
      }

      const result = await this.ownerDAO.createStaff(staffData);
      
      return {
        success: true,
        staffId: result.insertId,
        addressId: result.addressId,
        message: 'Staff member created successfully'
      };
    } catch (error) {
      console.error('Create staff error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create staff member'
      };
    }
  }

  /**
   * Update staff member information
   */
  async updateStaff(staffId, staffData) {
    try {
      const result = await this.ownerDAO.updateStaff(staffId, staffData);
      
      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Staff member updated successfully' : 'No changes made'
      };
    } catch (error) {
      console.error('Update staff error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update staff member'
      };
    }
  }

  /**
   * Assign staff to store
   */
  async assignStaffToStore(staffId, storeId, assignedBy) {
    try {
      const result = await this.ownerDAO.assignStaffToStore(staffId, storeId, assignedBy);
      
      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Staff assigned to store successfully' : 'Assignment failed'
      };
    } catch (error) {
      console.error('Assign staff to store error:', error);
      return {
        success: false,
        message: error.message || 'Failed to assign staff to store'
      };
    }
  }

  /**
   * Remove staff from store
   */
  async removeStaffFromStore(staffId, storeId) {
    try {
      const result = await this.ownerDAO.removeStaffFromStore(staffId, storeId);
      
      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Staff removed from store successfully' : 'Removal failed'
      };
    } catch (error) {
      console.error('Remove staff from store error:', error);
      return {
        success: false,
        message: error.message || 'Failed to remove staff from store'
      };
    }
  }

  /**
   * Get all stores with details
   */
  async getAllStores() {
    try {
      return await this.ownerDAO.getAllStores();
    } catch (error) {
      console.error('Get all stores error:', error);
      throw error;
    }
  }

  /**
   * Get store staff assignments
   */
  async getStoreStaff(storeId) {
    try {
      return await this.ownerDAO.getStoreStaffAssignments(storeId);
    } catch (error) {
      console.error('Get store staff error:', error);
      throw error;
    }
  }

  /**
   * Get rental analytics
   */
  async getRentalAnalytics(days = 30) {
    try {
      const rentalStats = await this.ownerDAO.getRentalStats(days);
      
      // Process data for charts
      const chartData = {
        labels: rentalStats.map(stat => stat.rental_date),
        rentals: rentalStats.map(stat => stat.daily_rentals),
        revenue: rentalStats.map(stat => parseFloat(stat.daily_revenue || 0))
      };

      // Calculate totals and averages
      const totalRentals = chartData.rentals.reduce((sum, count) => sum + count, 0);
      const totalRevenue = chartData.revenue.reduce((sum, amount) => sum + amount, 0);
      const averageDailyRentals = totalRentals / Math.max(rentalStats.length, 1);
      const averageDailyRevenue = totalRevenue / Math.max(rentalStats.length, 1);

      return {
        chartData,
        summary: {
          totalRentals,
          totalRevenue,
          averageDailyRentals: Math.round(averageDailyRentals * 100) / 100,
          averageDailyRevenue: Math.round(averageDailyRevenue * 100) / 100,
          days
        }
      };
    } catch (error) {
      console.error('Get rental analytics error:', error);
      throw error;
    }
  }

  /**
   * Get film performance analytics
   */
  async getFilmAnalytics(limit = 20) {
    try {
      return await this.ownerDAO.getTopFilms(limit);
    } catch (error) {
      console.error('Get film analytics error:', error);
      throw error;
    }
  }

  /**
   * Get inventory management data
   */
  async getInventoryManagement() {
    try {
      const inventorySummary = await this.ownerDAO.getInventorySummary();
      
      // Calculate totals across all stores
      const totals = inventorySummary.reduce((acc, store) => ({
        uniqueFilms: acc.uniqueFilms + parseInt(store.unique_films || 0),
        totalCopies: acc.totalCopies + parseInt(store.total_copies || 0),
        rentedCopies: acc.rentedCopies + parseInt(store.rented_copies || 0),
        availableCopies: acc.availableCopies + parseInt(store.available_copies || 0)
      }), { uniqueFilms: 0, totalCopies: 0, rentedCopies: 0, availableCopies: 0 });

      return {
        storeInventory: inventorySummary,
        totals
      };
    } catch (error) {
      console.error('Get inventory management error:', error);
      throw error;
    }
  }

  /**
   * Validate staff data
   */
  validateStaffData(staffData) {
    const errors = [];

    if (!staffData.firstName || staffData.firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (!staffData.lastName || staffData.lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    if (!staffData.email || !this.isValidEmail(staffData.email)) {
      errors.push('Valid email address is required');
    }

    if (!staffData.username || staffData.username.trim().length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (!staffData.password || staffData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!staffData.storeId || isNaN(parseInt(staffData.storeId))) {
      errors.push('Valid store ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get business insights
   */
  async getBusinessInsights() {
    try {
      const [stats, rentalStats, topFilms, inventory] = await Promise.all([
        this.ownerDAO.getDashboardStats(),
        this.ownerDAO.getRentalStats(7), // Last 7 days
        this.ownerDAO.getTopFilms(10),
        this.ownerDAO.getInventorySummary()
      ]);

      // Calculate insights
      const insights = {
        // Revenue trends
        weeklyRevenue: rentalStats.reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0),
        dailyAverage: rentalStats.length > 0 
          ? rentalStats.reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0) / rentalStats.length 
          : 0,

        // Rental trends
        weeklyRentals: rentalStats.reduce((sum, day) => sum + parseInt(day.daily_rentals || 0), 0),
        rentalAverage: rentalStats.length > 0 
          ? rentalStats.reduce((sum, day) => sum + parseInt(day.daily_rentals || 0), 0) / rentalStats.length 
          : 0,

        // Inventory utilization
        totalInventory: inventory.reduce((sum, store) => sum + parseInt(store.total_copies || 0), 0),
        utilizedInventory: inventory.reduce((sum, store) => sum + parseInt(store.rented_copies || 0), 0),
        utilizationRate: 0,

        // Top performers
        topFilm: topFilms.length > 0 ? topFilms[0] : null,
        totalFilms: stats.total_films || 0
      };

      // Calculate utilization rate
      if (insights.totalInventory > 0) {
        insights.utilizationRate = Math.round((insights.utilizedInventory / insights.totalInventory) * 100);
      }

      return {
        stats,
        insights,
        trends: {
          daily: rentalStats,
          films: topFilms
        }
      };
    } catch (error) {
      console.error('Get business insights error:', error);
      throw error;
    }
  }

  /**
   * Export data for reports
   */
  async exportData(type, filters = {}) {
    try {
      let data = [];

      switch (type) {
        case 'staff':
          data = await this.ownerDAO.getStaffWithStoreAssignments();
          break;
        case 'rentals':
          data = await this.ownerDAO.getRentalStats(filters.days || 30);
          break;
        case 'films':
          data = await this.ownerDAO.getTopFilms(filters.limit || 100);
          break;
        case 'inventory':
          data = await this.ownerDAO.getInventorySummary();
          break;
        default:
          throw new Error('Invalid export type');
      }

      return {
        success: true,
        data,
        type,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Export data error:', error);
      return {
        success: false,
        message: error.message || 'Export failed'
      };
    }
  }
}

module.exports = OwnerService;