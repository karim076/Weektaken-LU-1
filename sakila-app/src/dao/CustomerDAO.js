const BaseDAO = require('./BaseDAO');

/**
 * DAO for customer operations
 */
class CustomerDAO extends BaseDAO {
  constructor() {
    super('customer', 'customer_id');
  }

  /**
   * Create new customer with address
   */
  async createCustomerWithAddress(customerData, addressData) {
    const connection = await this.db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Create address first
      const addressSql = `
        INSERT INTO address (address, district, city_id, phone, location)
        VALUES (?, ?, ?, ?, POINT(0, 0))
      `;
      
      const [addressResult] = await connection.execute(addressSql, [
        addressData.address || 'Customer Address',
        addressData.district || 'District',
        addressData.cityId || 1,
        addressData.phone || '000-000-0000'
      ]);

      const addressId = addressResult.insertId;

      // Create customer
      const customerSql = `
        INSERT INTO customer (store_id, first_name, last_name, email, username, password, address_id, create_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [customerResult] = await connection.execute(customerSql, [
        customerData.storeId || 1,
        customerData.firstName,
        customerData.lastName,
        customerData.email,
        customerData.username,
        customerData.password,
        addressId
      ]);

      await connection.commit();
      
      return {
        insertId: customerResult.insertId,
        addressId: addressId,
        affectedRows: customerResult.affectedRows
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get customers with detailed information and statistics
   */
  async getCustomersWithStats(search = '', page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE c.active = 1';
    let params = [];

    if (search) {
      whereClause += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const sql = `
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.email,
        c.username,
        c.create_date,
        c.last_update,
        c.active,
        a.address,
        a.district,
        a.phone,
        ci.city,
        co.country,
        s.store_id,
        COUNT(DISTINCT r.rental_id) as total_rentals,
        COUNT(DISTINCT CASE WHEN r.return_date IS NULL THEN r.rental_id END) as active_rentals,
        COALESCE(SUM(p.amount), 0) as total_payments
      FROM customer c
      LEFT JOIN address a ON c.address_id = a.address_id
      LEFT JOIN city ci ON a.city_id = ci.city_id
      LEFT JOIN country co ON ci.country_id = co.country_id
      LEFT JOIN store s ON c.store_id = s.store_id
      LEFT JOIN rental r ON c.customer_id = r.customer_id
      LEFT JOIN payment p ON r.rental_id = p.rental_id
      ${whereClause}
      GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.username, 
               c.create_date, c.last_update, c.active, a.address, a.district, 
               a.phone, ci.city, co.country, s.store_id
      ORDER BY c.last_name, c.first_name
      LIMIT ? OFFSET ?
    `;

    return await this.query(sql, [...params, limit, offset]);
  }

  /**
   * Get customer count for pagination
   */
  async getSearchCustomersCount(search = '') {
    let whereClause = 'WHERE c.active = 1';
    let params = [];

    if (search) {
      whereClause += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const sql = `
      SELECT COUNT(DISTINCT c.customer_id) as count
      FROM customer c
      LEFT JOIN address a ON c.address_id = a.address_id
      ${whereClause}
    `;

    const results = await this.query(sql, params);
    return results[0].count;
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN c.active = 1 THEN 1 END) as active_customers,
        COUNT(CASE WHEN c.active = 0 THEN 1 END) as inactive_customers,
        COUNT(CASE WHEN c.create_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_customers_30_days
      FROM customer c
    `;

    const results = await this.query(sql);
    return results[0];
  }

  /**
   * Get customer details with rental history
   */
  async getCustomerWithRentalHistory(customerId) {
    const customerSql = `
      SELECT 
        c.*,
        a.address,
        a.district,
        a.phone,
        ci.city,
        co.country,
        s.store_id
      FROM customer c
      LEFT JOIN address a ON c.address_id = a.address_id
      LEFT JOIN city ci ON a.city_id = ci.city_id
      LEFT JOIN country co ON ci.country_id = co.country_id
      LEFT JOIN store s ON c.store_id = s.store_id
      WHERE c.customer_id = ?
    `;

    const rentalsSql = `
      SELECT 
        r.rental_id,
        r.rental_date,
        r.return_date,
        f.title as film_title,
        f.rating,
        p.amount as payment_amount,
        p.payment_date,
        s.first_name as staff_first_name,
        s.last_name as staff_last_name
      FROM rental r
      JOIN inventory i ON r.inventory_id = i.inventory_id
      JOIN film f ON i.film_id = f.film_id
      LEFT JOIN payment p ON r.rental_id = p.rental_id
      LEFT JOIN staff s ON r.staff_id = s.staff_id
      WHERE r.customer_id = ?
      ORDER BY r.rental_date DESC
      LIMIT 20
    `;

    const [customer, rentals] = await Promise.all([
      this.query(customerSql, [customerId]).then(results => results[0] || null),
      this.query(rentalsSql, [customerId])
    ]);

    return {
      customer,
      rentals
    };
  }

  /**
   * Update customer information
   */
  async updateCustomer(customerId, customerData) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(customerData)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('last_update = NOW()');
    values.push(customerId);

    const sql = `
      UPDATE customer 
      SET ${fields.join(', ')}
      WHERE customer_id = ?
    `;

    return await this.query(sql, values);
  }

  /**
   * Get customers by store
   */
  async getCustomersByStore(storeId) {
    const sql = `
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.email,
        c.active,
        COUNT(r.rental_id) as total_rentals
      FROM customer c
      LEFT JOIN rental r ON c.customer_id = r.customer_id
      WHERE c.store_id = ?
      GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.active
      ORDER BY c.last_name, c.first_name
    `;

    return await this.query(sql, [storeId]);
  }

  /**
   * Get top customers by rental count
   */
  async getTopCustomers(limit = 10) {
    const sql = `
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.email,
        COUNT(r.rental_id) as total_rentals,
        COALESCE(SUM(p.amount), 0) as total_spent
      FROM customer c
      LEFT JOIN rental r ON c.customer_id = r.customer_id
      LEFT JOIN payment p ON r.rental_id = p.rental_id
      WHERE c.active = 1
      GROUP BY c.customer_id, c.first_name, c.last_name, c.email
      ORDER BY total_rentals DESC, total_spent DESC
      LIMIT ?
    `;

    return await this.query(sql, [limit]);
  }

  /**
   * Get customer with detailed information by ID
   */
  async getCustomerWithDetails(customerId) {
    const sql = `
      SELECT 
        c.customer_id,
        c.store_id,
        c.first_name,
        c.last_name,
        c.email,
        c.username,
        c.create_date,
        c.last_update,
        c.active,
        a.address,
        a.district,
        a.postal_code,
        a.phone,
        ci.city,
        co.country,
        COUNT(DISTINCT r.rental_id) as total_rentals,
        COUNT(DISTINCT CASE WHEN r.return_date IS NULL THEN r.rental_id END) as active_rentals,
        COALESCE(SUM(p.amount), 0) as total_payments
      FROM customer c
      LEFT JOIN address a ON c.address_id = a.address_id
      LEFT JOIN city ci ON a.city_id = ci.city_id
      LEFT JOIN country co ON ci.country_id = co.country_id
      LEFT JOIN rental r ON c.customer_id = r.customer_id
      LEFT JOIN payment p ON r.rental_id = p.rental_id
      WHERE c.customer_id = ?
      GROUP BY c.customer_id
    `;

    const rows = await this.query(sql, [customerId]);
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = CustomerDAO;