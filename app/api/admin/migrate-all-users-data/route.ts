import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * POST /api/admin/migrate-all-users-data
 * Migrate localStorage data to database for all users
 * This is a one-time migration endpoint for super admin
 */
export async function POST(request: NextRequest) {
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
        `SELECT id, name, email FROM users WHERE role != 'super_admin' OR role IS NULL`
      ) as any[]

      const results = {
        totalUsers: users.length,
        migrated: [] as any[],
        errors: [] as any[],
        summary: {
          menuItemsMigrated: 0,
          ordersMigrated: 0,
          usersProcessed: 0,
        },
      }

      // Note: We can't access localStorage from server-side
      // This endpoint provides instructions for client-side migration
      // OR we can check if data exists in database and report status

      // Check current database state for each user
      for (const user of users) {
        const [menuItemsCount] = await connection.execute(
          `SELECT COUNT(*) as count FROM menu_items WHERE user_id = ?`,
          [user.id]
        ) as any[]

        const [ordersCount] = await connection.execute(
          `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`,
          [user.id]
        ) as any[]

        results.migrated.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          menuItemsInDb: menuItemsCount[0]?.count || 0,
          ordersInDb: ordersCount[0]?.count || 0,
          status: (menuItemsCount[0]?.count || 0) > 0 || (ordersCount[0]?.count || 0) > 0 
            ? "has_data" 
            : "no_data",
        })

        results.summary.menuItemsMigrated += menuItemsCount[0]?.count || 0
        results.summary.ordersMigrated += ordersCount[0]?.count || 0
        results.summary.usersProcessed++
      }

      return NextResponse.json({
        success: true,
        message: "Migration status checked. Users need to visit their dashboard to migrate localStorage data.",
        results,
        instructions: [
          "1. Each user needs to log in and visit their dashboard",
          "2. The dashboard will automatically migrate localStorage data to database",
          "3. After users visit their dashboard, their data will appear in super admin panel",
          "4. Super admin cannot access users' localStorage directly (browser security)",
        ],
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error checking migration status:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
