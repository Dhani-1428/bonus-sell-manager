import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/users/[userId]
 * Get specific user details (super admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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
      // Get user details
      const [users] = await connection.execute(
        `SELECT 
          id, 
          name, 
          email, 
          created_at,
          trial_start_date,
          subscription_status,
          subscription_end_date,
          subscription_plan,
          role,
          trial_expiration_email_sent,
          google_id,
          avatar
        FROM users 
        WHERE id = ?`,
        [params.userId]
      ) as any[]

      if (users.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }

      // Get user's orders count
      const [ordersCount] = await connection.execute(
        `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`,
        [params.userId]
      ) as any[]

      // Get user's menu items count
      const [menuItemsCount] = await connection.execute(
        `SELECT COUNT(*) as count FROM menu_items WHERE user_id = ?`,
        [params.userId]
      ) as any[]

      // Get user's payments
      const [payments] = await connection.execute(
        `SELECT 
          id,
          amount,
          currency,
          plan,
          status,
          created_at,
          updated_at,
          approved_by,
          notes
        FROM payments 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10`,
        [params.userId]
      ) as any[]

      return NextResponse.json({
        user: users[0],
        stats: {
          ordersCount: ordersCount[0]?.count || 0,
          menuItemsCount: menuItemsCount[0]?.count || 0,
        },
        recentPayments: payments,
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error getting user:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get user" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/users/[userId]
 * Update user (super admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const body = await request.json()
    const {
      name,
      email,
      subscription_status,
      subscription_end_date,
      subscription_plan,
      trial_start_date,
      role,
    } = body

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      // Build update query dynamically
      const updates: string[] = []
      const params: any[] = []

      if (name !== undefined) {
        updates.push("name = ?")
        params.push(name)
      }
      if (email !== undefined) {
        updates.push("email = ?")
        params.push(email.toLowerCase())
      }
      if (subscription_status !== undefined) {
        updates.push("subscription_status = ?")
        params.push(subscription_status)
      }
      if (subscription_end_date !== undefined) {
        updates.push("subscription_end_date = ?")
        params.push(subscription_end_date)
      }
      if (subscription_plan !== undefined) {
        updates.push("subscription_plan = ?")
        params.push(subscription_plan)
      }
      if (trial_start_date !== undefined) {
        updates.push("trial_start_date = ?")
        params.push(trial_start_date)
      }
      if (role !== undefined) {
        // Prevent changing super_admin role
        if (role !== 'super_admin') {
          updates.push("role = ?")
          params.push(role)
        }
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 }
        )
      }

      params.push(params.userId)

      await connection.execute(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        params
      )

      // Get updated user
      const [users] = await connection.execute(
        `SELECT 
          id, 
          name, 
          email, 
          created_at,
          trial_start_date,
          subscription_status,
          subscription_end_date,
          subscription_plan,
          role
        FROM users 
        WHERE id = ?`,
        [params.userId]
      ) as any[]

      return NextResponse.json({
        success: true,
        user: users[0],
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    )
  }
}
