/**
 * Database schema definitions and initialization
 * This file contains SQL queries for creating tables and managing schema
 */

import { query } from './db';

/**
 * Initialize database schema
 * Creates necessary tables if they don't exist
 */
export async function initializeSchema(): Promise<void> {
  const { getPool } = await import('./db');
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    // First, try to create the database if it doesn't exist
    const dbName = process.env.DB_NAME || 'foodsell_manager';
    
    try {
      // Connect without database first
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await connection.query(`USE \`${dbName}\``);
      console.log(`✅ Database created/selected: ${dbName}`);
    } catch (error: any) {
      // If we can't create database, the user needs to create it manually
      if (error.code === 'ER_DBACCESS_DENIED_ERROR' || error.code === 'ER_DB_CREATE_EXISTS') {
        console.log(`⚠️  Cannot create database. Please create it manually:`);
        console.log(`   CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`\nTrying to use existing database: ${dbName}`);
        try {
          await connection.query(`USE \`${dbName}\``);
          console.log(`✅ Using existing database: ${dbName}`);
        } catch (useError: any) {
          throw new Error(`Database '${dbName}' does not exist. Please create it first or update DB_NAME environment variable.`);
        }
      } else {
        throw error;
      }
    }
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        trial_start_date DATETIME,
        subscription_status ENUM('trial', 'active', 'expired', 'cancelled') DEFAULT 'trial',
        subscription_end_date DATETIME,
        subscription_plan ENUM('monthly', 'yearly'),
        INDEX idx_email (email),
        INDEX idx_subscription_status (subscription_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create menu_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        extras JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        order_number VARCHAR(50) NOT NULL,
        date DATETIME NOT NULL,
        items JSON NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        final_amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_order_number (order_number),
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create restaurant_settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS restaurant_settings (
        user_id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        contact_number VARCHAR(50),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
    throw error;
  } finally {
    connection.release();
  }
}
