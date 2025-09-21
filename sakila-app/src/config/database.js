const mysql = require('mysql2');
require('dotenv').config();

class DatabaseConfig {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sakila',
      port: parseInt(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    
    this.pool = null;
  }

  createPool(callback) {
    if (!this.pool) {
      try {
        this.pool = mysql.createPool(this.config);
        console.log('Database connection pool created successfully');
        if (callback) callback(null, this.pool);
      } catch (error) {
        console.error('Failed to create database pool:', error);
        if (callback) callback(error);
      }
    } else {
      if (callback) callback(null, this.pool);
    }
    return this.pool;
  }

  getConnection(callback) {
    if (!this.pool) {
      this.createPool((err) => {
        if (err) return callback(err);
        this.pool.getConnection(callback);
      });
    } else {
      this.pool.getConnection(callback);
    }
  }

  query(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    this.getConnection((err, connection) => {
      if (err) {
        console.error('Failed to get database connection:', err);
        return callback(err);
      }
      
      // Use query instead of execute to avoid prepared statement issues
      connection.query(sql, params, (error, results) => {
        connection.release();
        if (error) {
          console.error('Database query error:', error);
          return callback(error);
        }
        callback(null, results);
      });
    });
  }

  close(callback) {
    if (this.pool) {
      this.pool.end((err) => {
        if (err) {
          console.error('Error closing database pool:', err);
        } else {
          console.log('Database connection pool closed');
          this.pool = null;
        }
        if (callback) callback(err);
      });
    } else {
      if (callback) callback(null);
    }
  }
}

// Singleton instance
const databaseConfig = new DatabaseConfig();

module.exports = databaseConfig;
