import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
import { getPool } from "@/lib/db"
import { getMenuItems, getOrders } from "@/lib/db-store"

/**
 * GET /api/debug/check-user-data
 * Check what data exists for the current user in the database
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
      // Get user info
      const [users] = await connection.query(
        `SELECT id, name, email, created_at FROM users WHERE id = ?`,
        [session.userId]
      ) as any[]

      if (users.length === 0) {
        return NextResponse.json({
          error: "User not found in database",
          userId: session.userId,
        }, { status: 404 })
      }

      // Get menu items directly from database
      const [menuItemsDb] = await connection.query(
        `SELECT id, name, price, category, created_at 
         FROM menu_items 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [session.userId]
      ) as any[]

      // Get menu items via db-store function
      const menuItemsViaFunction = await getMenuItems(session.userId)

      // Get orders directly from database
      const [ordersDb] = await connection.query(
        `SELECT id, order_number, total_amount, final_amount, created_at 
         FROM orders 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [session.userId]
      ) as any[]

      // Get orders via db-store function
      const ordersViaFunction = await getOrders(session.userId)

      return NextResponse.json({
        user: users[0],
        menuItems: {
          inDatabase: menuItemsDb.length,
          viaFunction: menuItemsViaFunction.length,
          databaseItems: menuItemsDb,
          functionItems: menuItemsViaFunction,
          match: menuItemsDb.length === menuItemsViaFunction.length,
        },
        orders: {
          inDatabase: ordersDb.length,
          viaFunction: ordersViaFunction.length,
          databaseOrders: ordersDb,
          functionOrders: ordersViaFunction,
          match: ordersDb.length === ordersViaFunction.length,
        },
        timestamp: new Date().toISOString(),
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error checking user data:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
