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
   * Update rental due date
   */
  async updateDueDate(rentalId, newDueDate, staffId) {
    try {
      const query = 'UPDATE rental SET due_date = ?, staff_id = ?, last_update = NOW() WHERE rental_id = ?';
      const params = [newDueDate, staffId || 1, rentalId];

      const result = await this.query(query, params);
      
      return {
        success: result.affectedRows > 0,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('RentalDAO updateDueDate error:', error);
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

  /**
   * Staff specific methods voor verhuur beheer
   */

  // Haal recente verhuur op
  async getRecentRentals(limit = 10) {
    try {
      const rentals = await this.query(`
        SELECT 
          r.rental_id,
          r.rental_date,
          r.return_date,
          r.status,
          r.amount,
          CONCAT(c.first_name, ' ', c.last_name) as customer_name,
          c.email as customer_email,
          f.title as film_title,
          f.film_id,
          CONCAT(s.first_name, ' ', s.last_name) as staff_name
        FROM rental r
        JOIN customer c ON r.customer_id = c.customer_id
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        LEFT JOIN staff s ON r.staff_id = s.staff_id
        ORDER BY r.rental_date DESC
        LIMIT ?
      `, [limit]);
      
      return rentals;
    } catch (error) {
      console.error('RentalDAO getRecentRentals error:', error);
      throw error;
    }
  }

  // Haal achterstallige verhuur op
  async getOverdueRentals() {
    try {
      const rentals = await this.query(`
        SELECT 
          r.rental_id,
          r.rental_date,
          r.due_date,
          r.status,
          r.amount,
          CONCAT(c.first_name, ' ', c.last_name) as customer_name,
          c.email as customer_email,
          c.customer_id,
          f.title as film_title,
          f.film_id,
          DATEDIFF(CURDATE(), r.due_date) as days_overdue
        FROM rental r
        JOIN customer c ON r.customer_id = c.customer_id
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        WHERE r.return_date IS NULL 
          AND r.due_date < CURDATE()
          AND r.status IN ('rented', 'paid')
        ORDER BY r.due_date ASC
      `);
      
      return rentals;
    } catch (error) {
      console.error('RentalDAO getOverdueRentals error:', error);
      throw error;
    }
  }

  // Zoek beschikbare inventory voor film
  async findAvailableInventory(filmId) {
    try {
      const inventory = await this.query(`
        SELECT i.inventory_id, i.film_id, f.title, f.rental_rate
        FROM inventory i
        JOIN film f ON i.film_id = f.film_id
        LEFT JOIN rental r ON i.inventory_id = r.inventory_id 
          AND r.return_date IS NULL
        WHERE i.film_id = ? 
          AND r.rental_id IS NULL
        LIMIT 1
      `, [filmId]);
      
      return inventory.length > 0 ? inventory[0] : null;
    } catch (error) {
      console.error('RentalDAO findAvailableInventory error:', error);
      throw error;
    }
  }

  // Film teruggeven
  async returnRental(rentalId, staffId) {
    try {
      const returnDate = new Date();
      
      const result = await this.query(`
        UPDATE rental 
        SET return_date = ?, 
            last_update = NOW()
        WHERE rental_id = ? 
          AND return_date IS NULL
      `, [returnDate, rentalId]);

      if (result.affectedRows === 0) {
        return {
          success: false,
          message: 'Verhuur niet gevonden of al teruggegeven'
        };
      }

      // Haal bijgewerkte verhuur op
      const rental = await this.findById(rentalId);
      
      return {
        success: true,
        rental,
        message: 'Film succesvol teruggegeven'
      };
    } catch (error) {
      console.error('RentalDAO returnRental error:', error);
      throw error;
    }
  }

  // Update verhuur status
  async updateStatus(rentalId, status, staffId = null) {
    try {
      let query, params;
      
      if (staffId) {
        query = `
          UPDATE rental 
          SET status = ?, staff_id = ?, last_update = NOW()
          WHERE rental_id = ?
        `;
        params = [status, staffId, rentalId];
      } else {
        query = `
          UPDATE rental 
          SET status = ?, last_update = NOW()
          WHERE rental_id = ?
        `;
        params = [status, rentalId];
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

  // Statistiek methoden
  async getTotalCount() {
    try {
      const result = await this.query('SELECT COUNT(*) as count FROM rental');
      return result[0].count;
    } catch (error) {
      console.error('RentalDAO getTotalCount error:', error);
      return 0;
    }
  }

  async getActiveCount() {
    try {
      const result = await this.query(`
        SELECT COUNT(*) as count 
        FROM rental 
        WHERE return_date IS NULL
      `);
      return result[0].count;
    } catch (error) {
      console.error('RentalDAO getActiveCount error:', error);
      return 0;
    }
  }

  async getOverdueCount() {
    try {
      const result = await this.query(`
        SELECT COUNT(*) as count 
        FROM rental 
        WHERE return_date IS NULL 
          AND due_date < CURDATE()
          AND status IN ('rented', 'paid')
      `);
      return result[0].count;
    } catch (error) {
      console.error('RentalDAO getOverdueCount error:', error);
      return 0;
    }
  }

  async getTodayCount() {
    try {
      const result = await this.query(`
        SELECT COUNT(*) as count 
        FROM rental 
        WHERE DATE(rental_date) = CURDATE()
      `);
      return result[0].count;
    } catch (error) {
      console.error('RentalDAO getTodayCount error:', error);
      return 0;
    }
  }

  // Get pending rentals (in behandeling/gereserveerd)
  async getPendingRentals() {
    try {
      const rentals = await this.query(`
        SELECT 
          r.rental_id,
          r.rental_date,
          r.return_date,
          r.due_date,
          r.status,
          r.amount,
          CONCAT(c.first_name, ' ', c.last_name) as customer_name,
          c.email as customer_email,
          f.title as film_title,
          cat.name as category_name,
          DATE_ADD(r.rental_date, INTERVAL 3 DAY) as expected_return
        FROM rental r
        INNER JOIN customer c ON r.customer_id = c.customer_id
        INNER JOIN inventory i ON r.inventory_id = i.inventory_id
        INNER JOIN film f ON i.film_id = f.film_id
        INNER JOIN film_category fc ON f.film_id = fc.film_id
        INNER JOIN category cat ON fc.category_id = cat.category_id
        WHERE r.status IN ('pending', 'reserved', 'in_behandeling')
        ORDER BY r.rental_date DESC
        LIMIT 50
      `);
      return rentals;
    } catch (error) {
      console.error('RentalDAO getPendingRentals error:', error);
      return [];
    }
  }

  // Get all rentals with customer and film details for staff interface
  async getAllRentalsWithDetails() {
    try {
      const rentals = await this.query(`
        SELECT 
          r.rental_id,
          r.rental_date,
          r.return_date,
          r.status,
          CONCAT(c.first_name, ' ', c.last_name) as customer_name,
          c.customer_id,
          f.title as film_title,
          f.film_id,
          CASE 
            WHEN r.return_date IS NOT NULL THEN 'returned'
            WHEN DATE_ADD(r.rental_date, INTERVAL 3 DAY) < NOW() AND r.return_date IS NULL THEN 'overdue'
            ELSE 'active'
          END as current_status
        FROM rental r
        INNER JOIN customer c ON r.customer_id = c.customer_id
        INNER JOIN inventory i ON r.inventory_id = i.inventory_id
        INNER JOIN film f ON i.film_id = f.film_id
        ORDER BY r.rental_date DESC
        LIMIT 200
      `);
      return rentals;
    } catch (error) {
      console.error('RentalDAO getAllRentalsWithDetails error:', error);
      return [];
    }
  }

  // Get active rentals for a specific customer
  async getCustomerActiveRentals(customerId) {
    try {
      const rentals = await this.query(`
        SELECT 
          r.rental_id,
          r.rental_date,
          r.return_date,
          f.title,
          f.film_id,
          f.rental_rate,
          i.inventory_id,
          CASE 
            WHEN r.return_date IS NOT NULL THEN 1
            ELSE 0
          END as returned,
          CASE 
            WHEN r.return_date IS NOT NULL THEN 'returned'
            WHEN DATE_ADD(r.rental_date, INTERVAL 3 DAY) < NOW() AND r.return_date IS NULL THEN 'overdue'
            ELSE 'active'
          END as current_status,
          DATEDIFF(DATE_ADD(r.rental_date, INTERVAL 3 DAY), NOW()) as days_until_due
        FROM rental r
        INNER JOIN inventory i ON r.inventory_id = i.inventory_id
        INNER JOIN film f ON i.film_id = f.film_id
        WHERE r.customer_id = ? AND r.return_date IS NULL
        ORDER BY r.rental_date DESC
        LIMIT 20
      `, [customerId]);
      return rentals;
    } catch (error) {
      console.error('RentalDAO getCustomerActiveRentals error:', error);
      return [];
    }
  }

  // Get all rentals for a specific customer (both active and returned)
  async getCustomerAllRentals(customerId) {
    try {
      console.log('RentalDAO: Getting all rentals for customer', customerId);
      
      const rentals = await this.query(`
        SELECT 
          r.rental_id,
          r.rental_date,
          r.return_date,
          r.status,
          f.title,
          f.film_id,
          f.rental_rate,
          i.inventory_id,
          CASE 
            WHEN r.return_date IS NOT NULL THEN 1
            ELSE 0
          END as returned,
          CASE 
            WHEN r.return_date IS NOT NULL THEN 'returned'
            WHEN DATE_ADD(r.rental_date, INTERVAL 3 DAY) < NOW() AND r.return_date IS NULL THEN 'overdue'
            ELSE 'active'
          END as current_status,
          DATEDIFF(DATE_ADD(r.rental_date, INTERVAL 3 DAY), NOW()) as days_until_due
        FROM rental r
        INNER JOIN inventory i ON r.inventory_id = i.inventory_id
        INNER JOIN film f ON i.film_id = f.film_id
        WHERE r.customer_id = ?
        ORDER BY r.rental_date DESC
        LIMIT 50
      `, [customerId]);
      
      console.log('RentalDAO: Found', rentals ? rentals.length : 0, 'rentals for customer', customerId);
      return rentals;
    } catch (error) {
      console.error('RentalDAO getCustomerAllRentals error:', error);
      return [];
    }
  }
}

module.exports = RentalDAO;
