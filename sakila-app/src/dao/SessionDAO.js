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
  createSession(sessionId, userId, userType, expiresAt, callback) {
    const sql = `
      INSERT INTO user_sessions (session_id, user_id, user_type, expires_at, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    this.query(sql, [sessionId, userId, userType, expiresAt], callback);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId, callback) {
    const sql = `
      SELECT * FROM user_sessions 
      WHERE session_id = ? AND expires_at > NOW()
    `;

    this.query(sql, [sessionId], (error, results) => {
      if (error) return callback(error);
      callback(null, results.length > 0 ? results[0] : null);
    });
  }

  /**
   * Update session last accessed time
   */
  updateSessionAccess(sessionId, callback) {
    const sql = `
      UPDATE user_sessions 
      SET last_accessed = NOW()
      WHERE session_id = ?
    `;

    this.query(sql, [sessionId], callback);
  }

  /**
   * Delete session (logout)
   */
  deleteSession(sessionId, callback) {
    const sql = `
      DELETE FROM user_sessions 
      WHERE session_id = ?
    `;

    this.query(sql, [sessionId], callback);
  }

  /**
   * Delete all sessions for a user (logout from all devices)
   */
  deleteUserSessions(userId, userType, callback) {
    const sql = `
      DELETE FROM user_sessions 
      WHERE user_id = ? AND user_type = ?
    `;

    this.query(sql, [userId, userType], callback);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(callback) {
    const sql = `
      DELETE FROM user_sessions 
      WHERE expires_at <= NOW()
    `;

    this.query(sql, [], callback);
  }

  /**
   * Get active sessions for a user
   */
  getUserActiveSessions(userId, userType, callback) {
    const sql = `
      SELECT session_id, created_at, last_accessed, expires_at
      FROM user_sessions 
      WHERE user_id = ? AND user_type = ? AND expires_at > NOW()
      ORDER BY last_accessed DESC
    `;

    this.query(sql, [userId, userType], callback);
  }

  /**
   * Count active sessions
   */
  countActiveSessions(callback) {
    const sql = `
      SELECT 
        user_type,
        COUNT(*) as active_sessions
      FROM user_sessions 
      WHERE expires_at > NOW()
      GROUP BY user_type
    `;

    this.query(sql, [], callback);
  }

  /**
   * Get session statistics
   */
  getSessionStats(callback) {
    const sql = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_sessions,
        COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_sessions,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as sessions_24h
      FROM user_sessions
    `;

    this.query(sql, [], (error, results) => {
      if (error) return callback(error);
      callback(null, results[0]);
    });
  }

  /**
   * Extend session expiry
   */
  extendSession(sessionId, newExpiresAt, callback) {
    const sql = `
      UPDATE user_sessions 
      SET expires_at = ?, last_accessed = NOW()
      WHERE session_id = ?
    `;

    this.query(sql, [newExpiresAt, sessionId], callback);
  }
}

module.exports = SessionDAO;