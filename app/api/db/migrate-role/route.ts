import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"

/**
 * POST /api/db/migrate-role
 * Add role column to users table if it doesn't exist
 */
export async function POST() {
  try {
    let dbName = process.env.DB_NAME || 'foodsell_manager';
    
    // Prevent using MySQL system database
    if (dbName === 'mysql' || dbName === 'information_schema' || dbName === 'performance_schema' || dbName === 'sys') {
      console.warn(`⚠️  Warning: Database name '${dbName}' is a MySQL system database. Using 'foodsell_manager' instead.`);
      dbName = 'foodsell_manager';
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      // Check if role column exists
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'role'`,
        [dbName]
      ) as any[]
      
      if (columns.length > 0) {
        return NextResponse.json({
          success: true,
          message: "Role column already exists",
          database: dbName,
        })
      }

      // Add role column
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN role ENUM('user', 'admin', 'super_admin') DEFAULT 'user'
      `)
      console.log('✅ Added role column')

      // Add index for role if it doesn't exist
      try {
        await connection.query(`
          CREATE INDEX idx_role ON users(role)
        `)
        console.log('✅ Added index for role')
      } catch (indexError: any) {
        if (!indexError.message.includes('Duplicate key name')) {
          console.log('Note: idx_role index may already exist')
        }
      }

      // Update existing users to have 'user' role if they don't have one
      await connection.query(`
        UPDATE users SET role = 'user' WHERE role IS NULL
      `)

      return NextResponse.json({
        success: true,
        message: "Role column added successfully",
        database: dbName,
        timestamp: new Date().toISOString(),
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error adding role column:", error)
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

export async function GET() {
  return POST()
}
