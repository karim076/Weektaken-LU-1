const databaseConfig = require('../config/database');

/**
 * Base DAO class with common database operations
 */
class BaseDAO {
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.db = databaseConfig;
  }

  /**
   * Execute a custom query
   */
  async query(sql, params = []) {
    try {
      return await this.db.query(sql, params);
    } catch (error) {
      console.error(`Query error in ${this.constructor.name}:`, error);
      throw error;
    }
  }

  /**
   * Find record by ID
   */
  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const results = await this.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all records with optional conditions
   */
  async findAll(conditions = {}, limit = null, offset = null) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    if (limit) {
      sql += ` LIMIT ?`;
      params.push(limit);
      
      if (offset) {
        sql += ` OFFSET ?`;
        params.push(offset);
      }
    }

    return await this.query(sql, params);
  }

  /**
   * Create a new record
   */
  async create(data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  }

  /**
   * Update a record by ID
   */
  async update(id, data) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
    const result = await this.query(sql, values);
    
    return {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows
    };
  }

  /**
   * Delete a record by ID
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const result = await this.query(sql, [id]);
    
    return {
      affectedRows: result.affectedRows
    };
  }

  /**
   * Count records with optional conditions
   */
  async count(conditions = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    const result = await this.query(sql, params);
    return result[0].count;
  }

  /**
   * Check if record exists by ID
   */
  async exists(id) {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE ${this.primaryKey} = ? LIMIT 1`;
    const result = await this.query(sql, [id]);
    return result.length > 0;
  }
}

module.exports = BaseDAO;
