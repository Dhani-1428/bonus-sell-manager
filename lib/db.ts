import mysql from 'mysql2/promise';
import * as fs from 'fs';

// Database connection configuration
function getDbConfig(): mysql.PoolOptions {
  const config: mysql.PoolOptions = {
    host: process.env.DB_HOST || 'foodsell.cluster-ctu4682g825l.eu-north-1.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'mysql',
    user: process.env.DB_USER || 'bfsmanager',
    password: process.env.DB_PASSWORD || 'Dhani1428',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  // Configure SSL if enabled
  if (process.env.DB_SSL === 'true') {
    const certPath = process.env.DB_SSL_CERT_PATH;
    
    if (certPath && fs.existsSync(certPath)) {
      // Use certificate file if provided
      config.ssl = {
        rejectUnauthorized: false,
        ca: fs.readFileSync(certPath),
      };
    } else {
      // Use rejectUnauthorized: false for development/testing
      // In production, you should use proper SSL certificates
      config.ssl = {
        rejectUnauthorized: false,
      };
    }
  }

  return config;
}

// Create connection pool
let pool: mysql.Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    const config = getDbConfig();
    pool = mysql.createPool(config);
  }
  return pool;
}

/**
 * Execute a query with the connection pool
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const pool = getPool();
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a query and return the first row
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query<{ v: string }>('SELECT VERSION() AS v');
    console.log('Database version:', result[0]?.v);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Close all database connections
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
