import { NextResponse } from "next/server"
import { initializeSchema } from "@/lib/db-schema"

/**
 * Initialize database schema endpoint
 * POST /api/db/init
 * 
 * This endpoint initializes the database schema (creates tables if they don't exist)
 * Should be called once after deployment or when setting up the database
 */
export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  try {
    console.log("Initializing database schema...")
    console.log(`Database: ${process.env.DB_NAME || 'foodsell_manager'}`)
    await initializeSchema()
    
    // Ensure payments table exists (it might have been missed)
    try {
      const { getPool } = await import('@/lib/db')
      const pool = getPool()
      const connection = await pool.getConnection()
      
      try {
        let dbName = process.env.DB_NAME || 'foodsell_manager';
        if (dbName === 'mysql' || dbName === 'information_schema' || dbName === 'performance_schema' || dbName === 'sys') {
          dbName = 'foodsell_manager';
        }

        // Check if payments table exists
        const [paymentsTables] = await connection.query(
          `SELECT TABLE_NAME 
           FROM INFORMATION_SCHEMA.TABLES 
           WHERE TABLE_SCHEMA = ? 
           AND TABLE_NAME = 'payments'`,
          [dbName]
        ) as any[]

        if (paymentsTables.length === 0) {
          console.log('Creating payments table...')
          await connection.query(`
            CREATE TABLE IF NOT EXISTS payments (
              id VARCHAR(255) PRIMARY KEY,
              user_id VARCHAR(255) NOT NULL,
              amount DECIMAL(10, 2) NOT NULL,
              currency VARCHAR(10) DEFAULT 'EUR',
              plan ENUM('monthly', 'yearly') NOT NULL,
              status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
              stripe_session_id VARCHAR(255),
              stripe_payment_intent_id VARCHAR(255),
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              approved_by VARCHAR(255),
              notes TEXT,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              INDEX idx_user_id (user_id),
              INDEX idx_status (status),
              INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
          `)
          console.log('✅ Created payments table')
        } else {
          console.log('✅ Payments table already exists')
        }
      } finally {
        connection.release()
      }
    } catch (paymentsError: any) {
      console.warn('⚠️ Could not create payments table:', paymentsError.message)
      // Don't fail the init if payments table creation fails
    }
    
    // Also ensure role column exists (for existing databases)
    try {
      const { getPool } = await import('@/lib/db')
      const pool = getPool()
      const connection = await pool.getConnection()
      
      try {
        let dbName = process.env.DB_NAME || 'foodsell_manager';
        if (dbName === 'mysql' || dbName === 'information_schema' || dbName === 'performance_schema' || dbName === 'sys') {
          dbName = 'foodsell_manager';
        }

        const [columns] = await connection.query(
          `SELECT COLUMN_NAME 
           FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = ? 
           AND TABLE_NAME = 'users' 
           AND COLUMN_NAME = 'role'`,
          [dbName]
        ) as any[]
        
        if (columns.length === 0) {
          await connection.query(`
            ALTER TABLE users 
            ADD COLUMN role ENUM('user', 'admin', 'super_admin') DEFAULT 'user'
          `)
          console.log('✅ Added role column')
          
          // Add index
          try {
            await connection.query(`CREATE INDEX idx_role ON users(role)`)
            console.log('✅ Added index for role')
          } catch (indexError: any) {
            if (!indexError.message.includes('Duplicate key name')) {
              console.log('Note: idx_role index may already exist')
            }
          }
        } else {
          console.log('✅ role column already exists')
        }
      } finally {
        connection.release()
      }
    } catch (migrationError: any) {
      if (!migrationError.message.includes('Duplicate column name')) {
        console.warn('⚠️ Could not add role column:', migrationError.message)
        // Don't fail the init if migration fails
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Database schema initialized successfully",
      database: process.env.DB_NAME || 'foodsell_manager',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error initializing schema:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        database: process.env.DB_NAME || 'foodsell_manager',
      },
      { status: 500 }
    )
  }
}
