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
  getDashboardOverview(callback) {
    this.ownerDAO.getDashboardStats((error, stats) => {
      if (error) {
        console.error('Get dashboard overview stats error:', error);
        return callback(error);
      }
      
      this.ownerDAO.getRentalStats(30, (error, rentalStats) => {
        if (error) {
          console.error('Get dashboard overview rental stats error:', error);
          return callback(error);
        }
        
        this.ownerDAO.getTopFilms(5, (error, topFilms) => {
          if (error) {
            console.error('Get dashboard overview top films error:', error);
            return callback(error);
          }
          
          this.ownerDAO.getInventorySummary((error, inventorySummary) => {
            if (error) {
              console.error('Get dashboard overview inventory error:', error);
              return callback(error);
            }

            callback(null, {
              stats,
              rentalStats,
              topFilms,
              inventorySummary
            });
          });
        });
      });
    });
  }

  /**
   * Get all staff members with store assignments
   */
  getAllStaff(callback) {
    this.ownerDAO.getStaffWithStoreAssignments((error, result) => {
      if (error) {
        console.error('Get all staff error:', error);
        return callback(error);
      }
      callback(null, result);
    });
  }

  /**
   * Get staff member details with assignments
   */
  getStaffDetails(staffId, callback) {
    this.ownerDAO.getStaffWithAssignments(staffId, (error, result) => {
      if (error) {
        console.error('Get staff details error:', error);
        return callback(error);
      }
      callback(null, result);
    });
  }

  /**
   * Create new staff member
   */
  createStaff(staffData, callback) {
    // Validate staff data
    const validation = this.validateStaffData(staffData);
    if (!validation.isValid) {
      return callback(null, {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    this.ownerDAO.createStaff(staffData, (error, result) => {
      if (error) {
        console.error('Create staff error:', error);
        return callback(null, {
          success: false,
          message: error.message || 'Failed to create staff member'
        });
      }
      
      callback(null, {
        success: true,
        staffId: result.insertId,
        addressId: result.addressId,
        message: 'Staff member created successfully'
      });
    });
  }

  /**
   * Update staff member information
   */
  updateStaff(staffId, staffData, callback) {
    this.ownerDAO.updateStaff(staffId, staffData, (error, result) => {
      if (error) {
        console.error('Update staff error:', error);
        return callback(null, {
          success: false,
          message: error.message || 'Failed to update staff member'
        });
      }
      
      callback(null, {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Staff member updated successfully' : 'No changes made'
      });
    });
  }

  /**
   * Assign staff to store
   */
  assignStaffToStore(staffId, storeId, assignedBy, callback) {
    this.ownerDAO.assignStaffToStore(staffId, storeId, assignedBy, (error, result) => {
      if (error) {
        console.error('Assign staff to store error:', error);
        return callback(null, {
          success: false,
          message: error.message || 'Failed to assign staff to store'
        });
      }
      
      callback(null, {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Staff assigned to store successfully' : 'Assignment failed'
      });
    });
  }

  /**
   * Remove staff from store
   */
  removeStaffFromStore(staffId, storeId, callback) {
    this.ownerDAO.removeStaffFromStore(staffId, storeId, (error, result) => {
      if (error) {
        console.error('Remove staff from store error:', error);
        return callback(null, {
          success: false,
          message: error.message || 'Failed to remove staff from store'
        });
      }
      
      callback(null, {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Staff removed from store successfully' : 'Removal failed'
      });
    });
  }

  /**
   * Get all stores with details
   */
  getAllStores(callback) {
    this.ownerDAO.getAllStores((error, result) => {
      if (error) {
        console.error('Get all stores error:', error);
        return callback(error);
      }
      callback(null, result);
    });
  }

  /**
   * Get store staff assignments
   */
  getStoreStaff(storeId, callback) {
    this.ownerDAO.getStoreStaffAssignments(storeId, (error, result) => {
      if (error) {
        console.error('Get store staff error:', error);
        return callback(error);
      }
      callback(null, result);
    });
  }

  /**
   * Get rental analytics
   */
  getRentalAnalytics(days = 30, callback) {
    this.ownerDAO.getRentalStats(days, (error, rentalStats) => {
      if (error) {
        console.error('Get rental analytics error:', error);
        return callback(error);
      }
      
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

      callback(null, {
        chartData,
        summary: {
          totalRentals,
          totalRevenue,
          averageDailyRentals: Math.round(averageDailyRentals * 100) / 100,
          averageDailyRevenue: Math.round(averageDailyRevenue * 100) / 100,
          days
        }
      });
    });
  }

  /**
   * Get film performance analytics
   */
  getFilmAnalytics(limit = 20, callback) {
    this.ownerDAO.getTopFilms(limit, (error, result) => {
      if (error) {
        console.error('Get film analytics error:', error);
        return callback(error);
      }
      callback(null, result);
    });
  }

  /**
   * Get inventory management data
   */
  getInventoryManagement(callback) {
    this.ownerDAO.getInventorySummary((error, inventorySummary) => {
      if (error) {
        console.error('Get inventory management error:', error);
        return callback(error);
      }
      
      // Calculate totals across all stores
      const totals = inventorySummary.reduce((acc, store) => ({
        uniqueFilms: acc.uniqueFilms + parseInt(store.unique_films || 0),
        totalCopies: acc.totalCopies + parseInt(store.total_copies || 0),
        rentedCopies: acc.rentedCopies + parseInt(store.rented_copies || 0),
        availableCopies: acc.availableCopies + parseInt(store.available_copies || 0)
      }), { uniqueFilms: 0, totalCopies: 0, rentedCopies: 0, availableCopies: 0 });

      callback(null, {
        storeInventory: inventorySummary,
        totals
      });
    });
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
  getBusinessInsights(callback) {
    // Get dashboard stats first
    this.ownerDAO.getDashboardStats((error, stats) => {
      if (error) {
        console.error('Get business insights error:', error);
        return callback(error);
      }
      
      // Get rental stats (last 7 days)
      this.ownerDAO.getRentalStats(7, (error, rentalStats) => {
        if (error) {
          console.error('Get business insights error:', error);
          return callback(error);
        }
        
        // Get top films
        this.ownerDAO.getTopFilms(10, (error, topFilms) => {
          if (error) {
            console.error('Get business insights error:', error);
            return callback(error);
          }
          
          // Get inventory summary
          this.ownerDAO.getInventorySummary((error, inventory) => {
            if (error) {
              console.error('Get business insights error:', error);
              return callback(error);
            }
            
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

            callback(null, {
              stats,
              insights,
              trends: {
                daily: rentalStats,
                films: topFilms
              }
            });
          });
        });
      });
    });
  }

  /**
   * Export data for reports
   */
  exportData(type, filters = {}, callback) {
    switch (type) {
      case 'staff':
        this.ownerDAO.getStaffWithStoreAssignments((error, data) => {
          if (error) {
            console.error('Export data error:', error);
            return callback(null, {
              success: false,
              message: error.message || 'Export failed'
            });
          }
          callback(null, {
            success: true,
            data,
            type,
            exportDate: new Date().toISOString()
          });
        });
        break;
        
      case 'rentals':
        this.ownerDAO.getRentalStats(filters.days || 30, (error, data) => {
          if (error) {
            console.error('Export data error:', error);
            return callback(null, {
              success: false,
              message: error.message || 'Export failed'
            });
          }
          callback(null, {
            success: true,
            data,
            type,
            exportDate: new Date().toISOString()
          });
        });
        break;
        
      case 'films':
        this.ownerDAO.getTopFilms(filters.limit || 100, (error, data) => {
          if (error) {
            console.error('Export data error:', error);
            return callback(null, {
              success: false,
              message: error.message || 'Export failed'
            });
          }
          callback(null, {
            success: true,
            data,
            type,
            exportDate: new Date().toISOString()
          });
        });
        break;
        
      case 'inventory':
        this.ownerDAO.getInventorySummary((error, data) => {
          if (error) {
            console.error('Export data error:', error);
            return callback(null, {
              success: false,
              message: error.message || 'Export failed'
            });
          }
          callback(null, {
            success: true,
            data,
            type,
            exportDate: new Date().toISOString()
          });
        });
        break;
        
      default:
        callback(null, {
          success: false,
          message: 'Invalid export type'
        });
    }
  }
}

module.exports = OwnerService;