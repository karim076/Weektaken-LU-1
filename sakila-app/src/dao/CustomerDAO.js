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
  createCustomerWithAddress(customerData, addressData, callback) {
    this.db.getConnection((err, connection) => {
      if (err) return callback(err);
      
      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          return callback(err);
        }

        // Create address first
        const addressSql = `
          INSERT INTO address (address, district, city_id, phone, location)
          VALUES (?, ?, ?, ?, POINT(0, 0))
        `;
        
        connection.query(addressSql, [
          addressData.address || 'Customer Address',
          addressData.district || 'District',
          addressData.cityId || 1,
          addressData.phone || '000-000-0000'
        ], (err, addressResult) => {
          if (err) {
            connection.rollback(() => {
              connection.release();
              callback(err);
            });
            return;
          }

          const addressId = addressResult.insertId;

          // Create customer
          const customerSql = `
            INSERT INTO customer (store_id, first_name, last_name, email, username, password, address_id, create_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `;
          
          connection.query(customerSql, [
            customerData.storeId || 1,
            customerData.firstName,
            customerData.lastName,
            customerData.email,
            customerData.username,
            customerData.password,
            addressId
          ], (err, customerResult) => {
            if (err) {
              connection.rollback(() => {
                connection.release();
                callback(err);
              });
              return;
            }

            connection.commit((err) => {
              if (err) {
                connection.rollback(() => {
                  connection.release();
                  callback(err);
                });
                return;
              }
              
              connection.release();
              callback(null, {
                insertId: customerResult.insertId,
                addressId: addressId,
                affectedRows: customerResult.affectedRows
              });
            });
          });
        });
      });
    });
  }

  /**
   * Get customers with detailed information and statistics
   */
  getCustomersWithStats(search = '', page = 1, limit = 20, callback) {
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

    this.query(sql, [...params, limit, offset], callback);
  }

  /**
   * Get customer count for pagination
   */
  getSearchCustomersCount(search = '', callback) {
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

    this.query(sql, params, (error, results) => {
      if (error) return callback(error);
      callback(null, results[0].count);
    });
  }

  /**
   * Get customer statistics
   */
  getCustomerStats(callback) {
    const sql = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN c.active = 1 THEN 1 END) as active_customers,
        COUNT(CASE WHEN c.active = 0 THEN 1 END) as inactive_customers,
        COUNT(CASE WHEN c.create_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_customers_30_days
      FROM customer c
    `;

    this.query(sql, [], (error, results) => {
      if (error) return callback(error);
      callback(null, results[0]);
    });
  }

  /**
   * Get customer details with rental history
   */
  getCustomerWithRentalHistory(customerId, callback) {
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

    // Get customer data first
    this.query(customerSql, [customerId], (error, customerResults) => {
      if (error) return callback(error);
      
      const customer = customerResults[0] || null;
      
      // Get rental history
      this.query(rentalsSql, [customerId], (error, rentals) => {
        if (error) return callback(error);
        
        callback(null, {
          customer,
          rentals
        });
      });
    });
  }

  /**
   * Update customer information
   */
  updateCustomer(customerId, customerData, callback) {
    try {
      console.log('CustomerDAO updateCustomer - ID:', customerId, 'Data:', customerData);
      
      const fields = [];
      const values = [];

      // Define valid customer table columns (only fields that actually exist in Sakila customer table)
      const validColumns = ['first_name', 'last_name', 'email', 'username', 'password', 'active'];

      for (const [key, value] of Object.entries(customerData)) {
        if (value !== undefined && validColumns.includes(key)) {
          // Convert boolean to 0/1 for MySQL
          let dbValue = value;
          if (typeof value === 'boolean') {
            dbValue = value ? 1 : 0;
          }
          
          fields.push(`${key} = ?`);
          values.push(dbValue);
        } else if (value !== undefined && !validColumns.includes(key)) {
          console.log(`CustomerDAO updateCustomer - Skipping invalid column: ${key}`);
        }
      }

      if (fields.length === 0) {
        console.log('CustomerDAO updateCustomer - No valid fields to update');
        return callback(null, {
          success: false,
          message: 'No valid fields to update'
        });
      }

      fields.push('last_update = NOW()');
      values.push(customerId);

      const sql = `
        UPDATE customer 
        SET ${fields.join(', ')}
        WHERE customer_id = ?
      `;

      console.log('CustomerDAO updateCustomer - SQL:', sql);
      console.log('CustomerDAO updateCustomer - Values:', values);

      this.query(sql, values, (error, result) => {
        if (error) {
          console.error('CustomerDAO updateCustomer error:', error);
          return callback(null, {
            success: false,
            message: error.message || 'Failed to update customer'
          });
        }
        
        console.log('CustomerDAO updateCustomer - Result:', result);
        
        const success = result.affectedRows > 0;
        const message = success ? 'Customer updated successfully' : 'No customer updated - customer not found or no changes made';
        
        console.log('CustomerDAO updateCustomer - Final result:', { success, message });
        
        callback(null, { success, message });
      });
    } catch (error) {
      console.error('CustomerDAO updateCustomer error:', error);
      callback(null, {
        success: false,
        message: error.message || 'Failed to update customer'
      });
    }
  }

  /**
   * Update customer and address information together
   */
  updateCustomerAndAddress(customerId, customerData, addressData, callback) {
    this.db.getConnection((err, connection) => {
      if (err) return callback(err);
      
      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          return callback(err);
        }

        // First get the customer's address_id
        const getAddressIdSql = 'SELECT address_id FROM customer WHERE customer_id = ?';
        connection.execute(getAddressIdSql, [customerId], (err, customerResult) => {
          if (err) {
            connection.rollback(() => {
              connection.release();
              callback(err);
            });
            return;
          }
          
          if (!customerResult.length) {
            connection.rollback(() => {
              connection.release();
              callback(new Error('Customer not found'));
            });
            return;
          }
          
          const addressId = customerResult[0].address_id;

          // Update customer table if customerData provided
          const updateCustomerStep = (nextCallback) => {
            if (!customerData || Object.keys(customerData).length === 0) {
              return nextCallback();
            }

            const customerFields = [];
            const customerValues = [];

            for (const [key, value] of Object.entries(customerData)) {
              if (value !== undefined) {
                customerFields.push(`${key} = ?`);
                customerValues.push(value);
              }
            }

            if (customerFields.length === 0) {
              return nextCallback();
            }

            customerFields.push('last_update = NOW()');
            customerValues.push(customerId);

            const customerSql = `
              UPDATE customer 
              SET ${customerFields.join(', ')}
              WHERE customer_id = ?
            `;

            connection.execute(customerSql, customerValues, nextCallback);
          };

          // Update address table if addressData provided
          const updateAddressStep = (nextCallback) => {
            if (!addressData || Object.keys(addressData).length === 0) {
              return nextCallback();
            }

            const addressFields = [];
            const addressValues = [];

            for (const [key, value] of Object.entries(addressData)) {
              if (value !== undefined) {
                addressFields.push(`${key} = ?`);
                addressValues.push(value);
              }
            }

            if (addressFields.length === 0) {
              return nextCallback();
            }

            addressFields.push('last_update = NOW()');
            addressValues.push(addressId);

            const addressSql = `
              UPDATE address 
              SET ${addressFields.join(', ')}
              WHERE address_id = ?
            `;

            connection.execute(addressSql, addressValues, nextCallback);
          };

          // Execute updates sequentially
          updateCustomerStep((err) => {
            if (err) {
              connection.rollback(() => {
                connection.release();
                callback(err);
              });
              return;
            }

            updateAddressStep((err) => {
              if (err) {
                connection.rollback(() => {
                  connection.release();
                  callback(err);
                });
                return;
              }

              connection.commit((err) => {
                connection.release();
                if (err) {
                  return callback(err);
                }
                callback(null, { affectedRows: 1 });
              });
            });
          });
        });
      });
    });
  }

  /**
   * Get customers by store
   */
  getCustomersByStore(storeId, callback) {
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

    this.query(sql, [storeId], callback);
  }

  /**
   * Get top customers by rental count
   */
  getTopCustomers(limit = 10, callback) {
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

    this.query(sql, [limit], callback);
  }

  /**
   * Get customer with detailed information by ID
   */
  getCustomerWithDetails(customerId, callback) {
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

    this.query(sql, [customerId], (error, rows) => {
      if (error) return callback(error);
      callback(null, rows.length > 0 ? rows[0] : null);
    });
  }

  /**
   * Check if username exists for a different customer
   */
  findByUsername(username, excludeCustomerId, callback) {
    // Allow for optional excludeCustomerId parameter
    if (typeof excludeCustomerId === 'function') {
      callback = excludeCustomerId;
      excludeCustomerId = null;
    }

    let sql = 'SELECT customer_id, username FROM customer WHERE username = ?';
    let params = [username];
    
    if (excludeCustomerId) {
      sql += ' AND customer_id != ?';
      params.push(excludeCustomerId);
    }
    
    this.query(sql, params, (error, result) => {
      if (error) return callback(error);
      callback(null, result[0] || null);
    });
  }

  /**
   * Search customers (basic - voor staff interface)
   */
  searchCustomersBasic(query, callback) {
    const sql = `
      SELECT 
        customer_id,
        first_name,
        last_name,
        email,
        active,
        create_date,
        CONCAT(first_name, ' ', last_name) as full_name
      FROM customer
      WHERE active = 1
        AND (
          first_name LIKE ? OR 
          last_name LIKE ? OR 
          email LIKE ? OR
          CONCAT(first_name, ' ', last_name) LIKE ?
        )
      ORDER BY last_name, first_name
      LIMIT 20
    `;
    
    const searchTerm = `%${query}%`;
    this.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (error, result) => {
      if (error) {
        console.error('CustomerDAO searchCustomersBasic error:', error);
        return callback(null, []);
      }
      callback(null, result);
    });
  }

  /**
   * Get all active customers (voor staff interface)
   */
  getAllActiveCustomers(callback) {
    const sql = `
      SELECT 
        customer_id,
        first_name,
        last_name,
        email,
        active,
        create_date,
        last_update,
        CONCAT(first_name, ' ', last_name) as full_name
      FROM customer
      WHERE active = 1
      ORDER BY last_name, first_name
      LIMIT 500
    `;
    
    this.query(sql, (error, result) => {
      if (error) {
        console.error('CustomerDAO getAllActiveCustomers error:', error);
        return callback(null, []);
      }
      callback(null, result);
    });
  }

  /**
   * Get active rentals for a customer
   */
  getActiveRentals(customerId, callback) {
    const sql = `
      SELECT 
        r.rental_id,
        r.rental_date,
        r.return_date,
        r.return_date,
        f.film_id,
        f.title,
        i.inventory_id
      FROM rental r
      JOIN inventory i ON r.inventory_id = i.inventory_id
      JOIN film f ON i.film_id = f.film_id
      WHERE r.customer_id = ? AND r.return_date IS NULL
      ORDER BY r.rental_date DESC
    `;
    
    this.query(sql, [customerId], (error, result) => {
      if (error) {
        console.error('CustomerDAO getActiveRentals error:', error);
        return callback(null, []);
      }
      callback(null, result);
    });
  }

  /**
   * Delete customer (soft delete by setting active = 0)
   */
  deleteCustomer(customerId, callback) {
    // In Sakila, we typically don't hard delete customers due to rental history
    // Instead, we set them as inactive
    const sql = `
      UPDATE customer 
      SET active = 0, last_update = NOW()
      WHERE customer_id = ?
    `;
    
    this.query(sql, [customerId], (error, result) => {
      if (error) {
        console.error('CustomerDAO deleteCustomer error:', error);
        return callback(error);
      }
      callback(null, result);
    });
  }
}

module.exports = CustomerDAO;