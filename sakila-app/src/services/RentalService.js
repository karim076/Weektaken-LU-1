const RentalDAO = require('../dao/RentalDAO');

/**
 * Service layer for Rental business logic
 * Contains no database access - delegates to DAO layer
 */
class RentalService {
  constructor() {
    this.rentalDAO = new RentalDAO();
  }

  /**
   * Create new rental (business logic)
   */
  createRental(customerId, inventoryId, staffId = 1, callback) {
    // Business rule: Check availability first
    this.rentalDAO.checkInventoryAvailability(inventoryId, (error, availability) => {
      if (error) {
        return callback(error);
      }
      
      if (!availability.available) {
        return callback(new Error(availability.reason || 'Film not available for rental'));
      }

      // Business rule: Calculate rental amount and status
      const rentalDate = new Date();
      const amount = parseFloat(availability.item.rental_rate);
      const status = 'pending'; // Business rule: new rentals start as pending

      // Create rental through DAO
      this.rentalDAO.create({
        rental_date: rentalDate,
        inventory_id: inventoryId,
        customer_id: customerId,
        staff_id: staffId,
        status: status,
        amount: amount
      }, (createError, result) => {
        if (createError) {
          console.error('RentalService createRental error:', createError);
          return callback(createError);
        }

        callback(null, {
          success: true,
          rental_id: result.rental_id,
          film_title: availability.item.title,
          amount: amount,
          status: status,
          message: 'Rental created successfully. Please proceed to payment.'
        });
      });
    });
  }

  /**
   * Get customer rentals with business logic applied
   */
  getCustomerRentals(customerId, page = 1, limit = 10, callback) {
    // Business rule: Validate pagination parameters
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (validatedPage - 1) * validatedLimit;

    // Get data from DAO
    this.rentalDAO.findByCustomerId(customerId, validatedLimit, offset, (error, rentals) => {
      if (error) {
        return callback(error);
      }

      this.rentalDAO.countByCustomerId(customerId, (countError, totalCount) => {
        if (countError) {
          return callback(countError);
        }

        this.rentalDAO.getStatsByCustomerId(customerId, (statsError, stats) => {
          if (statsError) {
            return callback(statsError);
          }

          // Business logic: Process statistics
          const processedStats = this.processRentalStats(stats);
          
          // Business logic: Filter active rentals
          const activeRentals = rentals.filter(rental => 
            ['processing', 'pending', 'paid', 'rented'].includes(rental.status)
          );

          // Business logic: Calculate pagination
          const totalPages = Math.ceil(totalCount / validatedLimit);

          callback(null, {
            success: true,
            rentals,
            stats: processedStats,
            activeRentals,
            pagination: {
              currentPage: validatedPage,
              totalPages,
              totalItems: totalCount,
              hasNext: validatedPage < totalPages,
              hasPrev: validatedPage > 1
            }
          });
        });
      });
    });
  }

  /**
   * Get single rental by ID
   */
  getRentalById(rentalId, callback) {
    this.rentalDAO.findById(rentalId, (error, rental) => {
      if (error) {
        console.error('RentalService getRentalById error:', error);
        return callback(error);
      }
      
      if (!rental) {
        return callback(new Error('Rental not found'));
      }

      callback(null, {
        success: true,
        rental
      });
    });
  }

  /**
   * Update rental status (business logic for status transitions)
   */
  updateRentalStatus(rentalId, newStatus, staffId, callback) {
    // Business rule: Validate status transition
    const validStatuses = ['pending', 'reserved', 'in_behandeling', 'paid', 'rented', 'returned', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return callback(new Error('Invalid status'));
    }

    // Get current rental to check current status
    this.rentalDAO.findById(rentalId, (error, currentRental) => {
      if (error) {
        console.error('RentalService updateRentalStatus error:', error);
        return callback(error);
      }
      
      if (!currentRental) {
        return callback(new Error('Rental not found'));
      }

      // Business rule: Check valid status transitions
      const validTransitions = this.getValidStatusTransitions(currentRental.status);
      if (!validTransitions.includes(newStatus)) {
        return callback(new Error(`Cannot change status from ${currentRental.status} to ${newStatus}`));
      }

      // Update through DAO
      this.rentalDAO.updateStatus(rentalId, newStatus, staffId, (updateError, result) => {
        if (updateError) {
          console.error('RentalService updateRentalStatus update error:', updateError);
          return callback(updateError);
        }

        if (!result.success) {
          return callback(new Error('Failed to update rental status'));
        }

        callback(null, {
          success: true,
          message: `Rental status updated to ${newStatus}`
        });
      });
    });
  }

