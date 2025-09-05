const BaseDAO = require('./BaseDAO');

/**
 * DAO for session management operations
 */
class SessionDAO extends BaseDAO {
  constructor() {
    super('user_sessions', 'session_id');
  }

  /**
   * Create new session
   */
  async createSession(sessionId, userId, userType, expiresAt) {
    const sql = `
      INSERT INTO user_sessions (session_id, user_id, user_type, expires_at, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    return await this.query(sql, [sessionId, userId, userType, expiresAt]);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    const sql = `
      SELECT * FROM user_sessions 
      WHERE session_id = ? AND expires_at > NOW()
    `;

    const results = await this.query(sql, [sessionId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Update session last accessed time
   */
  async updateSessionAccess(sessionId) {
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
    const sql = `
      DELETE FROM user_sessions 
      WHERE session_id = ?
    `;

    return await this.query(sql, [sessionId]);
  }

  /**
   * Delete all sessions for a user (logout from all devices)
   */
  async deleteUserSessions(userId, userType) {
    const sql = `
      DELETE FROM user_sessions 
      WHERE user_id = ? AND user_type = ?
    `;

    return await this.query(sql, [userId, userType]);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const sql = `
      DELETE FROM user_sessions 
      WHERE expires_at <= NOW()
    `;

    return await this.query(sql);
  }

  /**
   * Get active sessions for a user
   */
  async getUserActiveSessions(userId, userType) {
    const sql = `
      SELECT session_id, created_at, last_accessed, expires_at
      FROM user_sessions 
      WHERE user_id = ? AND user_type = ? AND expires_at > NOW()
      ORDER BY last_accessed DESC
    `;

    return await this.query(sql, [userId, userType]);
  }

  /**
   * Count active sessions
   */
  async countActiveSessions() {
    const sql = `
      SELECT 
        user_type,
        COUNT(*) as active_sessions
      FROM user_sessions 
      WHERE expires_at > NOW()
      GROUP BY user_type
    `;

    return await this.query(sql);
  }

  /**
   * Get session statistics
   */
  async getSessionStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_sessions,
        COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_sessions,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as sessions_24h
      FROM user_sessions
    `;

    const results = await this.query(sql);
    return results[0];
  }

  /**
   * Extend session expiry
   */
  async extendSession(sessionId, newExpiresAt) {
    const sql = `
      UPDATE user_sessions 
      SET expires_at = ?, last_accessed = NOW()
      WHERE session_id = ?
    `;

    return await this.query(sql, [newExpiresAt, sessionId]);
  }
}

module.exports = SessionDAO;