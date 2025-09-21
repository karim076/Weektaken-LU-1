// src/dao/UserDAO.js
const BaseDAO = require('./BaseDAO');
const bcrypt = require('bcrypt');

class UserDAO extends BaseDAO {
  constructor() {
    super('user_auth', 'user_id');
  }

  //  Zoek gebruiker op username
  findByUsername(username, callback) {
    this.query(
      `SELECT * FROM user_auth WHERE username = ? LIMIT 1`,
      [username],
      (error, rows) => {
        if (error) {
          return callback(error);
        }
        callback(null, rows.length ? rows[0] : null);
      }
    );
  }

  //  Zoek gebruiker op email
  findByEmail(email, callback) {
    this.query(
      `SELECT * FROM user_auth WHERE email = ? LIMIT 1`,
      [email],
      (error, rows) => {
        if (error) {
          return callback(error);
        }
        callback(null, rows.length ? rows[0] : null);
      }
    );
  }

  //  Zoek gebruiker op id en type
  findById(id, type, callback) {
    this.query(
      `SELECT * FROM user_auth WHERE user_id = ? AND user_type = ? LIMIT 1`,
      [id, type],
      (err, rows) => {
        if (err) return callback(err);
        callback(null, rows.length ? rows[0] : null);
      }
    );
  }

  //  Maak nieuwe klant
  createCustomer(customerData, callback) {
    this.db.getConnection((err, conn) => {
      if (err) return callback(err);
      
      conn.beginTransaction((err) => {
        if (err) {
          conn.release();
          return callback(err);
        }

        // Hash password if not already hashed
        let hashedPassword = customerData.password;
        if (!hashedPassword.startsWith('$2b$') && !hashedPassword.startsWith('$2a$')) {
          bcrypt.hash(customerData.password, 10, (err, hash) => {
            if (err) {
              conn.rollback(() => {
                conn.release();
                callback(err);
              });
              return;
            }
            hashedPassword = hash;
            insertAddress();
          });
        } else {
          insertAddress();
        }

        function insertAddress() {
          // Insert address als dat in customerData zit
          conn.query(
            `INSERT INTO address (address, address2, district, city_id, postal_code, phone, location) 
             VALUES (?, ?, ?, ?, ?, ?, POINT(0, 0))`,
            [
              customerData.address,
              customerData.address2,
              customerData.district,
              customerData.city_id,
              customerData.postal_code,
              customerData.phone
            ],
            (err, addrResult) => {
              if (err) {
                conn.rollback(() => {
                  conn.release();
                  callback(err);
                });
                return;
              }
              
              const addressId = addrResult.insertId;
              
              // Insert customer
              conn.query(
                `INSERT INTO customer (store_id, first_name, last_name, email, address_id, active, username, password, create_date) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                  customerData.store_id || 1,
                  customerData.first_name,
                  customerData.last_name,
                  customerData.email,
                  addressId,
                  1,
                  customerData.username,
                  hashedPassword
                ],
                (err, custResult) => {
                  if (err) {
                    conn.rollback(() => {
                      conn.release();
                      callback(err);
                    });
                    return;
                  }
                  
                  conn.commit((err) => {
                    if (err) {
                      conn.rollback(() => {
                        conn.release();
                        callback(err);
                      });
                      return;
                    }
                    
                    conn.release();
                    callback(null, { success: true, customerId: custResult.insertId });
                  });
                }
              );
            }
          );
        }
      });
    });
  }

  //  Password check
  verifyPassword(username, password, callback) {
    this.findByUsername(username, (err, user) => {
      if (err) return callback(err);
      if (!user) return callback(null, false);
      
      // Check if password is already hashed (starts with $2b$ for bcrypt)
      if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        // It's a hashed password, use bcrypt compare
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) return callback(err);
          callback(null, isMatch);
        });
      } else {
        // It's a plain text password (legacy), do direct comparison
        console.log(' Using plain text password comparison for:', username);
        callback(null, password === user.password);
      }
    });
  }

  //  Password update
  updatePassword(userId, userType, newPassword, callback) {
    this.query(
      `UPDATE ${userType} SET password = ? WHERE ${userType}_id = ?`,
      [newPassword, userId],
      callback
    );
  }

  //  Profiel update
  updateProfile(userId, userType, profileData, callback) {
    const fields = Object.keys(profileData).map(f => `${f} = ?`).join(', ');
    const values = Object.values(profileData);

    this.query(
      `UPDATE ${userType} SET ${fields} WHERE ${userType}_id = ?`,
      [...values, userId],
      callback
    );
  }
}

module.exports = UserDAO;