  /**
   * Update rental due date
   */
  updateDueDate(rentalId, newDueDate, staffId, reason = null, callback) {
    // Handle optional reason parameter
    if (typeof reason === 'function') {
      callback = reason;
      reason = null;
    }
    
    // Validate rental exists and is not returned
    this.rentalDAO.findById(rentalId, (error, rental) => {
      if (error) {
        console.error('RentalService updateDueDate error:', error);
        return callback(error);
      }
      
      if (!rental) {
        return callback(null, {
          success: false,
          message: 'Verhuur niet gevonden'
        });
      }

      if (rental.return_date) {
        return callback(null, {
          success: false,
          message: 'Kan inleverdatum niet wijzigen voor teruggegeven film'
        });
      }

      // Update due date in database
      this.rentalDAO.updateDueDate(rentalId, newDueDate, staffId, (updateError, result) => {
        if (updateError) {
          console.error('RentalService updateDueDate update error:', updateError);
          return callback(updateError);
        }

        if (result.success) {
          // Log the change if reason is provided
          if (reason && reason.trim()) {
            console.log(`Due date updated for rental ${rentalId} by staff ${staffId}. Reason: ${reason}`);
          }

          callback(null, {
            success: true,
            message: 'Inleverdatum succesvol bijgewerkt'
          });
        } else {
          callback(null, {
            success: false,
            message: 'Fout bij bijwerken inleverdatum'
          });
        }
      });
    });
  }

  /**
   * Cancel rental (business logic)
   */
  cancelRental(rentalId, customerId, callback) {
    // Get rental to verify ownership and status
    this.rentalDAO.findById(rentalId, (error, rental) => {
      if (error) {
        console.error('RentalService cancelRental error:', error);
        return callback(error);
      }
      
      if (!rental) {
        return callback(new Error('Rental not found'));
      }

      // Business rule: Only customer can cancel their own rental
      if (rental.customer_id !== customerId) {
        return callback(new Error('Unauthorized: Cannot cancel another customer\'s rental'));
      }

      // Business rule: Can only cancel processing/pending rentals
      if (!['processing', 'pending'].includes(rental.status)) {
        return callback(new Error('Cannot cancel rental in current status'));
      }

      // Delete rental through DAO
      this.rentalDAO.delete(rentalId, (deleteError, result) => {
        if (deleteError) {
          console.error('RentalService cancelRental delete error:', deleteError);
          return callback(deleteError);
        }

        if (!result.success) {
          return callback(new Error('Failed to cancel rental'));
        }

        callback(null, {
          success: true,
          message: 'Rental cancelled successfully'
        });
      });
    });
  }

  /**
   * Process payment for rental (business logic)
   */
  processPayment(rentalId, customerId, amount, callback) {
    // Get rental to verify
    this.rentalDAO.findById(rentalId, (error, rental) => {
      if (error) {
        console.error('RentalService processPayment error:', error);
        return callback(error);
      }
      
      if (!rental) {
        return callback(new Error('Rental not found'));
      }

      // Business rule: Verify ownership
      if (rental.customer_id !== customerId) {
        return callback(new Error('Unauthorized: Cannot pay for another customer\'s rental'));
      }

      // Business rule: Can only pay for pending rentals
      if (rental.status !== 'pending') {
        return callback(new Error('Rental is not in a payable state'));
      }

      // Business rule: Verify amount
      if (parseFloat(amount) !== parseFloat(rental.amount)) {
        return callback(new Error('Payment amount does not match rental amount'));
      }

      // Update status to paid
      this.rentalDAO.updateStatus(rentalId, 'paid', (updateError, result) => {
        if (updateError) {
          console.error('RentalService processPayment update error:', updateError);
          return callback(updateError);
        }

        if (!result.success) {
          return callback(new Error('Failed to process payment'));
        }

        callback(null, {
          success: true,
          message: 'Payment processed successfully'
        });
      });
    });
  }

