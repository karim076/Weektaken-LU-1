const RentalDAO = require('../dao/RentalDAO');

/**
 * Service layer for Rental logic
 * Contains no database access, gets to DAO layer.
 */
class RentalService {
  constructor() {
    this.rentalDAO = new RentalDAO();
  }

  /**
   * Create new rental
   */
  createRental(customerId, inventoryId, staffId = 1, callback) {
    // Check availability first
    this.rentalDAO.checkInventoryAvailability(inventoryId, (error, availability) => {
      if (error) {
        return callback(error);
      }
      
      if (!availability.available) {
        return callback(new Error(availability.reason || 'Film not available for rental'));
      }

      // Calculate rental amount and status
      const rentalDate = new Date();
      const amount = parseFloat(availability.item.rental_rate);
      const status = 'pending'; // new rentals start as pending

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
   * Create rental for staff (different signature for staff operations)
   */
  createStaffRental(rentalData, callback) {
    const { customer_id, film_id, staff_id, rental_duration = 3 } = rentalData;

    // Find available inventory for this film
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

      // Create rental
      this.rentalDAO.create({
        inventory_id: inventory.inventory_id,
        customer_id: customer_id,
        staff_id: staff_id,
        rental_date: new Date(),
        status: 'rented' // Direct as 'rented' for staff checkout
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

  /**
   * Get customer rentals with business logic applied
   */
  getCustomerRentals(customerId, page = 1, limit = 10, callback) {
    // Validate pagination parameters
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

          // Process statistics
          const processedStats = this.processRentalStats(stats);

          // Filter active rentals
          const activeRentals = rentals.filter(rental =>
            ['processing', 'pending', 'paid', 'rented'].includes(rental.status)
          );

          // Calculate pagination
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
   * Get rental details by ID
   */
  getRentalDetails(rentalId, callback) {
    this.rentalDAO.findById(rentalId, (error, rental) => {
      if (error) {
        console.error('RentalService getRentalDetails error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het ophalen van verhuurgegevens'
        });
      }
      
      if (!rental) {
        return callback(null, {
          success: false,
          message: 'Verhuur niet gevonden'
        });
      }

      callback(null, {
        success: true,
        rental
      });
    });
  }

  /**
   * Cancel rental - only for pending rentals
   */
  cancelRental(rentalId, customerId, callback) {
    // Get rental to verify ownership and status
    this.rentalDAO.findById(rentalId, (error, rental) => {
      if (error) {
        console.error('RentalService cancelRental error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het annuleren'
        });
      }
      
      if (!rental) {
        return callback(null, {
          success: false,
          message: 'Verhuur niet gevonden'
        });
      }

      // Verify ownership
      if (rental.customer_id !== customerId) {
        return callback(null, {
          success: false,
          message: 'U kunt alleen uw eigen verhuur annuleren'
        });
      }

      // Can only cancel pending rentals
      if (rental.status !== 'pending') {
        return callback(null, {
          success: false,
          message: 'Deze verhuur kan niet meer worden geannuleerd'
        });
      }

      // Delete rental
      this.rentalDAO.delete(rentalId, (deleteError, result) => {
        if (deleteError) {
          console.error('RentalService cancelRental delete error:', deleteError);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het annuleren'
          });
        }

        if (result.success) {
          callback(null, {
            success: true,
            message: 'Verhuur succesvol geannuleerd'
          });
        } else {
          callback(null, {
            success: false,
            message: 'Verhuur kon niet worden geannuleerd'
          });
        }
      });
    });
  }

  /**
   * Pay for rental
   */
  payRental(rentalId, customerId, amount, callback) {
    // Get rental to verify
    this.rentalDAO.findById(rentalId, (error, rental) => {
      if (error) {
        console.error('RentalService payRental error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij de betaling'
        });
      }
      
      if (!rental) {
        return callback(null, {
          success: false,
          message: 'Verhuur niet gevonden'
        });
      }

      // Verify ownership
      if (rental.customer_id !== customerId) {
        return callback(null, {
          success: false,
          message: 'U kunt alleen uw eigen verhuur betalen'
        });
      }

      // Can only pay for pending rentals
      if (rental.status !== 'pending') {
        return callback(null, {
          success: false,
          message: 'Deze verhuur kan niet worden betaald'
        });
      }

      // Verify amount
      if (parseFloat(amount) !== parseFloat(rental.amount)) {
        return callback(null, {
          success: false,
          message: 'Betalingsbedrag komt niet overeen met verhuurbedrag'
        });
      }

      // Update status to paid
      this.rentalDAO.updateStatus(rentalId, 'paid', (updateError, result) => {
        if (updateError) {
          console.error('RentalService payRental update error:', updateError);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij de betaling'
          });
        }

        if (result.success) {
          callback(null, {
            success: true,
            message: 'Betaling succesvol verwerkt'
          });
        } else {
          callback(null, {
            success: false,
            message: 'Betaling kon niet worden verwerkt'
          });
        }
      });
    });
  }

