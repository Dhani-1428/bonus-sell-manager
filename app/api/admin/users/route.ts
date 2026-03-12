import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/users
 * Get all users (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    let sessionId = cookieStore.get("admin_session")?.value

    // If no admin_session, check regular session cookie
    // This allows super_admins to access admin panel after logging in via Google or email/password
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
      // Get query parameters
      const searchParams = request.nextUrl.searchParams
      const page = parseInt(searchParams.get("page") || "1")
      const limit = parseInt(searchParams.get("limit") || "50")
      const offset = (page - 1) * limit
      const search = searchParams.get("search") || ""
      const statusFilter = searchParams.get("status") || ""

      // Try to query with trial_expiration_email_sent, fallback if column doesn't exist
      // Use subqueries instead of GROUP BY with JOINs to avoid issues
      let query = `
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.created_at,
          u.trial_start_date,
          u.subscription_status,
          u.subscription_end_date,
          u.subscription_plan,
          u.role,
          u.trial_expiration_email_sent,
          COALESCE((SELECT COUNT(*) FROM menu_items mi WHERE mi.user_id = u.id), 0) as menu_items_count,
          COALESCE((SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id), 0) as orders_count
        FROM users u
        WHERE (u.role != 'super_admin' OR u.role IS NULL)
      `
      const params: any[] = []

      if (search) {
        query += ` AND (u.name LIKE ? OR u.email LIKE ?)`
        params.push(`%${search}%`, `%${search}%`)
      }

      if (statusFilter) {
        query += ` AND u.subscription_status = ?`
        params.push(statusFilter)
      }

      // Use template literals for LIMIT/OFFSET to avoid parameter issues
      query += ` ORDER BY u.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`

      let users: any[] = []
      try {
        console.log('Executing query:', query)
        console.log('With params:', params)
        const result = await connection.execute(query, params) as any[]
        users = Array.isArray(result[0]) ? result[0] : []
        console.log('Query result:', users.length, 'users found')
      } catch (error: any) {
        console.error('Query execution error:', error)
        // If column doesn't exist, retry without it
        if (error.message && (error.message.includes("trial_expiration_email_sent") || error.message.includes("Unknown column 'role'"))) {
          // If role column doesn't exist, get all users (no role filtering)
          // Use subqueries instead of GROUP BY with JOINs to avoid issues
          let fallbackQuery = `
            SELECT 
              u.id, 
              u.name, 
              u.email, 
              u.created_at,
              u.trial_start_date,
              u.subscription_status,
              u.subscription_end_date,
              u.subscription_plan,
              COALESCE((SELECT COUNT(*) FROM menu_items mi WHERE mi.user_id = u.id), 0) as menu_items_count,
              COALESCE((SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id), 0) as orders_count
            FROM users u
            WHERE 1=1
          `
          const fallbackParams: any[] = []
          
          if (search) {
            fallbackQuery += ` AND (u.name LIKE ? OR u.email LIKE ?)`
            fallbackParams.push(`%${search}%`, `%${search}%`)
          }

          if (statusFilter) {
            fallbackQuery += ` AND u.subscription_status = ?`
            fallbackParams.push(statusFilter)
          }

          // Use template literals for LIMIT/OFFSET to avoid parameter issues
          fallbackQuery += ` ORDER BY u.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`
          
          try {
            const fallbackResult = await connection.execute(fallbackQuery, fallbackParams) as any[]
            users = Array.isArray(fallbackResult[0]) ? fallbackResult[0] : []
          } catch (fallbackError: any) {
            console.error('Fallback query error:', fallbackError)
            users = []
          }
          // Set default values for missing columns
          users = (users || []).map((u: any) => {
            if (!u || typeof u !== 'object') {
              return null
            }
            return {
              id: u.id || '',
              name: u.name || '',
              email: u.email || '',
              created_at: u.created_at || new Date().toISOString(),
              trial_start_date: u.trial_start_date || null,
              subscription_status: u.subscription_status || 'trial',
              subscription_end_date: u.subscription_end_date || null,
              subscription_plan: u.subscription_plan || null,
              trial_expiration_email_sent: false,
              role: 'user',
              menu_items_count: Number(u.menu_items_count) || 0,
              orders_count: Number(u.orders_count) || 0,
            }
          }).filter((u: any) => u !== null)
        } else {
          throw error
        }
      }

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM users u WHERE (u.role != 'super_admin' OR u.role IS NULL)`
      const countParams: any[] = []

      if (search) {
        countQuery += ` AND (u.name LIKE ? OR u.email LIKE ?)`
        countParams.push(`%${search}%`, `%${search}%`)
      }

      if (statusFilter) {
        countQuery += ` AND u.subscription_status = ?`
        countParams.push(statusFilter)
      }

      let total = 0
      try {
        const [countResult] = await connection.execute(countQuery, countParams) as any[]
        total = countResult[0]?.total || 0
      } catch (countError: any) {
        // If role column doesn't exist, count all users
        if (countError.message && countError.message.includes("Unknown column 'role'")) {
          console.warn('⚠️  Role column not found. Counting all users. Run /api/db/migrate-role to add it.');
          let fallbackCountQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`
          const fallbackParams: any[] = []
          
          if (search) {
            fallbackCountQuery += ` AND (u.name LIKE ? OR u.email LIKE ?)`
            fallbackParams.push(`%${search}%`, `%${search}%`)
          }

          if (statusFilter) {
            fallbackCountQuery += ` AND u.subscription_status = ?`
            fallbackParams.push(statusFilter)
          }

          const [fallbackCountResult] = await connection.execute(fallbackCountQuery, fallbackParams) as any[]
          total = fallbackCountResult[0]?.total || 0
        } else {
          throw countError
        }
      }

      // Ensure users is always an array
      if (!Array.isArray(users)) {
        console.error('Users is not an array:', users)
        users = []
      }

      // Ensure counts are numbers and handle undefined/null values
      const usersWithCounts = (users || []).map((u: any) => {
        // Skip if user is null/undefined
        if (!u || typeof u !== 'object') {
          return null
        }

        // Safely extract all user properties
        const userData: any = {
          id: u.id || '',
          name: u.name || '',
          email: u.email || '',
          created_at: u.created_at || new Date().toISOString(),
          trial_start_date: u.trial_start_date || null,
          subscription_status: u.subscription_status || 'trial',
          subscription_end_date: u.subscription_end_date || null,
          subscription_plan: u.subscription_plan || null,
          role: u.role || 'user',
          trial_expiration_email_sent: Boolean(u.trial_expiration_email_sent),
          menu_items_count: Number(u.menu_items_count) || 0,
          orders_count: Number(u.orders_count) || 0,
        }
        return userData
      }).filter((u: any) => u !== null) // Remove any null entries

      // Calculate summary safely
      const validUsers = Array.isArray(usersWithCounts) ? usersWithCounts : []
      const summary = {
        totalUsers: Number(total) || 0,
        usersWithMenuItems: validUsers.filter((u: any) => u && Number(u.menu_items_count) > 0).length,
        usersWithOrders: validUsers.filter((u: any) => u && Number(u.orders_count) > 0).length,
        totalMenuItems: validUsers.reduce((sum: number, u: any) => {
          return sum + (u ? (Number(u.menu_items_count) || 0) : 0)
        }, 0),
        totalOrders: validUsers.reduce((sum: number, u: any) => {
          return sum + (u ? (Number(u.orders_count) || 0) : 0)
        }, 0),
      }

      return NextResponse.json({
        users: validUsers,
        pagination: {
          page: Number(page) || 1,
          limit: Number(limit) || 50,
          total: Number(total) || 0,
          totalPages: Math.ceil((Number(total) || 0) / (Number(limit) || 50)),
        },
        summary,
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error getting users:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get users" },
      { status: 500 }
    )
  }
}
