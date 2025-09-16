const BaseDAO = require('../dao/BaseDAO');

class RentalService extends BaseDAO {
  constructor() {
    super();
  }

  /**
   * Create new rental (customer rents a film)
   */
  async createRental(customerId, inventoryId, staffId = 1) {
    try {
      // First check if inventory item is available
      const availability = await this.query(`
        SELECT i.inventory_id, f.title, f.rental_rate, f.rental_duration,
               COUNT(r.rental_id) as active_rentals
        FROM inventory i
        JOIN film f ON i.film_id = f.film_id
        LEFT JOIN rental r ON i.inventory_id = r.inventory_id 
          AND r.return_date IS NULL 
          AND r.status IN ('paid', 'rented')
        WHERE i.inventory_id = ?
        GROUP BY i.inventory_id
      `, [inventoryId]);

      if (!availability.length) {
        throw new Error('Film inventory not found');
      }

      const item = availability[0];
      if (item.active_rentals > 0) {
        throw new Error('This copy is currently rented out');
      }

      // Create the rental with pending status
      const rentalDate = new Date();
      const amount = parseFloat(item.rental_rate);

      const result = await this.query(`
        INSERT INTO rental (rental_date, inventory_id, customer_id, staff_id, status, amount)
        VALUES (?, ?, ?, ?, 'pending', ?)
      `, [rentalDate, inventoryId, customerId, staffId, amount]);

      return {
        success: true,
        rental_id: result.insertId,
        film_title: item.title,
        amount: amount,
        status: 'pending',
        message: 'Rental created successfully. Please proceed to payment.'
      };

    } catch (error) {
      console.error('Create rental error:', error);
      throw error;
    }
  }

