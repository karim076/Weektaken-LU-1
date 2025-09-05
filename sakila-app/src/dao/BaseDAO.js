const databaseConfig = require('../config/database');

/**
 * Base DAO class for common database operations
 */
class BaseDAO {
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.initDatabase();
  }

  /**
   * Initialize database connection
   */
  async initDatabase() {
    if (!this.db) {
      this.db = await databaseConfig.createPool();
    }
  }

  /**
   * Execute a database query
   */
  async query(sql, params = []) {
    try {
      if (!this.db) {
        await this.initDatabase();
      }
      const [results] = await this.db.query(sql, params);
      return results;
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
   * Find all records
   */
  async findAll() {
    const sql = `SELECT * FROM ${this.tableName}`;
    return await this.query(sql);
  }

  /**
   * Create new record
   */
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    return await this.query(sql, values);
  }

  /**
   * Update record by ID
   */
  async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
    return await this.query(sql, [...values, id]);
  }

  /**
   * Delete record by ID
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    return await this.query(sql, [id]);
  }

  /**
   * Count total records
   */
  async count(whereClause = '', params = []) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }
    
    const results = await this.query(sql, params);
    return results[0].count;
  }

  /**
   * Execute a transaction
   */
  async transaction(operations) {
    const connection = await this.db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const operation of operations) {
        const result = await connection.execute(operation.sql, operation.params || []);
        results.push(result);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = BaseDAO;