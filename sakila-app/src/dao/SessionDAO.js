const BaseDAO = require('./BaseDAO');

/**
 * DAO for session management operations
 */
class SessionDAO extends BaseDAO {
  constructor() {
    super('user_sessions', 'session_id');
  }

  /**
   * Create a new session
   */
  async createSession(sessionId, userId, userType, expiresAt) {
    const sql = `
      INSERT INTO user_sessions (session_id, user_id, user_type, expires_at)
      VALUES (?, ?, ?, ?)
    `;
    
    return await this.query(sql, [sessionId, userId, userType, expiresAt]);
  }

  /**
   * Get session with user details
   */
  async getSessionWithUser(sessionId) {
    const sql = `
      SELECT 
        s.session_id,
        s.user_id,
        s.user_type,
        s.expires_at,
        u.username,
        u.email,
        u.full_name,
        u.store_id
      FROM user_sessions s
      JOIN user_auth u ON s.user_id = u.user_id AND s.user_type = u.user_type
      WHERE s.session_id = ? AND s.expires_at > NOW()
    `;
    
    const results = await this.query(sql, [sessionId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Update session last accessed time
   */
  async updateLastAccessed(sessionId) {
    const sql = `
      UPDATE user_sessions 
      SET last_accessed = NOW() 
      WHERE session_id = ?
    `;
    
    return await this.query(sql, [sessionId]);
  }

  /**
   * Delete session (logout)
   */
  async deleteSession(sessionId) {
    const sql = 'DELETE FROM user_sessions WHERE session_id = ?';
    return await this.query(sql, [sessionId]);
  }

  /**
   * Clean expired sessions
   */
  async cleanExpiredSessions() {
    const sql = 'DELETE FROM user_sessions WHERE expires_at < NOW()';
    return await this.query(sql);
  }

  /**
   * Delete all sessions for a user (logout from all devices)
   */
  async deleteUserSessions(userId, userType) {
    const sql = 'DELETE FROM user_sessions WHERE user_id = ? AND user_type = ?';
    return await this.query(sql, [userId, userType]);
  }

  /**
   * Get active sessions count for a user
   */
  async getActiveSessionsCount(userId, userType) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM user_sessions 
      WHERE user_id = ? AND user_type = ? AND expires_at > NOW()
    `;
    
    const result = await this.query(sql, [userId, userType]);
    return result[0].count;
  }
}

module.exports = SessionDAO;
