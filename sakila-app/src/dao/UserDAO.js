// src/dao/UserDAO.js
const BaseDAO = require('./BaseDAO');
const bcrypt = require('bcrypt');

class UserDAO extends BaseDAO {
  constructor() {
    super('user_auth', 'user_id');
  }

  //  Zoek gebruiker op username
  async findByUsername(username) {
    const rows = await this.query(
      `SELECT * FROM user_auth WHERE username = ? LIMIT 1`,
      [username]
    );
    return rows.length ? rows[0] : null;
  }

  //  Zoek gebruiker op email
  async findByEmail(email) {
    const rows = await this.query(
      `SELECT * FROM user_auth WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows.length ? rows[0] : null;
  }

  //  Zoek gebruiker op id en type
  async findById(id, type) {
    const rows = await this.query(
      `SELECT * FROM user_auth WHERE user_id = ? AND user_type = ? LIMIT 1`,
      [id, type]
    );
    return rows.length ? rows[0] : null;
  }

  //  Maak nieuwe klant
  async createCustomer(customerData) {
    const conn = await this.db.getConnection();
    try {
      await conn.beginTransaction();

      // Hash password if not already hashed
      let hashedPassword = customerData.password;
      if (!hashedPassword.startsWith('$2b$') && !hashedPassword.startsWith('$2a$')) {
        hashedPassword = await bcrypt.hash(customerData.password, 10);
      }

      // Insert address als dat in customerData zit
      const [addrResult] = await conn.query(
        `INSERT INTO address (address, address2, district, city_id, postal_code, phone, location) 
         VALUES (?, ?, ?, ?, ?, ?, POINT(0, 0))`,
        [
          customerData.address,
          customerData.address2,
          customerData.district,
          customerData.city_id,
          customerData.postal_code,
          customerData.phone
        ]
      );
      const addressId = addrResult.insertId;

      // Insert customer
      const [custResult] = await conn.query(
        `INSERT INTO customer (store_id, first_name, last_name, email, address_id, active, username, password) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerData.store_id || 1,
          customerData.first_name,
          customerData.last_name,
          customerData.email,
          addressId,
          1,
          customerData.username,
          hashedPassword
        ]
      );

      await conn.commit();
      return { success: true, customerId: custResult.insertId };
    } catch (err) {
      await conn.rollback();
      console.error('createCustomer error:', err);
      return { success: false };
    } finally {
      conn.release();
    }
  }

  //  Password check
  async verifyPassword(username, password) {
    const user = await this.findByUsername(username);
    if (!user) return false;
    
    // Check if password is already hashed (starts with $2b$ for bcrypt)
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      // It's a hashed password, use bcrypt compare
      return bcrypt.compare(password, user.password);
    } else {
      // It's a plain text password (legacy), do direct comparison
      console.log(' Using plain text password comparison for:', username);
      return password === user.password;
    }
  }

  //  Password update
  async updatePassword(userId, userType, newPassword) {
    const result = await this.query(
      `UPDATE ${userType} SET password = ? WHERE ${userType}_id = ?`,
      [newPassword, userId]
    );
    return result;
  }

  //  Profiel update
  async updateProfile(userId, userType, profileData) {
    const fields = Object.keys(profileData).map(f => `${f} = ?`).join(', ');
    const values = Object.values(profileData);

    const result = await this.query(
      `UPDATE ${userType} SET ${fields} WHERE ${userType}_id = ?`,
      [...values, userId]
    );
    return result;
  }
}

module.exports = UserDAO;
