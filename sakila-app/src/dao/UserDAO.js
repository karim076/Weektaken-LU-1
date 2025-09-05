// src/dao/UserDAO.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

class UserDAO {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sakila',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  // 🔎 Zoek gebruiker op username
  async findByUsername(username) {
    const [rows] = await this.pool.query(
      `SELECT * FROM user_auth WHERE username = ? LIMIT 1`,
      [username]
    );
    return rows.length ? rows[0] : null;
  }

  // 🔎 Zoek gebruiker op email
  async findByEmail(email) {
    const [rows] = await this.pool.query(
      `SELECT * FROM user_auth WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows.length ? rows[0] : null;
  }

  // 🔎 Zoek gebruiker op id en type
  async findById(id, type) {
    const [rows] = await this.pool.query(
      `SELECT * FROM user_auth WHERE user_id = ? AND user_type = ? LIMIT 1`,
      [id, type]
    );
    return rows.length ? rows[0] : null;
  }

  // ✅ Maak nieuwe klant
  async createCustomer(customerData) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      // Insert address als dat in customerData zit
      const [addrResult] = await conn.query(
        `INSERT INTO address (address, district, city_id, postal_code, phone) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          customerData.address,
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
          customerData.password
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

  // ✅ Password check
  async verifyPassword(username, password) {
    const user = await this.findByUsername(username);
    if (!user) return false;
    
    // Check if password is already hashed (starts with $2b$ for bcrypt)
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      // It's a hashed password, use bcrypt compare
      return bcrypt.compare(password, user.password);
    } else {
      // It's a plain text password (legacy), do direct comparison
      console.log('🔓 Using plain text password comparison for:', username);
      return password === user.password;
    }
  }

  // ✅ Password update
  async updatePassword(userId, userType, newPassword) {
    const [result] = await this.pool.query(
      `UPDATE ${userType} SET password = ? WHERE ${userType}_id = ?`,
      [newPassword, userId]
    );
    return result;
  }

  // ✅ Profiel update
  async updateProfile(userId, userType, profileData) {
    const fields = Object.keys(profileData).map(f => `${f} = ?`).join(', ');
    const values = Object.values(profileData);

    const [result] = await this.pool.query(
      `UPDATE ${userType} SET ${fields} WHERE ${userType}_id = ?`,
      [...values, userId]
    );
    return result;
  }
}

module.exports = UserDAO;
