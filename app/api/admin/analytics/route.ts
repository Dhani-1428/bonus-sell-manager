import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/analytics
 * Get analytics data for super admin
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
      // Get total users
      const [usersCount] = await connection.query(
        `SELECT COUNT(*) as count FROM users WHERE role != 'super_admin'`
      ) as any[]

      // Get active subscriptions
      const [activeSubs] = await connection.query(
        `SELECT COUNT(*) as count FROM users WHERE subscription_status = 'active' AND role != 'super_admin'`
      ) as any[]

      // Get total revenue from completed/approved payments
      const [revenue] = await connection.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status IN ('completed', 'approved')`
      ) as any[]

      // Get total orders
      const [ordersCount] = await connection.query(
        `SELECT COUNT(*) as count FROM orders`
      ) as any[]

      // Get total menu items
      const [menuItemsCount] = await connection.query(
        `SELECT COUNT(*) as count FROM menu_items`
      ) as any[]

      // Get revenue by month (last 6 months)
      const [revenueByMonth] = await connection.query(
        `SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COALESCE(SUM(amount), 0) as revenue
        FROM payments
        WHERE status IN ('completed', 'approved')
          AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC`
      ) as any[]

      // Get orders by month (last 6 months)
      const [ordersByMonth] = await connection.query(
        `SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as orders
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC`
      ) as any[]

      // Get top users by revenue
      const [topUsers] = await connection.query(
        `SELECT 
          u.name,
          u.email,
          COUNT(DISTINCT o.id) as orders,
          COALESCE(SUM(p.amount), 0) as revenue
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        LEFT JOIN payments p ON u.id = p.user_id AND p.status IN ('completed', 'approved')
        WHERE u.role != 'super_admin'
        GROUP BY u.id, u.name, u.email
        ORDER BY revenue DESC
        LIMIT 10`
      ) as any[]

      return NextResponse.json({
        totalUsers: usersCount[0]?.count || 0,
        activeSubscriptions: activeSubs[0]?.count || 0,
        totalRevenue: parseFloat(revenue[0]?.total || 0),
        totalOrders: ordersCount[0]?.count || 0,
        totalMenuItems: menuItemsCount[0]?.count || 0,
        revenueByMonth: revenueByMonth.map((r: any) => ({
          month: r.month,
          revenue: parseFloat(r.revenue || 0),
        })),
        ordersByMonth: ordersByMonth.map((o: any) => ({
          month: o.month,
          orders: parseInt(o.orders || 0),
        })),
        topUsers: topUsers.map((u: any) => ({
          name: u.name,
          email: u.email,
          orders: parseInt(u.orders || 0),
          revenue: parseFloat(u.revenue || 0),
        })),
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
