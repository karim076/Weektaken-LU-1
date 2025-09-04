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
   * Get customers with rental statistics for staff dashboard
   */
  async getCustomersWithStats(search = '', page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE c.active = 1';
    let searchParams = [];

    if (search) {
      whereClause += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)`;
      const searchPattern = `%${search}%`;
      searchParams = [searchPattern, searchPattern, searchPattern];
    }

    const sql = `
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.email,
        c.store_id,
        c.active,
        c.create_date,
        COUNT(r.rental_id) as total_rentals,
        COUNT(CASE WHEN r.return_date IS NULL THEN 1 END) as active_rentals,
        MAX(r.rental_date) as last_rental,
        SUM(p.amount) as total_spent
      FROM customer c
      LEFT JOIN rental r ON c.customer_id = r.customer_id
      LEFT JOIN payment p ON r.rental_id = p.rental_id
      ${whereClause}
      GROUP BY c.customer_id
      ORDER BY c.last_name, c.first_name
      LIMIT ? OFFSET ?
    `;

    return await this.query(sql, [...searchParams, limit, offset]);
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN active = 1 THEN 1 END) as active_customers,
        COUNT(CASE WHEN active = 0 THEN 1 END) as inactive_customers
      FROM customer
    `;
    
    const result = await this.query(sql);
    return result[0];
  }

  /**
   * Search customers count for pagination
   */
  async getSearchCustomersCount(search = '') {
    let whereClause = 'WHERE active = 1';
    let searchParams = [];

    if (search) {
      whereClause += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`;
      const searchPattern = `%${search}%`;
      searchParams = [searchPattern, searchPattern, searchPattern];
    }

    const sql = `SELECT COUNT(*) as count FROM customer ${whereClause}`;
    const result = await this.query(sql, searchParams);
    return result[0].count;
  }

  /**
   * Get customer with address details
   */
  async getCustomerWithAddress(customerId) {
    const sql = `
      SELECT 
        c.*,
        a.address,
        a.district,
        a.phone,
        ci.city,
        co.country
      FROM customer c
      LEFT JOIN address a ON c.address_id = a.address_id
      LEFT JOIN city ci ON a.city_id = ci.city_id
      LEFT JOIN country co ON ci.country_id = co.country_id
      WHERE c.customer_id = ?
    `;
    
    const results = await this.query(sql, [customerId]);
    return results.length > 0 ? results[0] : null;
  }
}

module.exports = CustomerDAO;
