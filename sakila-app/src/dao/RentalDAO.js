const BaseDAO = require('./BaseDAO');

/**
 * Data Access Object for Rental operations
 * Handles all database CRUD operations for rentals
 */
class RentalDAO extends BaseDAO {
  constructor() {
    super();
  }

  /**
   * Create a new rental record in database
   */
  async create(rentalData) {
    try {
      const { rental_date, inventory_id, customer_id, staff_id, status, amount } = rentalData;
      
      const result = await this.query(`
        INSERT INTO rental (rental_date, inventory_id, customer_id, staff_id, status, amount)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [rental_date, inventory_id, customer_id, staff_id, status, amount]);

      return {
        success: true,
        rental_id: result.insertId
      };
    } catch (error) {
      console.error('RentalDAO create error:', error);
      throw error;
    }
  }

  /**
   * Get rental by ID
   */
  async findById(rentalId) {
    try {
      const rentals = await this.query(`
        SELECT 
          r.rental_id,
          r.rental_date,
          r.return_date,
          r.due_date,
          r.status,
          r.amount,
          r.customer_id,
          r.inventory_id,
          r.staff_id,
          f.film_id,
          f.title as film_title,
          f.rental_rate,
          f.rental_duration,
          f.description,
          c.name as category
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        JOIN film_category fc ON f.film_id = fc.film_id
        JOIN category c ON fc.category_id = c.category_id
        WHERE r.rental_id = ?
      `, [rentalId]);

      return rentals.length > 0 ? rentals[0] : null;
    } catch (error) {
      console.error('RentalDAO findById error:', error);
      throw error;
    }
  }

  /**
   * Get rentals by customer ID with pagination
   */
  async findByCustomerId(customerId, limit, offset) {
    try {
      const rentals = await this.query(`
        SELECT 
          r.rental_id,
          r.rental_date,
          r.return_date,
          r.due_date,
          COALESCE(r.status, 
            CASE 
              WHEN r.return_date IS NOT NULL THEN 'returned'
              WHEN r.amount IS NOT NULL AND r.amount > 0 THEN 'pending'
              ELSE 'pending'
            END
          ) as status,
          COALESCE(r.amount, 0) as amount,
          f.film_id,
          f.title as film_title,
          f.rental_rate,
          f.rental_duration,
          f.description,
          c.name as category,
          CASE 
            WHEN r.return_date IS NOT NULL THEN NULL
            WHEN r.due_date IS NOT NULL THEN r.due_date
            ELSE DATE_ADD(r.rental_date, INTERVAL f.rental_duration DAY)
          END as expected_return_date,
          CASE 
            WHEN r.return_date IS NOT NULL THEN 0
            WHEN r.due_date IS NOT NULL THEN DATEDIFF(NOW(), r.due_date)
            ELSE DATEDIFF(NOW(), DATE_ADD(r.rental_date, INTERVAL f.rental_duration DAY))
          END as days_overdue
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        JOIN film_category fc ON f.film_id = fc.film_id
        JOIN category c ON fc.category_id = c.category_id
        WHERE r.customer_id = ?
        ORDER BY r.rental_date DESC
        LIMIT ? OFFSET ?
      `, [customerId, limit, offset]);

      return rentals;
    } catch (error) {
      console.error('RentalDAO findByCustomerId error:', error);
      throw error;
    }
  }

  /**
   * Get total count of rentals for a customer
   */
  async countByCustomerId(customerId) {
    try {
      const result = await this.query(`
        SELECT COUNT(*) as total
        FROM rental r
        WHERE r.customer_id = ?
      `, [customerId]);

      return result[0].total;
    } catch (error) {
      console.error('RentalDAO countByCustomerId error:', error);
      throw error;
    }
  }

  /**
   * Get rental statistics by customer ID
   */
  async getStatsByCustomerId(customerId) {
    try {
      // Get status counts
      const statusStats = await this.query(`
        SELECT 
          COALESCE(status, 
            CASE 
              WHEN return_date IS NOT NULL THEN 'returned'
              WHEN amount IS NOT NULL AND amount > 0 THEN 'pending'
              ELSE 'pending'
            END
          ) as status,
          COUNT(*) as count,
          SUM(COALESCE(amount, 0)) as total_amount
        FROM rental
        WHERE customer_id = ?
        GROUP BY COALESCE(status, 
          CASE 
            WHEN return_date IS NOT NULL THEN 'returned'
            WHEN amount IS NOT NULL AND amount > 0 THEN 'pending'
            ELSE 'pending'
          END
        )
      `, [customerId]);

      // Get overall totals
      const overallStats = await this.query(`
        SELECT 
          COUNT(*) as total_rentals,
          SUM(COALESCE(amount, 0)) as total_spent,
          SUM(CASE WHEN COALESCE(status, 'pending') IN ('paid', 'rented') THEN COALESCE(amount, 0) ELSE 0 END) as paid_amount,
          SUM(CASE WHEN COALESCE(status, 
            CASE 
              WHEN return_date IS NOT NULL THEN 'returned'
              ELSE 'pending'
            END
          ) = 'returned' THEN COALESCE(amount, 0) ELSE 0 END) as completed_amount
        FROM rental
        WHERE customer_id = ?
      `, [customerId]);

      return {
        statusStats,
        overallStats: overallStats[0]
      };
    } catch (error) {
      console.error('RentalDAO getStatsByCustomerId error:', error);
      throw error;
    }
  }

  /**
   * Update rental status
   */
  async updateStatus(rentalId, status, staffId = null) {
    try {
      let query = 'UPDATE rental SET status = ? WHERE rental_id = ?';
      let params = [status, rentalId];

      if (staffId) {
        query = 'UPDATE rental SET status = ?, staff_id = ? WHERE rental_id = ?';
        params = [status, staffId, rentalId];
      }

      if (status === 'returned') {
        query = 'UPDATE rental SET status = ?, return_date = NOW(), staff_id = ? WHERE rental_id = ?';
        params = [status, staffId || 1, rentalId];
      }

      const result = await this.query(query, params);
      
      return {
        success: result.affectedRows > 0,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('RentalDAO updateStatus error:', error);
      throw error;
    }
  }

  /**
   * Delete rental (for cancellation)
   */
  async delete(rentalId) {
    try {
      const result = await this.query(
        'DELETE FROM rental WHERE rental_id = ?',
        [rentalId]
      );

      return {
        success: result.affectedRows > 0,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('RentalDAO delete error:', error);
      throw error;
    }
  }

  /**
   * Check if inventory item is available for rental
   */
  async checkInventoryAvailability(inventoryId) {
    try {
      const result = await this.query(`
        SELECT 
          i.inventory_id, 
          f.title, 
          f.rental_rate, 
          f.rental_duration,
          COUNT(r.rental_id) as active_rentals
        FROM inventory i
        JOIN film f ON i.film_id = f.film_id
        LEFT JOIN rental r ON i.inventory_id = r.inventory_id 
          AND r.return_date IS NULL 
          AND r.status IN ('paid', 'rented')
        WHERE i.inventory_id = ?
        GROUP BY i.inventory_id
      `, [inventoryId]);

      if (result.length === 0) {
        return { available: false, reason: 'Inventory not found' };
      }

      const item = result[0];
      return {
        available: item.active_rentals === 0,
        reason: item.active_rentals > 0 ? 'Currently rented out' : null,
        item
      };
    } catch (error) {
      console.error('RentalDAO checkInventoryAvailability error:', error);
      throw error;
    }
  }
}

module.exports = RentalDAO;
