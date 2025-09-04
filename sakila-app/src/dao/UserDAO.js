const BaseDAO = require('./BaseDAO');

/**
 * DAO for user authentication operations
 */
class UserDAO extends BaseDAO {
  constructor() {
    super('user_auth', 'user_id');
  }

  /**
   * Find user by username or email for authentication
   */
  async findByUsernameOrEmail(usernameOrEmail) {
    const sql = `
      SELECT 
        user_type,
        user_id,
        username,
        password,
        email,
        full_name,
        active,
        store_id
      FROM user_auth 
      WHERE (username = ? OR email = ?) AND active = 1
    `;
    
    const results = await this.query(sql, [usernameOrEmail, usernameOrEmail]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username) {
    const sql = 'SELECT 1 FROM user_auth WHERE username = ? LIMIT 1';
    const result = await this.query(sql, [username]);
    return result.length > 0;
  }

  /**
   * Check if email exists
   */
  async emailExists(email) {
    const sql = 'SELECT 1 FROM user_auth WHERE email = ? LIMIT 1';
    const result = await this.query(sql, [email]);
    return result.length > 0;
  }

  /**
   * Get user by ID and type
   */
  async findByIdAndType(userId, userType) {
    const sql = `
      SELECT 
        user_type,
        user_id,
        username,
        email,
        full_name,
        active,
        store_id
      FROM user_auth 
      WHERE user_id = ? AND user_type = ? AND active = 1
    `;
    
    const results = await this.query(sql, [userId, userType]);
    return results.length > 0 ? results[0] : null;
  }
}

module.exports = UserDAO;
