/**
 * Database Configuration
 * MySQL2 connection pool with promise-based interface
 */

const mysql = require('mysql2/promise');

/**
 * Create a connection pool
 * Promise-based MySQL2 pool
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z', // UTC timezone
  dateStrings: false,
  supportBigNumbers: true,
  bigNumberStrings: false,
});

/**
 * Execute a query with parameters
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters (? placeholders)
 * @returns {Promise<Array>} Result rows
 */
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get a single connection from pool for transactions
 * Must be released after use: conn.release()
 * @returns {Promise<Connection>} Database connection
 */
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Failed to get database connection:', error);
    throw error;
  }
}

/**
 * Test database connectivity
 * @returns {Promise<boolean>} True if connection successful
 */
async function testConnection() {
  try {
    const [rows] = await pool.execute('SELECT 1 as connected');
    return rows.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Close all connections in pool
 * Call during graceful shutdown
 * @returns {Promise<void>}
 */
async function closePool() {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  getConnection,
  testConnection,
  closePool,
};