  /**
   * Return rental
   */
  returnRental(rentalId, customerId, callback) {
    // Get rental to verify
    this.rentalDAO.findById(rentalId, (error, rental) => {
      if (error) {
        console.error('RentalService returnRental error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het inleveren'
        });
      }
      
      if (!rental) {
        return callback(null, {
          success: false,
          message: 'Verhuur niet gevonden'
        });
      }

      // Verify ownership
      if (rental.customer_id !== customerId) {
        return callback(null, {
          success: false,
          message: 'U kunt alleen uw eigen verhuur inleveren'
        });
      }

      // Can't return already returned rentals
      if (rental.return_date) {
        return callback(null, {
          success: false,
          message: 'Deze verhuur is al ingeleverd'
        });
      }

      // Must be paid or rented to return
      if (!['paid', 'rented'].includes(rental.status)) {
        return callback(null, {
          success: false,
          message: 'Deze verhuur kan nog niet worden ingeleverd'
        });
      }

      // Return rental
      this.rentalDAO.returnRental(rentalId, 1, (returnError, result) => {
        if (returnError) {
          console.error('RentalService returnRental error:', returnError);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het inleveren'
          });
        }

        if (result.success) {
          callback(null, {
            success: true,
            message: 'Film succesvol ingeleverd'
          });
        } else {
          callback(null, {
            success: false,
            message: result.message || 'Film kon niet worden ingeleverd'
          });
        }
      });
    });
  }

  /**
   * Extend rental
   */
  extendRental(rentalId, customerId, callback) {
    // Get rental to verify
    this.rentalDAO.findById(rentalId, (error, rental) => {
      if (error) {
        console.error('RentalService extendRental error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het verlengen'
        });
      }
      
      if (!rental) {
        return callback(null, {
          success: false,
          message: 'Verhuur niet gevonden'
        });
      }

      // Verify ownership
      if (rental.customer_id !== customerId) {
        return callback(null, {
          success: false,
          message: 'U kunt alleen uw eigen verhuur verlengen'
        });
      }

      // Can't extend returned rentals
      if (rental.return_date) {
        return callback(null, {
          success: false,
          message: 'Ingeleverde verhuur kan niet worden verlengd'
        });
      }

      // Must be paid or rented to extend
      if (!['paid', 'rented'].includes(rental.status)) {
        return callback(null, {
          success: false,
          message: 'Deze verhuur kan nog niet worden verlengd'
        });
      }

      // Calculate new due date (add 7 days)
      const currentDueDate = rental.due_date ? new Date(rental.due_date) : new Date(rental.rental_date);
      currentDueDate.setDate(currentDueDate.getDate() + 7);

      // Update due date
      this.rentalDAO.updateDueDate(rentalId, currentDueDate, 1, (updateError, result) => {
        if (updateError) {
          console.error('RentalService extendRental error:', updateError);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het verlengen'
          });
        }

        if (result.success) {
          callback(null, {
            success: true,
            message: 'Verhuur succesvol verlengd met 7 dagen'
          });
        } else {
          callback(null, {
            success: false,
            message: 'Verhuur kon niet worden verlengd'
          });
        }
      });
    });
  }

  /**
   * Process rental statistics
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
   * Get valid status transitions
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
   * Staff Methods - For staff functionality
   */

  // Get recent rentals
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

  // Get overdue rentals
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

  // Staff statistics
  getTotalRentals(callback) {
    this.rentalDAO.getTotalCount(callback);
  }

  getActiveRentals(callback) {
    this.rentalDAO.getActiveCount(callback);
  }

  getOverdueCount(callback) {
    this.rentalDAO.getOverdueCount(callback);
  }

  getTodayRentals(callback) {
    this.rentalDAO.getTodayCount(callback);
  }

  // Combined stats for dashboard
  getRentalStats(callback) {
    // Get all stats in parallel using nested callbacks
    this.getTotalRentals((totalError, totalResult) => {
      if (totalError) {
        console.error('Get rental stats error (total):', totalError);
        return callback(null, { total: 0, active: 0, overdue: 0, today: 0 });
      }

      this.getActiveRentals((activeError, activeResult) => {
        if (activeError) {
          console.error('Get rental stats error (active):', activeError);
          return callback(null, { total: 0, active: 0, overdue: 0, today: 0 });
        }

        this.getOverdueCount((overdueError, overdueResult) => {
          if (overdueError) {
            console.error('Get rental stats error (overdue):', overdueError);
            return callback(null, { total: 0, active: 0, overdue: 0, today: 0 });
          }

          this.getTodayRentals((todayError, todayResult) => {
            if (todayError) {
              console.error('Get rental stats error (today):', todayError);
              return callback(null, { total: 0, active: 0, overdue: 0, today: 0 });
            }

            const stats = {
              total: totalResult.count || 0,
              active: activeResult.count || 0,
              overdue: overdueResult.count || 0,
              today: todayResult.count || 0
            };

            callback(null, stats);
          });
        });
      });
    });
  }

  // Get pending rentals
  getPendingRentals(callback) {
    this.rentalDAO.getPendingRentals((error, rentals) => {
      if (error) {
        console.error('Get pending rentals error:', error);
        return callback(null, {
          success: false,
          rentals: []
        });
      }

      callback(null, {
        success: true,
        rentals: rentals || []
      });
    });
  }

  // Get all rentals for staff interface
  getAllRentalsForStaff(callback) {
    this.rentalDAO.getAllRentalsWithDetails((error, rentals) => {
      if (error) {
        console.error('Get all rentals for staff error:', error);
        return callback(null, []);
      }
      callback(null, rentals || []);
    });
  }

  // Get active rentals for a specific customer
  getCustomerActiveRentals(customerId, callback) {
    this.rentalDAO.getCustomerActiveRentals(customerId, (error, rentals) => {
      if (error) {
        console.error('Get customer active rentals error:', error);
        return callback(null, []);
      }
      callback(null, rentals || []);
    });
  }

  // Get all rentals for a specific customer
  getCustomerAllRentals(customerId, callback) {
    this.rentalDAO.getCustomerAllRentals(customerId, (error, rentals) => {
      if (error) {
        console.error('Get customer all rentals error:', error);
        return callback(null, []);
      }
      callback(null, rentals || []);
    });
  }
}

module.exports = RentalService;