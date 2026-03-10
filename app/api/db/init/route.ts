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
