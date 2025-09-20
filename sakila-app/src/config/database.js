const mysql = require('mysql2/promise');
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

  async createPool() {
    if (!this.pool) {
      try {
        this.pool = mysql.createPool(this.config);
        console.log('Database connection pool created successfully');
      } catch (error) {
        console.error('Failed to create database pool:', error);
        throw error;
      }
    }
    return this.pool;
  }

  async getConnection() {
    if (!this.pool) {
      await this.createPool();
    }
    
    try {
      const connection = await this.pool.getConnection();
      return connection;
    } catch (error) {
      console.error('Failed to get database connection:', error);
      throw error;
    }
  }

  async query(sql, params = []) {
    const connection = await this.getConnection();
    try {
      const [results] = await connection.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection pool closed');
    }
  }
}

// Singleton instance
const databaseConfig = new DatabaseConfig();

module.exports = databaseConfig;