  /**
   * Get customer rentals with detailed information
   */
  async getCustomerRentals(customerId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Get rentals with film information
      const rentals = await this.query(`
        SELECT 
          r.rental_id,
          r.rental_date,
          r.return_date,
          r.due_date,
          r.status,
          r.amount,
          f.title as film_title,
          f.film_id,
          f.rental_rate,
          f.rental_duration,
          f.description,
          c.name as category,
          CASE 
            WHEN r.due_date IS NOT NULL THEN r.due_date
            WHEN r.return_date IS NULL AND r.status IN ('paid', 'rented') 
            THEN DATE_ADD(r.rental_date, INTERVAL f.rental_duration DAY)
            ELSE r.return_date
          END as expected_return_date,
          DATEDIFF(CURDATE(), COALESCE(r.due_date, DATE_ADD(r.rental_date, INTERVAL f.rental_duration DAY))) as days_overdue
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        JOIN film_category fc ON f.film_id = fc.film_id
        JOIN category c ON fc.category_id = c.category_id
        WHERE r.customer_id = ?
        ORDER BY r.rental_date DESC
        LIMIT ? OFFSET ?
      `, [customerId, limit, offset]);

      // Get total count for pagination
      const countResult = await this.query(`
        SELECT COUNT(*) as total
        FROM rental r
        WHERE r.customer_id = ?
      `, [customerId]);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      // Get rental statistics
      const stats = await this.query(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM rental
        WHERE customer_id = ?
        GROUP BY status
      `, [customerId]);

      // Get overall totals
      const overallStats = await this.query(`
        SELECT 
          COUNT(*) as total_rentals,
          SUM(amount) as total_spent,
          SUM(CASE WHEN status IN ('paid', 'rented') THEN amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN status = 'returned' THEN amount ELSE 0 END) as completed_amount
        FROM rental
        WHERE customer_id = ?
      `, [customerId]);

      const rentalStats = {
        pending: 0,
        paid: 0,
        rented: 0,
        returned: 0,
        total_spent: parseFloat(overallStats[0]?.total_spent || 0),
        total_rentals: overallStats[0]?.total_rentals || 0,
        paid_amount: parseFloat(overallStats[0]?.paid_amount || 0),
        completed_amount: parseFloat(overallStats[0]?.completed_amount || 0)
      };

      stats.forEach(stat => {
        rentalStats[stat.status] = stat.count;
      });

      return {
        success: true,
        rentals,
        stats: rentalStats,
        activeRentals: rentals.filter(r => ['pending', 'paid', 'rented'].includes(r.status)),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('Get customer rentals error:', error);
      throw error;
    }
  }

  /**
   * Get all rentals by customer (alias for getCustomerRentals for backward compatibility)
   */
  async getAllRentalsByCustomer(customerId, page = 1, limit = 10) {
    try {
      // This is just an alias for getCustomerRentals
      return await this.getCustomerRentals(customerId, page, limit);
    } catch (error) {
      console.error('Get all rentals by customer error:', error);
      throw error;
    }
  }

  /**
   * Update rental status (for staff)
   */
  async updateRentalStatus(rentalId, newStatus, staffId) {
    try {
      const validStatuses = ['pending', 'paid', 'rented', 'returned'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid status');
      }

      // If marking as returned, set return_date
      let query = 'UPDATE rental SET status = ?, staff_id = ? WHERE rental_id = ?';
      let params = [newStatus, staffId, rentalId];

      if (newStatus === 'returned') {
        query = 'UPDATE rental SET status = ?, return_date = NOW(), staff_id = ? WHERE rental_id = ?';
        params = [newStatus, staffId, rentalId];
      }

      const result = await this.query(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Rental not found');
      }

      return {
        success: true,
        message: `Rental status updated to ${newStatus}`
      };

    } catch (error) {
      console.error('Update rental status error:', error);
      throw error;
    }
  }

  /**
   * Get all rentals by customer ID (alias for getCustomerRentals for backward compatibility)
   */
  async getAllRentalsByCustomer(customerId, page = 1, limit = 10) {
    try {
      return await this.getCustomerRentals(customerId, page, limit);
    } catch (error) {
      console.error('Get all rentals by customer error:', error);
      throw error;
    }
  }

  /**
   * Get all rentals for staff management
   */
  async getAllRentals(page = 1, limit = 20, status = null) {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      let params = [];
      
      if (status) {
        whereClause = 'WHERE r.status = ?';
        params.push(status);
      }

      const rentals = await this.query(`
        SELECT 
          r.rental_id,
          r.rental_date,
          r.return_date,
          r.status,
          r.amount,
          f.title as film_title,
          f.film_id,
          c.name as category,
          cust.first_name,
          cust.last_name,
          cust.customer_id,
          cust.email,
          CASE 
            WHEN r.return_date IS NULL AND r.status IN ('paid', 'rented') 
            THEN DATE_ADD(r.rental_date, INTERVAL f.rental_duration DAY)
            ELSE r.return_date
          END as expected_return_date
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        JOIN film_category fc ON f.film_id = fc.film_id
        JOIN category c ON fc.category_id = c.category_id
        JOIN customer cust ON r.customer_id = cust.customer_id
        ${whereClause}
        ORDER BY r.rental_date DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM rental r ${whereClause}`;
      const countResult = await this.query(countQuery, params);
      const total = countResult[0].total;

      return {
        success: true,
        rentals,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      };

    } catch (error) {
      console.error('Get all rentals error:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending rental
   */
  async cancelRental(rentalId, customerId) {
    try {
      // First check if rental exists and is in pending status
      const rental = await this.query(`
        SELECT r.*, f.title as film_title 
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        WHERE r.rental_id = ? AND r.customer_id = ?
      `, [rentalId, customerId]);

      if (!rental.length) {
        throw new Error('Rental not found');
      }

      const rentalData = rental[0];

      // Only allow cancellation of pending rentals
      if (rentalData.status !== 'pending') {
        throw new Error('Only pending rentals can be cancelled');
      }

      // Delete the rental record (this automatically makes inventory available again)
      const result = await this.query(`
        DELETE FROM rental WHERE rental_id = ? AND customer_id = ? AND status = 'pending'
      `, [rentalId, customerId]);

      if (result.affectedRows === 0) {
        throw new Error('Failed to cancel rental');
      }

      return {
        success: true,
        message: `Rental voor "${rentalData.film_title}" is geannuleerd. De film is weer beschikbaar.`
      };

    } catch (error) {
      console.error('Cancel rental error:', error);
      throw error;
    }
  }

  /**
   * Get rental details
   */
  async getRentalDetails(rentalId) {
    try {
      const rental = await this.query(`
        SELECT 
          r.*,
          f.title as film_title,
          f.description,
          f.rental_rate,
          f.rental_duration,
          c.name as category,
          cust.first_name,
          cust.last_name,
          cust.email,
          cust.phone,
          staff.first_name as staff_first_name,
          staff.last_name as staff_last_name
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        JOIN film_category fc ON f.film_id = fc.film_id
        JOIN category c ON fc.category_id = c.category_id
        JOIN customer cust ON r.customer_id = cust.customer_id
        LEFT JOIN staff ON r.staff_id = staff.staff_id
        WHERE r.rental_id = ?
      `, [rentalId]);

      if (!rental.length) {
        throw new Error('Rental not found');
      }

      return {
        success: true,
        rental: rental[0]
      };

    } catch (error) {
      console.error('Get rental details error:', error);
      throw error;
    }
  }

  /**
   * Pay for a rental (change status from pending to paid)
   */
  async payRental(rentalId, customerId, amount) {
    try {
      // First verify the rental belongs to the customer and is pending
      const rental = await this.query(`
        SELECT r.*, f.title as film_title, f.rental_duration
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        WHERE r.rental_id = ? AND r.customer_id = ?
      `, [rentalId, customerId]);

      if (!rental.length) {
        return {
          success: false,
          message: 'Verhuur niet gevonden of hoort niet bij uw account'
        };
      }

      const rentalData = rental[0];

      // Check if payment is needed
      if (rentalData.status === 'paid' || rentalData.status === 'rented') {
        return {
          success: false,
          message: 'Deze verhuur is al betaald'
        };
      }

      if (rentalData.status !== 'pending') {
        return {
          success: false,
          message: 'Deze verhuur kan niet meer betaald worden'
        };
      }

      // Verify amount matches
      if (parseFloat(amount) !== parseFloat(rentalData.amount)) {
        return {
          success: false,
          message: 'Betalingsbedrag komt niet overeen'
        };
      }

      // Update rental status to paid and set due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + rentalData.rental_duration);

      await this.query(`
        UPDATE rental 
        SET status = 'paid', 
            due_date = ?,
            last_update = NOW()
        WHERE rental_id = ?
      `, [dueDate, rentalId]);

      return {
        success: true,
        message: `Betaling van €${amount} voor "${rentalData.film_title}" is gelukt`
      };

    } catch (error) {
      console.error('Pay rental error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij de betaling'
      };
    }
  }

  /**
   * Return a rental (change status from paid/rented to returned)
   */
  async returnRental(rentalId, customerId) {
    try {
      // First verify the rental belongs to the customer and can be returned
      const rental = await this.query(`
        SELECT r.*, f.title as film_title
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        WHERE r.rental_id = ? AND r.customer_id = ?
      `, [rentalId, customerId]);

      if (!rental.length) {
        return {
          success: false,
          message: 'Verhuur niet gevonden of hoort niet bij uw account'
        };
      }

      const rentalData = rental[0];

      // Check if rental can be returned
      if (rentalData.status === 'returned' || rentalData.status === 'completed') {
        return {
          success: false,
          message: 'Deze verhuur is al ingeleverd'
        };
      }

      if (rentalData.status !== 'paid' && rentalData.status !== 'rented') {
        return {
          success: false,
          message: 'Deze verhuur kan niet ingeleverd worden'
        };
      }

      // Update rental status to returned
      await this.query(`
        UPDATE rental 
        SET status = 'returned', 
            return_date = NOW(),
            last_update = NOW()
        WHERE rental_id = ?
      `, [rentalId]);

      return {
        success: true,
        message: `"${rentalData.film_title}" is succesvol ingeleverd`
      };

    } catch (error) {
      console.error('Return rental error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het inleveren'
      };
    }
  }

  /**
   * Extend a rental (add more days to due date)
   */
  async extendRental(rentalId, customerId, extraDays = 7) {
    try {
      // First verify the rental belongs to the customer and can be extended
      const rental = await this.query(`
        SELECT r.*, f.title as film_title, f.rental_rate
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        WHERE r.rental_id = ? AND r.customer_id = ?
      `, [rentalId, customerId]);

      if (!rental.length) {
        return {
          success: false,
          message: 'Verhuur niet gevonden of hoort niet bij uw account'
        };
      }

      const rentalData = rental[0];

      // Check if rental can be extended
      if (rentalData.status === 'returned' || rentalData.status === 'completed' || rentalData.status === 'cancelled') {
        return {
          success: false,
          message: 'Deze verhuur kan niet meer verlengd worden'
        };
      }

      if (rentalData.status !== 'paid' && rentalData.status !== 'rented') {
        return {
          success: false,
          message: 'Deze verhuur moet eerst betaald worden voordat het verlengd kan worden'
        };
      }

      // Calculate new due date
      const currentDueDate = new Date(rentalData.due_date);
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + extraDays);

      // Calculate extension fee (typically 50% of original rental rate per week)
      const extensionFee = (parseFloat(rentalData.rental_rate) * 0.5).toFixed(2);

      // Update rental with new due date and add extension fee to amount
      const newAmount = (parseFloat(rentalData.amount) + parseFloat(extensionFee)).toFixed(2);

      await this.query(`
        UPDATE rental 
        SET due_date = ?,
            amount = ?,
            last_update = NOW()
        WHERE rental_id = ?
      `, [newDueDate, newAmount, rentalId]);

      return {
        success: true,
        message: `Verhuur van "${rentalData.film_title}" is verlengd tot ${newDueDate.toLocaleDateString('nl-NL')}. Verlengingskosten: €${extensionFee}`
      };

    } catch (error) {
      console.error('Extend rental error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het verlengen'
      };
    }
  }
}

module.exports = RentalService;