  /**
   * Business logic: Process rental statistics
   */
  processRentalStats(stats) {
    const processedStats = {
      processing: 0,
      pending: 0,
      paid: 0,
      rented: 0,
      returned: 0,
      total_spent: parseFloat(stats.overallStats.total_spent || 0),
      total_rentals: parseInt(stats.overallStats.total_rentals || 0),
      paid_amount: parseFloat(stats.overallStats.paid_amount || 0),
      completed_amount: parseFloat(stats.overallStats.completed_amount || 0)
    };

    // Process status counts
    stats.statusStats.forEach(stat => {
      if (processedStats.hasOwnProperty(stat.status)) {
        processedStats[stat.status] = parseInt(stat.count);
      }
    });

    return processedStats;
  }

  /**
   * Business logic: Get valid status transitions
   */
  getValidStatusTransitions(currentStatus) {
    const transitions = {
      'processing': ['pending', 'cancelled'],
      'pending': ['paid', 'rented', 'cancelled'],
      'reserved': ['in_behandeling', 'rented', 'cancelled'],
      'in_behandeling': ['rented', 'cancelled'],
      'paid': ['rented'],
      'rented': ['returned'],
      'returned': [], // Final state
      'cancelled': [] // Final state
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Business logic: Check if rental can be cancelled
   */
  canBeCancelled(rental) {
    return ['processing', 'pending'].includes(rental.status);
  }

  /**
   * Business logic: Check if rental can be paid
   */
  canBePaid(rental) {
    return rental.status === 'pending';
  }

  /**
   * Business logic: Check if rental is overdue
   */
  isOverdue(rental) {
    if (!rental.expected_return_date || rental.return_date) {
      return false;
    }
    
    const now = new Date();
    const dueDate = new Date(rental.expected_return_date);
    return now > dueDate;
  }

  /**
   * Business logic: Calculate late fees
   */
  calculateLateFees(rental) {
    if (!this.isOverdue(rental)) {
      return 0;
    }

    const now = new Date();
    const dueDate = new Date(rental.expected_return_date);
    const daysLate = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
    
    // Business rule: €1 per day late fee
    return daysLate * 1.00;
  }

  /**
   * Staff Methods - Voor staff functionaliteit
   */

  // Haal recente verhuur op
  getRecentRentals(limit = 10, callback) {
    this.rentalDAO.getRecentRentals(limit, (error, rentals) => {
      if (error) {
        console.error('Get recent rentals error:', error);
        return callback(null, { success: false, rentals: [] });
      }
      callback(null, {
        success: true,
        rentals: rentals || []
      });
    });
  }

  // Haal achterstallige verhuur op
  getOverdueRentals(callback) {
    this.rentalDAO.getOverdueRentals((error, rentals) => {
      if (error) {
        console.error('Get overdue rentals error:', error);
        return callback(null, { success: false, rentals: [] });
      }
      callback(null, {
        success: true,
        rentals: rentals || []
      });
    });
  }

  // Verhuur maken (staff checkout)
  createRental(rentalData, callback) {
    const { customer_id, film_id, staff_id, rental_duration = 3 } = rentalData;
    
    // Zoek beschikbare inventory voor deze film
    this.rentalDAO.findAvailableInventory(film_id, (error, inventory) => {
      if (error) {
        console.error('Create rental inventory error:', error);
        return callback(null, {
          success: false,
          message: 'Fout bij zoeken naar beschikbare film'
        });
      }
      
      if (!inventory) {
        return callback(null, {
          success: false,
          message: 'Film is niet beschikbaar voor verhuur'
        });
      }

      // Maak verhuur aan
      this.rentalDAO.create({
        inventory_id: inventory.inventory_id,
        customer_id: customer_id,
        staff_id: staff_id,
        rental_date: new Date(),
        status: 'rented' // Direct als 'rented' voor staff checkout
      }, (createError, rental) => {
        if (createError) {
          console.error('Create rental error:', createError);
          return callback(null, {
            success: false,
            message: 'Fout bij aanmaken verhuur'
          });
        }

        callback(null, {
          success: true,
          rental,
          message: 'Film succesvol uitgegeven'
        });
      });
    });
  }

  // Film teruggeven (staff checkin)
  returnRental(rentalId, staffId, callback) {
    this.rentalDAO.returnRental(rentalId, staffId, (error, result) => {
      if (error) {
        console.error('Return rental error:', error);
        return callback(null, {
          success: false,
          message: 'Fout bij teruggeven film'
        });
      }
      
      if (result.success) {
        callback(null, {
          success: true,
          rental: result.rental,
          message: 'Film succesvol teruggegeven'
        });
      } else {
        callback(null, {
          success: false,
          message: result.message || 'Fout bij teruggeven film'
        });
      }
    });
  }

  // Update verhuur status
  async updateRentalStatus(rentalId, status) {
    try {
      const result = await this.rentalDAO.updateStatus(rentalId, status);
      return {
        success: true,
        message: 'Status bijgewerkt'
      };
    } catch (error) {
      console.error('Update rental status error:', error);
      return {
        success: false,
        message: 'Fout bij bijwerken status'
      };
    }
  }

  // Haal verhuur op via ID
  async getRentalById(rentalId) {
    try {
      return await this.rentalDAO.findById(rentalId);
    } catch (error) {
      console.error('Get rental by ID error:', error);
      return null;
    }
  }

  // Staff statistieken
  getTotalRentals(callback) {
    this.rentalDAO.getTotalCount((error, count) => {
      if (error) {
        console.error('Get total rentals error:', error);
        return callback(null, { count: 0 });
      }
      callback(null, { count });
    });
  }

  getActiveRentals(callback) {
    this.rentalDAO.getActiveCount((error, count) => {
      if (error) {
        console.error('Get active rentals error:', error);
        return callback(null, { count: 0 });
      }
      callback(null, { count });
    });
  }

  getOverdueCount(callback) {
    this.rentalDAO.getOverdueCount((error, count) => {
      if (error) {
        console.error('Get overdue count error:', error);
        return callback(null, { count: 0 });
      }
      callback(null, { count });
    });
  }

  getTodayRentals(callback) {
    this.rentalDAO.getTodayCount((error, count) => {
      if (error) {
        console.error('Get today rentals error:', error);
        return callback(null, { count: 0 });
      }
      callback(null, { count });
    });
  }

  // Combined stats for dashboard
  async getRentalStats() {
    try {
      const [total, active, overdue, today] = await Promise.all([
        this.getTotalRentals(),
        this.getActiveRentals(),
        this.getOverdueCount(),
        this.getTodayRentals()
      ]);

      return {
        total: total.count || 0,
        active: active.count || 0,
        overdue: overdue.count || 0,
        today: today.count || 0
      };
    } catch (error) {
      console.error('Get rental stats error:', error);
      return {
        total: 0,
        active: 0,
        overdue: 0,
        today: 0
      };
    }
  }

  // Get pending rentals (in behandeling/gereserveerd)
  async getPendingRentals() {
    try {
      const rentals = await this.rentalDAO.getPendingRentals();
      return {
        success: true,
        rentals: rentals || []
      };
    } catch (error) {
      console.error('Get pending rentals error:', error);
      return {
        success: false,
        rentals: []
      };
    }
  }

  // Get all rentals for staff interface
  async getAllRentalsForStaff() {
    try {
      const rentals = await this.rentalDAO.getAllRentalsWithDetails();
      return rentals || [];
    } catch (error) {
      console.error('Get all rentals for staff error:', error);
      return [];
    }
  }

  // Create rental (simplified for staff)
  async createRental({ customer_id, film_id, staff_id }) {
    try {
      // Find available inventory for this film
      const inventory = await this.rentalDAO.findAvailableInventory(film_id);
      
      if (!inventory) {
        throw new Error('Geen beschikbare kopieën van deze film');
      }

      // Create the rental
      const rentalDate = new Date();
      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() + 7); // 7 dagen verhuurperiode

      const rental = await this.rentalDAO.create({
        rental_date: rentalDate,
        inventory_id: inventory.inventory_id,
        customer_id: customer_id,
        return_date: returnDate,
        staff_id: staff_id || 1
      });

      return {
        rental_id: rental.rental_id,
        return_date: returnDate
      };
    } catch (error) {
      console.error('Create rental error:', error);
      throw error;
    }
  }

  // Get active rentals for a specific customer
  async getCustomerActiveRentals(customerId) {
    try {
      const rentals = await this.rentalDAO.getCustomerActiveRentals(customerId);
      return rentals || [];
    } catch (error) {
      console.error('Get customer active rentals error:', error);
      return [];
    }
  }

  // Get all rentals for a specific customer (both active and returned)
  async getCustomerAllRentals(customerId) {
    try {
      const rentals = await this.rentalDAO.getCustomerAllRentals(customerId);
      return rentals || [];
    } catch (error) {
      console.error('Get customer all rentals error:', error);
      return [];
    }
  }
}

module.exports = RentalService;
