const BaseDAO = require('./BaseDAO');

/**
 * DAO for owner/admin operations
 */
class OwnerDAO extends BaseDAO {
  constructor() {
    super('owners', 'owner_id');
  }

  /**
   * Get dashboard statistics for owners
   */
  async getDashboardStats() {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM customer WHERE active = 1) as total_customers,
        (SELECT COUNT(*) FROM staff WHERE active = 1) as total_staff,
        (SELECT COUNT(*) FROM film) as total_films,
        (SELECT COUNT(*) FROM store) as total_stores,
        (SELECT COUNT(*) FROM rental WHERE return_date IS NULL) as active_rentals,
        (SELECT COALESCE(SUM(amount), 0) FROM payment WHERE payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as revenue_30_days
    `;

    const results = await this.query(sql);
    return results[0];
  }

  /**
   * Get all staff with store assignments
   */
  async getStaffWithStoreAssignments() {
    const sql = `
      SELECT 
        s.staff_id,
        s.first_name,
        s.last_name,
        s.email,
        s.username,
        s.active,
        s.store_id,
        st.store_id as assigned_store,
        a.address as staff_address,
        a.phone as staff_phone,
        ss.assigned_at,
        ss.active as assignment_active
      FROM staff s
      LEFT JOIN address a ON s.address_id = a.address_id
      LEFT JOIN store st ON s.store_id = st.store_id
      LEFT JOIN store_staff ss ON s.staff_id = ss.staff_id
      ORDER BY s.last_name, s.first_name
    `;

    return await this.query(sql);
  }

  /**
   * Get staff member with assignments
   */
  async getStaffWithAssignments(staffId) {
    const sql = `
      SELECT 
        s.*,
        a.address,
        a.district,
        a.phone,
        ci.city,
        co.country,
        GROUP_CONCAT(DISTINCT st.store_id) as assigned_stores
      FROM staff s
      LEFT JOIN address a ON s.address_id = a.address_id
      LEFT JOIN city ci ON a.city_id = ci.city_id
      LEFT JOIN country co ON ci.country_id = co.country_id
      LEFT JOIN store_staff ss ON s.staff_id = ss.staff_id AND ss.active = 1
      LEFT JOIN store st ON ss.store_id = st.store_id
      WHERE s.staff_id = ?
      GROUP BY s.staff_id, s.first_name, s.last_name, s.email, s.username, 
               s.active, a.address, a.district, a.phone, ci.city, co.country
    `;

    const results = await this.query(sql, [staffId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create new staff member
   */
  async createStaff(staffData) {
    const connection = await this.db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Create address first (using default address for simplicity)
      const addressSql = `
        INSERT INTO address (address, district, city_id, phone, location)
        VALUES (?, ?, ?, ?, POINT(0, 0))
      `;
      
      const [addressResult] = await connection.execute(addressSql, [
        'Staff Address',
        'Staff District',
        1, // Default city
        staffData.phone || '000-000-0000'
      ]);

      const addressId = addressResult.insertId;

      // Create staff member
      const staffSql = `
        INSERT INTO staff (first_name, last_name, email, username, password, address_id, store_id, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [staffResult] = await connection.execute(staffSql, [
        staffData.firstName,
        staffData.lastName,
        staffData.email,
        staffData.username,
        staffData.password,
        addressId,
        staffData.storeId,
        staffData.active
      ]);

      await connection.commit();
      
      return {
        insertId: staffResult.insertId,
        addressId: addressId,
        affectedRows: staffResult.affectedRows
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update staff member
   */
  async updateStaff(staffId, staffData) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(staffData)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('last_update = NOW()');
    values.push(staffId);

    const sql = `
      UPDATE staff 
      SET ${fields.join(', ')}
      WHERE staff_id = ?
    `;

    return await this.query(sql, values);
  }

  /**
   * Assign staff to store
   */
  async assignStaffToStore(staffId, storeId, assignedBy) {
    const sql = `
      INSERT INTO store_staff (store_id, staff_id, assigned_by, assigned_at, active)
      VALUES (?, ?, ?, NOW(), 1)
      ON DUPLICATE KEY UPDATE active = 1, assigned_at = NOW()
    `;

    return await this.query(sql, [storeId, staffId, assignedBy]);
  }

  /**
   * Remove staff from store
   */
  async removeStaffFromStore(staffId, storeId) {
    const sql = `
      UPDATE store_staff 
      SET active = 0 
      WHERE staff_id = ? AND store_id = ?
    `;

    return await this.query(sql, [staffId, storeId]);
  }

  /**
   * Get all stores
   */
  async getAllStores() {
    const sql = `
      SELECT 
        s.*,
        a.address,
        a.district,
        a.phone,
        ci.city,
        co.country,
        CONCAT(staff.first_name, ' ', staff.last_name) as manager_name
      FROM store s
      LEFT JOIN address a ON s.address_id = a.address_id
      LEFT JOIN city ci ON a.city_id = ci.city_id
      LEFT JOIN country co ON ci.country_id = co.country_id
      LEFT JOIN staff ON s.manager_staff_id = staff.staff_id
      ORDER BY s.store_id
    `;

    return await this.query(sql);
  }

  /**
   * Get store staff assignments
   */
  async getStoreStaffAssignments(storeId) {
    const sql = `
      SELECT 
        ss.*,
        s.first_name,
        s.last_name,
        s.email,
        s.active as staff_active,
        CONCAT(o.first_name, ' ', o.last_name) as assigned_by_name
      FROM store_staff ss
      JOIN staff s ON ss.staff_id = s.staff_id
      LEFT JOIN owners o ON ss.assigned_by = o.owner_id
      WHERE ss.store_id = ? AND ss.active = 1
      ORDER BY ss.assigned_at DESC
    `;

    return await this.query(sql, [storeId]);
  }

  /**
   * Get rental statistics
   */
  async getRentalStats(days = 30) {
    const sql = `
      SELECT 
        DATE(r.rental_date) as rental_date,
        COUNT(*) as daily_rentals,
        COALESCE(SUM(p.amount), 0) as daily_revenue
      FROM rental r
      LEFT JOIN payment p ON r.rental_id = p.rental_id
      WHERE r.rental_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(r.rental_date)
      ORDER BY rental_date DESC
    `;

    return await this.query(sql, [days]);
  }

  /**
   * Get top performing films
   */
  async getTopFilms(limit = 10) {
    const sql = `
      SELECT 
        f.film_id,
        f.title,
        f.rating,
        f.rental_rate,
        COUNT(r.rental_id) as rental_count,
        COALESCE(SUM(p.amount), 0) as total_revenue
      FROM film f
      LEFT JOIN inventory i ON f.film_id = i.film_id
      LEFT JOIN rental r ON i.inventory_id = r.inventory_id
      LEFT JOIN payment p ON r.rental_id = p.rental_id
      GROUP BY f.film_id, f.title, f.rating, f.rental_rate
      ORDER BY rental_count DESC, total_revenue DESC
      LIMIT ?
    `;

    return await this.query(sql, [limit]);
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary() {
    const sql = `
      SELECT 
        s.store_id,
        COUNT(DISTINCT i.film_id) as unique_films,
        COUNT(i.inventory_id) as total_copies,
        COUNT(CASE WHEN r.rental_id IS NOT NULL AND r.return_date IS NULL 
              THEN i.inventory_id END) as rented_copies,
        COUNT(CASE WHEN r.rental_id IS NULL OR r.return_date IS NOT NULL 
              THEN i.inventory_id END) as available_copies
      FROM store s
      LEFT JOIN inventory i ON s.store_id = i.store_id
      LEFT JOIN rental r ON i.inventory_id = r.inventory_id AND r.return_date IS NULL
      GROUP BY s.store_id
      ORDER BY s.store_id
    `;

    return await this.query(sql);
  }
}

module.exports = OwnerDAO;