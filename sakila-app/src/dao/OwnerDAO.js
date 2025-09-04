const BaseDAO = require('./BaseDAO');

/**
 * DAO for owner operations
 */
class OwnerDAO extends BaseDAO {
  constructor() {
    super('owners', 'owner_id');
  }

  /**
   * Get all staff members with store assignments
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
        s.store_id as primary_store_id,
        GROUP_CONCAT(ss.store_id ORDER BY ss.store_id) as assigned_stores
      FROM staff s
      LEFT JOIN store_staff ss ON s.staff_id = ss.staff_id AND ss.active = 1
      GROUP BY s.staff_id
      ORDER BY s.last_name, s.first_name
    `;

    return await this.query(sql);
  }

  /**
   * Get staff member by ID with store assignments
   */
  async getStaffWithAssignments(staffId) {
    const sql = `
      SELECT 
        s.*,
        GROUP_CONCAT(ss.store_id ORDER BY ss.store_id) as assigned_stores
      FROM staff s
      LEFT JOIN store_staff ss ON s.staff_id = ss.staff_id AND ss.active = 1
      WHERE s.staff_id = ?
      GROUP BY s.staff_id
    `;

    const results = await this.query(sql, [staffId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create new staff member
   */
  async createStaff(staffData) {
    const sql = `
      INSERT INTO staff (first_name, last_name, email, username, password, store_id, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    return await this.query(sql, [
      staffData.firstName,
      staffData.lastName,
      staffData.email,
      staffData.username,
      staffData.password,
      staffData.storeId,
      staffData.active ?? true
    ]);
  }

  /**
   * Update staff member
   */
  async updateStaff(staffId, staffData) {
    const fields = [];
    const values = [];

    if (staffData.firstName) {
      fields.push('first_name = ?');
      values.push(staffData.firstName);
    }
    if (staffData.lastName) {
      fields.push('last_name = ?');
      values.push(staffData.lastName);
    }
    if (staffData.email) {
      fields.push('email = ?');
      values.push(staffData.email);
    }
    if (staffData.username) {
      fields.push('username = ?');
      values.push(staffData.username);
    }
    if (staffData.password) {
      fields.push('password = ?');
      values.push(staffData.password);
    }
    if (staffData.storeId) {
      fields.push('store_id = ?');
      values.push(staffData.storeId);
    }
    if (staffData.active !== undefined) {
      fields.push('active = ?');
      values.push(staffData.active);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(staffId);
    const sql = `UPDATE staff SET ${fields.join(', ')} WHERE staff_id = ?`;
    
    return await this.query(sql, values);
  }

  /**
   * Assign staff to store
   */
  async assignStaffToStore(staffId, storeId, assignedBy) {
    const sql = `
      INSERT INTO store_staff (store_id, staff_id, assigned_by, active)
      VALUES (?, ?, ?, 1)
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
        s.store_id,
        s.manager_staff_id,
        CONCAT(st.first_name, ' ', st.last_name) as manager_name,
        a.address,
        c.city,
        co.country
      FROM store s
      LEFT JOIN staff st ON s.manager_staff_id = st.staff_id
      LEFT JOIN address a ON s.address_id = a.address_id
      LEFT JOIN city c ON a.city_id = c.city_id
      LEFT JOIN country co ON c.country_id = co.country_id
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
   * Get dashboard statistics for owner
   */
  async getDashboardStats() {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM staff WHERE active = 1) as total_staff,
        (SELECT COUNT(*) FROM store) as total_stores,
        (SELECT COUNT(*) FROM customer WHERE active = 1) as total_customers,
        (SELECT COUNT(*) FROM rental WHERE return_date IS NULL) as active_rentals,
        (SELECT SUM(amount) FROM payment WHERE payment_date >= CURDATE()) as today_revenue
    `;

    const result = await this.query(sql);
    return result[0];
  }
}

module.exports = OwnerDAO;
