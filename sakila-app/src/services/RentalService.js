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
  async createRental(customerId, inventoryId, staffId = 1) {
    try {
      // Business rule: Check availability first
      const availability = await this.rentalDAO.checkInventoryAvailability(inventoryId);
      
      if (!availability.available) {
        throw new Error(availability.reason || 'Film not available for rental');
      }

      // Business rule: Calculate rental amount and status
      const rentalDate = new Date();
      const amount = parseFloat(availability.item.rental_rate);
      const status = 'pending'; // Business rule: new rentals start as pending

      // Create rental through DAO
      const result = await this.rentalDAO.create({
        rental_date: rentalDate,
        inventory_id: inventoryId,
        customer_id: customerId,
        staff_id: staffId,
        status: status,
        amount: amount
      });

      return {
        success: true,
        rental_id: result.rental_id,
        film_title: availability.item.title,
        amount: amount,
        status: status,
        message: 'Rental created successfully. Please proceed to payment.'
      };

    } catch (error) {
      console.error('RentalService createRental error:', error);
      throw error;
    }
  }

  /**
   * Get customer rentals with business logic applied
   */
  async getCustomerRentals(customerId, page = 1, limit = 10) {
    try {
      // Business rule: Validate pagination parameters
      const validatedPage = Math.max(1, parseInt(page) || 1);
      const validatedLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));
      const offset = (validatedPage - 1) * validatedLimit;

      // Get data from DAO
      const rentals = await this.rentalDAO.findByCustomerId(customerId, validatedLimit, offset);
      const totalCount = await this.rentalDAO.countByCustomerId(customerId);
      const stats = await this.rentalDAO.getStatsByCustomerId(customerId);

      // Business logic: Process statistics
      const processedStats = this.processRentalStats(stats);
      
      // Business logic: Filter active rentals
      const activeRentals = rentals.filter(rental => 
        ['processing', 'pending', 'paid', 'rented'].includes(rental.status)
      );

      // Business logic: Calculate pagination
      const totalPages = Math.ceil(totalCount / validatedLimit);

      return {
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
      };

    } catch (error) {
      console.error('RentalService getCustomerRentals error:', error);
      throw error;
    }
  }

  /**
   * Get single rental by ID
   */
  async getRentalById(rentalId) {
    try {
      const rental = await this.rentalDAO.findById(rentalId);
      
      if (!rental) {
        throw new Error('Rental not found');
      }

      return {
        success: true,
        rental
      };
    } catch (error) {
      console.error('RentalService getRentalById error:', error);
      throw error;
    }
  }

  /**
   * Update rental status (business logic for status transitions)
   */
  async updateRentalStatus(rentalId, newStatus, staffId) {
    try {
      // Business rule: Validate status transition
      const validStatuses = ['pending', 'paid', 'rented', 'returned'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid status');
      }

      // Get current rental to check current status
      const currentRental = await this.rentalDAO.findById(rentalId);
      if (!currentRental) {
        throw new Error('Rental not found');
      }

      // Business rule: Check valid status transitions
      const validTransitions = this.getValidStatusTransitions(currentRental.status);
      if (!validTransitions.includes(newStatus)) {
        throw new Error(`Cannot change status from ${currentRental.status} to ${newStatus}`);
      }

      // Update through DAO
      const result = await this.rentalDAO.updateStatus(rentalId, newStatus, staffId);

      if (!result.success) {
        throw new Error('Failed to update rental status');
      }

      return {
        success: true,
        message: `Rental status updated to ${newStatus}`
      };

    } catch (error) {
      console.error('RentalService updateRentalStatus error:', error);
      throw error;
    }
  }

  /**
   * Cancel rental (business logic)
   */
  async cancelRental(rentalId, customerId) {
    try {
      // Get rental to verify ownership and status
      const rental = await this.rentalDAO.findById(rentalId);
      
      if (!rental) {
        throw new Error('Rental not found');
      }

      // Business rule: Only customer can cancel their own rental
      if (rental.customer_id !== customerId) {
        throw new Error('Unauthorized: Cannot cancel another customer\'s rental');
      }

      // Business rule: Can only cancel processing/pending rentals
      if (!['processing', 'pending'].includes(rental.status)) {
        throw new Error('Cannot cancel rental in current status');
      }

      // Delete rental through DAO
      const result = await this.rentalDAO.delete(rentalId);

      if (!result.success) {
        throw new Error('Failed to cancel rental');
      }

      return {
        success: true,
        message: 'Rental cancelled successfully'
      };

    } catch (error) {
      console.error('RentalService cancelRental error:', error);
      throw error;
    }
  }

  /**
   * Process payment for rental (business logic)
   */
  async processPayment(rentalId, customerId, amount) {
    try {
      // Get rental to verify
      const rental = await this.rentalDAO.findById(rentalId);
      
      if (!rental) {
        throw new Error('Rental not found');
      }

      // Business rule: Verify ownership
      if (rental.customer_id !== customerId) {
        throw new Error('Unauthorized: Cannot pay for another customer\'s rental');
      }

      // Business rule: Can only pay for pending rentals
      if (rental.status !== 'pending') {
        throw new Error('Rental is not in a payable state');
      }

      // Business rule: Verify amount
      if (parseFloat(amount) !== parseFloat(rental.amount)) {
        throw new Error('Payment amount does not match rental amount');
      }

      // Update status to paid
      const result = await this.rentalDAO.updateStatus(rentalId, 'paid');

      if (!result.success) {
        throw new Error('Failed to process payment');
      }

      return {
        success: true,
        message: 'Payment processed successfully'
      };

    } catch (error) {
      console.error('RentalService processPayment error:', error);
      throw error;
    }
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
      'pending': ['paid', 'cancelled'],
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
}

module.exports = RentalService;
