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
    // Validate userId parameter
    const userId = params?.userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      )
    }

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
      // Get user details - handle missing trial_expiration_email_sent column
      let users: any[]
      try {
        [users] = await connection.execute(
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
          [userId]
        ) as any[]
      } catch (error: any) {
        // If column doesn't exist, retry without it
        if (error.message && error.message.includes("trial_expiration_email_sent")) {
          [users] = await connection.execute(
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
              google_id,
              avatar
            FROM users 
            WHERE id = ?`,
            [userId]
          ) as any[]
          // Set default value for missing column
          if (users.length > 0) {
            users[0].trial_expiration_email_sent = false
          }
        } else {
          throw error
        }
      }

      if (users.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }

      // Get user's orders count
      const [ordersCount] = await connection.execute(
        `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`,
        [userId]
      ) as any[]

      // Get user's menu items count
      const [menuItemsCount] = await connection.execute(
        `SELECT COUNT(*) as count FROM menu_items WHERE user_id = ?`,
        [userId]
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
        [userId]
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
    // Validate userId parameter
    const userId = params?.userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      )
    }

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
      const queryParams: any[] = []

      if (name !== undefined && name !== null) {
        updates.push("name = ?")
        queryParams.push(name)
      }
      if (email !== undefined && email !== null) {
        updates.push("email = ?")
        queryParams.push(email.toLowerCase())
      }
      if (subscription_status !== undefined && subscription_status !== null) {
        updates.push("subscription_status = ?")
        queryParams.push(subscription_status)
      }
      if (subscription_end_date !== undefined) {
        updates.push("subscription_end_date = ?")
        // Convert empty string to null for SQL
        queryParams.push(subscription_end_date === "" ? null : subscription_end_date)
      }
      if (subscription_plan !== undefined) {
        updates.push("subscription_plan = ?")
        // Convert empty string to null for SQL
        queryParams.push(subscription_plan === "" ? null : subscription_plan)
      }
      if (trial_start_date !== undefined) {
        updates.push("trial_start_date = ?")
        // Convert empty string to null for SQL
        queryParams.push(trial_start_date === "" ? null : trial_start_date)
      }
      if (role !== undefined && role !== null) {
        // Prevent changing super_admin role
        if (role !== 'super_admin') {
          updates.push("role = ?")
          queryParams.push(role)
        }
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 }
        )
      }

      // Add userId at the end for WHERE clause
      queryParams.push(userId)

      await connection.execute(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        queryParams
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
        [userId]
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
