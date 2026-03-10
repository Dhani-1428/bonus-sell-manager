import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
import { getPool } from "@/lib/db"

/**
 * GET /api/debug/check-tables
 * Check if all required tables exist in the database
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }

    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      const dbName = process.env.DB_NAME || 'foodsell_manager'
      
      // Required tables
      const requiredTables = [
        'users',
        'menu_items',
        'orders',
        'restaurant_settings',
        'payments'
      ]

      // Get all tables in database
      const [tables] = await connection.query(
        `SELECT TABLE_NAME 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_TYPE = 'BASE TABLE'`,
        [dbName]
      ) as any[]

      const existingTableNames = tables.map((t: any) => t.TABLE_NAME)
      
      // Check which tables exist
      const tableStatus: Record<string, { exists: boolean; columns?: string[]; rowCount?: number }> = {}
      
      for (const tableName of requiredTables) {
        const exists = existingTableNames.includes(tableName)
        tableStatus[tableName] = { exists }
        
        if (exists) {
          // Get column names
          const [columns] = await connection.query(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? 
             AND TABLE_NAME = ? 
             ORDER BY ORDINAL_POSITION`,
            [dbName, tableName]
          ) as any[]
          tableStatus[tableName].columns = columns.map((c: any) => c.COLUMN_NAME)
          
          // Get row count
          const [countResult] = await connection.query(
            `SELECT COUNT(*) as count FROM ??`,
            [tableName]
          ) as any[]
          tableStatus[tableName].rowCount = countResult[0]?.count || 0
        }
      }

      // Check for missing tables
      const missingTables = requiredTables.filter(
        table => !existingTableNames.includes(table)
      )

      return NextResponse.json({
        database: dbName,
        tables: tableStatus,
        missingTables,
        allTablesExist: missingTables.length === 0,
        message: missingTables.length > 0 
          ? `Missing tables: ${missingTables.join(', ')}. Visit /api/db/init to create them.`
          : 'All required tables exist.',
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
