import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
import { getPool } from "@/lib/db"

/**
 * POST /api/debug/trace-save
 * Trace a menu item or order save operation in real-time
 * Call this immediately after saving to see if data was persisted
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, itemId, orderId } = body

    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      if (type === 'menu_item' && itemId) {
        // Check if menu item exists
        const [items] = await connection.query(
          `SELECT * FROM menu_items WHERE id = ? AND user_id = ?`,
          [itemId, session.userId]
        ) as any[]

        // Also check all menu items for this user
        const [allItems] = await connection.query(
          `SELECT id, name, price, category, created_at 
           FROM menu_items 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 10`,
          [session.userId]
        ) as any[]

        return NextResponse.json({
          found: items.length > 0,
          item: items.length > 0 ? items[0] : null,
          allItemsCount: allItems.length,
          recentItems: allItems,
          userId: session.userId,
          searchedId: itemId,
        })
      } else if (type === 'order' && orderId) {
        // Check if order exists
        const [orders] = await connection.query(
          `SELECT * FROM orders WHERE id = ? AND user_id = ?`,
          [orderId, session.userId]
        ) as any[]

        // Also check all orders for this user
        const [allOrders] = await connection.query(
          `SELECT id, order_number, total_amount, final_amount, created_at 
           FROM orders 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 10`,
          [session.userId]
        ) as any[]

        return NextResponse.json({
          found: orders.length > 0,
          order: orders.length > 0 ? orders[0] : null,
          allOrdersCount: allOrders.length,
          recentOrders: allOrders,
          userId: session.userId,
          searchedId: orderId,
        })
      } else {
        // Get counts for both
        const [menuItemsCount] = await connection.query(
          `SELECT COUNT(*) as count FROM menu_items WHERE user_id = ?`,
          [session.userId]
        ) as any[]

        const [ordersCount] = await connection.query(
          `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`,
          [session.userId]
        ) as any[]

        const [recentItems] = await connection.query(
          `SELECT id, name, price, category, created_at 
           FROM menu_items 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 5`,
          [session.userId]
        ) as any[]

        const [recentOrders] = await connection.query(
          `SELECT id, order_number, total_amount, final_amount, created_at 
           FROM orders 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 5`,
          [session.userId]
        ) as any[]

        return NextResponse.json({
          menuItemsCount: menuItemsCount[0]?.count || 0,
          ordersCount: ordersCount[0]?.count || 0,
          recentItems,
          recentOrders,
          userId: session.userId,
        })
      }
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error tracing save:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
