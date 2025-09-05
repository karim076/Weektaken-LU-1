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
          r.status,
          r.amount,
          f.title as film_title,
          f.film_id,
          c.name as category,
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
          COUNT(*) as count
        FROM rental
        WHERE customer_id = ?
        GROUP BY status
      `, [customerId]);

      const rentalStats = {
        pending: 0,
        paid: 0,
        rented: 0,
        returned: 0
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
}

module.exports = RentalService;
