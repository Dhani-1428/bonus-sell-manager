import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/check-all-users-data
 * Check data status for all users in database
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    let sessionId = cookieStore.get("admin_session")?.value

    if (!sessionId) {
      sessionId = cookieStore.get("session")?.value
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Verify super admin
    const isAdmin = await isSuperAdmin(sessionId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      )
    }

    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      // Get all users
      const [users] = await connection.execute(
        `SELECT id, name, email, created_at FROM users WHERE (role != 'super_admin' OR role IS NULL) ORDER BY created_at DESC`
      ) as any[]

      const usersWithData = []

      for (const user of users) {
        const [menuItemsCount] = await connection.execute(
          `SELECT COUNT(*) as count FROM menu_items WHERE user_id = ?`,
          [user.id]
        ) as any[]

        const [ordersCount] = await connection.execute(
          `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`,
          [user.id]
        ) as any[]

        const [settingsCount] = await connection.execute(
          `SELECT COUNT(*) as count FROM restaurant_settings WHERE user_id = ?`,
          [user.id]
        ) as any[]

        usersWithData.push({
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          menuItems: menuItemsCount[0]?.count || 0,
          orders: ordersCount[0]?.count || 0,
          settings: settingsCount[0]?.count || 0,
          hasData: (menuItemsCount[0]?.count || 0) > 0 || (ordersCount[0]?.count || 0) > 0,
        })
      }

      // Get totals
      const [totalMenuItems] = await connection.execute(
        `SELECT COUNT(*) as count FROM menu_items`
      ) as any[]

      const [totalOrders] = await connection.execute(
        `SELECT COUNT(*) as count FROM orders`
      ) as any[]

      return NextResponse.json({
        totalUsers: users.length,
        usersWithData: usersWithData.filter(u => u.hasData).length,
        usersWithoutData: usersWithData.filter(u => !u.hasData).length,
        totalMenuItems: totalMenuItems[0]?.count || 0,
        totalOrders: totalOrders[0]?.count || 0,
        users: usersWithData,
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error checking all users data:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
