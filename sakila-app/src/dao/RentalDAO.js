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
  create(rentalData, callback) {
    const { rental_date, inventory_id, customer_id, staff_id, status, amount } = rentalData;
    
    this.query(`
      INSERT INTO rental (rental_date, inventory_id, customer_id, staff_id, status, amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [rental_date, inventory_id, customer_id, staff_id, status, amount], (error, result) => {
      if (error) {
        console.error('RentalDAO create error:', error);
        return callback(error);
      }

      callback(null, {
        success: true,
        rental_id: result.insertId
      });
    });
  }

  /**
   * Get rental by ID
   */
  findById(rentalId, callback) {
    this.query(`
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
    `, [rentalId], (error, rentals) => {
      if (error) {
        console.error('RentalDAO findById error:', error);
        return callback(error);
      }

      callback(null, rentals.length > 0 ? rentals[0] : null);
    });
  }

  /**
   * Get rentals by customer ID with pagination
   */
  findByCustomerId(customerId, limit, offset, callback) {
    // Handle optional parameters
    if (typeof limit === 'function') {
      callback = limit;
      limit = 20;
      offset = 0;
    } else if (typeof offset === 'function') {
      callback = offset;
      offset = 0;
    }
    
    this.query(`
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
    `, [customerId, limit, offset], (error, rentals) => {
      if (error) {
        console.error('RentalDAO findByCustomerId error:', error);
        return callback(error);
      }
      callback(null, rentals);
    });
  }

  /**
   * Get total count of rentals for a customer
   */
  countByCustomerId(customerId, callback) {
    this.query(`
      SELECT COUNT(*) as total
      FROM rental r
      WHERE r.customer_id = ?
    `, [customerId], (error, result) => {
      if (error) {
        console.error('RentalDAO countByCustomerId error:', error);
        return callback(error);
      }
      callback(null, result[0].total);
    });
  }

  /**
   * Get rental statistics by customer ID
   */
  getStatsByCustomerId(customerId, callback) {
    // Get status counts first
    this.query(`
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
    `, [customerId], (error, statusStats) => {
      if (error) {
        console.error('RentalDAO getStatsByCustomerId error:', error);
        return callback(error);
      }
      
      // Get overall totals
      this.query(`
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
      `, [customerId], (error, overallStats) => {
        if (error) {
          console.error('RentalDAO getStatsByCustomerId error:', error);
          return callback(error);
        }
        
        callback(null, {
          statusStats,
          overallStats: overallStats[0]
        });
      });
    });
  }

  /**
   * Update rental status
   */
  updateStatus(rentalId, status, staffId = null, callback) {
    // Handle optional staffId parameter
    if (typeof staffId === 'function') {
      callback = staffId;
      staffId = null;
    }
    
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

    this.query(query, params, (error, result) => {
      if (error) {
        console.error('RentalDAO updateStatus error:', error);
        return callback(error);
      }
      
      callback(null, {
        success: result.affectedRows > 0,
        affectedRows: result.affectedRows
      });
    });
  }

  /**
   * Update rental due date
   */
  updateDueDate(rentalId, newDueDate, staffId, callback) {
    const query = 'UPDATE rental SET due_date = ?, staff_id = ?, last_update = NOW() WHERE rental_id = ?';
    const params = [newDueDate, staffId || 1, rentalId];

    this.query(query, params, (error, result) => {
      if (error) {
        console.error('RentalDAO updateDueDate error:', error);
        return callback(error);
      }
      
      callback(null, {
        success: result.affectedRows > 0,
        affectedRows: result.affectedRows
      });
    });
  }

  /**
   * Delete rental (for cancellation)
   */
  delete(rentalId, callback) {
    this.query(
      'DELETE FROM rental WHERE rental_id = ?',
      [rentalId],
      (error, result) => {
        if (error) {
          console.error('RentalDAO delete error:', error);
          return callback(error);
        }

        callback(null, {
          success: result.affectedRows > 0,
          affectedRows: result.affectedRows
        });
      }
    );
  }

  /**
   * Check if inventory item is available for rental
   */
  checkInventoryAvailability(inventoryId, callback) {
    this.query(`
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
    `, [inventoryId], (error, result) => {
      if (error) {
        console.error('RentalDAO checkInventoryAvailability error:', error);
        return callback(error);
      }

      if (result.length === 0) {
        return callback(null, { available: false, reason: 'Inventory not found' });
      }

      const item = result[0];
      callback(null, {
        available: item.active_rentals === 0,
        reason: item.active_rentals > 0 ? 'Currently rented out' : null,
        item
      });
    });
  }

  /**
   * Staff specific methods voor verhuur beheer
   */

  // Haal recente verhuur op
  getRecentRentals(limit = 10, callback) {
    this.query(`
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
    `, [limit], (error, rentals) => {
      if (error) {
        console.error('RentalDAO getRecentRentals error:', error);
        return callback(error);
      }
      callback(null, rentals);
    });
  }

  // Haal achterstallige verhuur op
  getOverdueRentals(callback) {
    this.query(`
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
    `, [], (error, rentals) => {
      if (error) {
        console.error('RentalDAO getOverdueRentals error:', error);
        return callback(error);
      }
      callback(null, rentals);
    });
  }

  // Zoek beschikbare inventory voor film
  findAvailableInventory(filmId, callback) {
    this.query(`
      SELECT i.inventory_id, i.film_id, f.title, f.rental_rate
      FROM inventory i
      JOIN film f ON i.film_id = f.film_id
      LEFT JOIN rental r ON i.inventory_id = r.inventory_id 
        AND r.return_date IS NULL
      WHERE i.film_id = ? 
        AND r.rental_id IS NULL
      LIMIT 1
    `, [filmId], (error, inventory) => {
      if (error) {
        console.error('RentalDAO findAvailableInventory error:', error);
        return callback(error);
      }
      callback(null, inventory.length > 0 ? inventory[0] : null);
    });
  }

  // Film teruggeven
  returnRental(rentalId, staffId, callback) {
    const returnDate = new Date();
    
    this.query(`
      UPDATE rental 
      SET return_date = ?, 
          last_update = NOW()
      WHERE rental_id = ? 
        AND return_date IS NULL
    `, [returnDate, rentalId], (error, result) => {
      if (error) {
        console.error('RentalDAO returnRental error:', error);
        return callback(error);
      }

      if (result.affectedRows === 0) {
        return callback(null, {
          success: false,
          message: 'Verhuur niet gevonden of al teruggegeven'
        });
      }

      // Haal bijgewerkte verhuur op
      this.findById(rentalId, (error, rental) => {
        if (error) {
          console.error('RentalDAO returnRental error:', error);
          return callback(error);
        }
        
        callback(null, {
          success: true,
          rental,
          message: 'Film succesvol teruggegeven'
        });
      });
    });
  }

  // Update verhuur status
  updateStatus(rentalId, status, staffId = null, callback) {
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

    this.query(query, params, (error, result) => {
      if (error) {
        console.error('RentalDAO updateStatus error:', error);
        return callback(error);
      }

      callback(null, {
        success: result.affectedRows > 0,
        affectedRows: result.affectedRows
      });
    });
  }

  // Statistiek methoden
  getTotalCount(callback) {
    this.query('SELECT COUNT(*) as count FROM rental', [], (error, result) => {
      if (error) {
        console.error('RentalDAO getTotalCount error:', error);
        return callback(null, { count: 0 });
      }
      callback(null, { count: result[0].count });
    });
  }

  getActiveCount(callback) {
    this.query(`
      SELECT COUNT(*) as count 
      FROM rental 
      WHERE return_date IS NULL
    `, [], (error, result) => {
      if (error) {
        console.error('RentalDAO getActiveCount error:', error);
        return callback(null, { count: 0 });
      }
      callback(null, { count: result[0].count });
    });
  }

  getOverdueCount(callback) {
    this.query(`
      SELECT COUNT(*) as count 
      FROM rental 
      WHERE return_date IS NULL 
        AND due_date < CURDATE()
        AND status IN ('rented', 'paid')
    `, [], (error, result) => {
      if (error) {
        console.error('RentalDAO getOverdueCount error:', error);
        return callback(null, { count: 0 });
      }
      callback(null, { count: result[0].count });
    });
  }

  getTodayCount(callback) {
    this.query(`
      SELECT COUNT(*) as count 
      FROM rental 
      WHERE DATE(rental_date) = CURDATE()
    `, [], (error, result) => {
      if (error) {
        console.error('RentalDAO getTodayCount error:', error);
        return callback(null, { count: 0 });
      }
      callback(null, { count: result[0].count });
    });
  }

  // Get pending rentals (in behandeling/gereserveerd)
  getPendingRentals(callback) {
    this.query(`
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
    `, [], (error, rentals) => {
      if (error) {
        console.error('RentalDAO getPendingRentals error:', error);
        return callback(null, []);
      }
      callback(null, rentals);
    });
  }

  // Get all rentals with customer and film details for staff interface
  getAllRentalsWithDetails(callback) {
    this.query(`
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
    `, [], (error, rentals) => {
      if (error) {
        console.error('RentalDAO getAllRentalsWithDetails error:', error);
        return callback(null, []);
      }
      callback(null, rentals);
    });
  }

  // Get active rentals for a specific customer
  getCustomerActiveRentals(customerId, callback) {
    this.query(`
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
    `, [customerId], (error, rentals) => {
      if (error) {
        console.error('RentalDAO getCustomerActiveRentals error:', error);
        return callback(error);
      }
      callback(null, rentals);
    });
  }  // Get all rentals for a specific customer (both active and returned)
  getCustomerAllRentals(customerId, callback) {
    console.log('RentalDAO: Getting all rentals for customer', customerId);
    
    this.query(`
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
    `, [customerId], (error, rentals) => {
      if (error) {
        console.error('RentalDAO getCustomerAllRentals error:', error);
        return callback(null, []);
      }
      
      console.log('RentalDAO: Found', rentals ? rentals.length : 0, 'rentals for customer', customerId);
      callback(null, rentals);
    });
  }
}module.exports = RentalDAO;
