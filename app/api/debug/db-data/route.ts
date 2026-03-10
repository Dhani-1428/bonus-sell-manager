import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
import { getPool } from "@/lib/db"

/**
 * GET /api/debug/db-data
 * Debug endpoint to check what data is in the database
 * Shows all tables and their row counts
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
      
      // Get table names
      const [tables] = await connection.query(
        `SELECT TABLE_NAME 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_TYPE = 'BASE TABLE'`,
        [dbName]
      ) as any[]

      const tableData: Record<string, any> = {}

      // Get data from each table
      for (const table of tables) {
        const tableName = table.TABLE_NAME
        
        // Get row count
        const [countResult] = await connection.query(
          `SELECT COUNT(*) as count FROM ??`,
          [tableName]
        ) as any[]
        const count = countResult[0]?.count || 0

        // Get sample data (limit to 5 rows)
        let sampleData: any[] = []
        if (count > 0) {
          if (tableName === 'users') {
            const [users] = await connection.query(
              `SELECT id, name, email, role, subscription_status, created_at 
               FROM users 
               LIMIT 5`
            ) as any[]
            sampleData = users
          } else if (tableName === 'menu_items') {
            const [items] = await connection.query(
              `SELECT id, user_id, name, price, category, created_at 
               FROM menu_items 
               LIMIT 5`
            ) as any[]
            sampleData = items
          } else if (tableName === 'orders') {
            const [orders] = await connection.query(
              `SELECT id, user_id, order_number, total_amount, final_amount, created_at 
               FROM orders 
               LIMIT 5`
            ) as any[]
            sampleData = orders
          } else if (tableName === 'restaurant_settings') {
            const [settings] = await connection.query(
              `SELECT user_id, name, address, contact_number 
               FROM restaurant_settings 
               LIMIT 5`
            ) as any[]
            sampleData = settings
          } else if (tableName === 'payments') {
            const [payments] = await connection.query(
              `SELECT id, user_id, amount, status, created_at 
               FROM payments 
               LIMIT 5`
            ) as any[]
            sampleData = payments
          }
        }

        tableData[tableName] = {
          count,
          sample: sampleData,
        }
      }

      // Get current user's data specifically
      const userData: Record<string, any> = {}
      
      // User's menu items
      const [userMenuItems] = await connection.query(
        `SELECT COUNT(*) as count FROM menu_items WHERE user_id = ?`,
        [session.userId]
      ) as any[]
      userData.menuItems = userMenuItems[0]?.count || 0

      // User's orders
      const [userOrders] = await connection.query(
        `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`,
        [session.userId]
      ) as any[]
      userData.orders = userOrders[0]?.count || 0

      // User's restaurant settings
      const [userSettings] = await connection.query(
        `SELECT * FROM restaurant_settings WHERE user_id = ?`,
        [session.userId]
      ) as any[]
      userData.restaurantSettings = userSettings[0] || null

      // User's payments
      const [userPayments] = await connection.query(
        `SELECT COUNT(*) as count FROM payments WHERE user_id = ?`,
        [session.userId]
      ) as any[]
      userData.payments = userPayments[0]?.count || 0

      return NextResponse.json({
        database: dbName,
        currentUser: {
          userId: session.userId,
          email: session.email,
          name: session.name,
        },
        tables: tableData,
        userData,
        timestamp: new Date().toISOString(),
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error checking database data:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
