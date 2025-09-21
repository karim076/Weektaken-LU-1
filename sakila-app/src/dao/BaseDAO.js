const databaseConfig = require('../config/database');

/**
 * Base DAO class for common database operations
 */
class BaseDAO {
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.db = databaseConfig;
  }

  /**
   * Execute a database query
   */
  query(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    try {
      this.db.query(sql, params, (error, results) => {
        if (error) {
          console.error(`Query error in ${this.constructor.name}:`, error);
          return callback(error);
        }
        callback(null, results);
      });
    } catch (error) {
      console.error(`Query error in ${this.constructor.name}:`, error);
      callback(error);
    }
  }

  /**
   * Find record by ID
   */
  findById(id, callback) {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    this.query(sql, [id], (error, results) => {
      if (error) return callback(error);
      callback(null, results.length > 0 ? results[0] : null);
    });
  }

  /**
   * Find all records
   */
  findAll(callback) {
    const sql = `SELECT * FROM ${this.tableName}`;
    this.query(sql, callback);
  }

  /**
   * Create new record
   */
  create(data, callback) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    this.query(sql, values, callback);
  }

  /**
   * Update record by ID
   */
  update(id, data, callback) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
    this.query(sql, [...values, id], callback);
  }

  /**
   * Delete record by ID
   */
  delete(id, callback) {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    this.query(sql, [id], callback);
  }

  /**
   * Count total records
   */
  count(whereClause, params, callback) {
    if (typeof whereClause === 'function') {
      callback = whereClause;
      whereClause = '';
      params = [];
    }
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }
    
    this.query(sql, params, (error, results) => {
      if (error) return callback(error);
      callback(null, results[0].count);
    });
  }
}

module.exports = BaseDAO;