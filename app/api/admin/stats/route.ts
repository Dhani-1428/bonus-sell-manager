import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/stats
 * Get comprehensive admin statistics including all data counts
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("admin_session")?.value

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
      // Get all statistics in parallel
      const [
        [usersCount],
        [paymentsCount],
        [menuItemsCount],
        [ordersCount],
        [settingsCount],
        [activeSubscriptions],
        [totalRevenueResult],
        [pendingPayments],
      ] = await Promise.all([
        connection.execute("SELECT COUNT(*) as count FROM users WHERE role != 'super_admin'") as Promise<any[]>,
        connection.execute("SELECT COUNT(*) as count FROM payments") as Promise<any[]>,
        connection.execute("SELECT COUNT(*) as count FROM menu_items") as Promise<any[]>,
        connection.execute("SELECT COUNT(*) as count FROM orders") as Promise<any[]>,
        connection.execute("SELECT COUNT(*) as count FROM restaurant_settings") as Promise<any[]>,
        connection.execute("SELECT COUNT(*) as count FROM users WHERE subscription_status = 'active' AND role != 'super_admin'") as Promise<any[]>,
        connection.execute(`
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM payments 
          WHERE status IN ('completed', 'approved')
        `) as Promise<any[]>,
        connection.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'pending'") as Promise<any[]>,
      ])

      return NextResponse.json({
        stats: {
          totalUsers: usersCount[0]?.count || 0,
          activeSubscriptions: activeSubscriptions[0]?.count || 0,
          totalPayments: paymentsCount[0]?.count || 0,
          pendingPayments: pendingPayments[0]?.count || 0,
          totalMenuItems: menuItemsCount[0]?.count || 0,
          totalOrders: ordersCount[0]?.count || 0,
          totalRestaurantSettings: settingsCount[0]?.count || 0,
          totalRevenue: parseFloat(totalRevenueResult[0]?.total?.toString() || "0"),
        },
        timestamp: new Date().toISOString(),
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error getting admin stats:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get stats" },
      { status: 500 }
    )
  }
}
