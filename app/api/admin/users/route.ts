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
      // Get query parameters
      const searchParams = request.nextUrl.searchParams
      const page = parseInt(searchParams.get("page") || "1")
      const limit = parseInt(searchParams.get("limit") || "50")
      const offset = (page - 1) * limit
      const search = searchParams.get("search") || ""
      const statusFilter = searchParams.get("status") || ""

      // Try to query with trial_expiration_email_sent, fallback if column doesn't exist
      let query = `
        SELECT 
          id, 
          name, 
          email, 
          created_at,
          trial_start_date,
          subscription_status,
          subscription_end_date,
          subscription_plan,
          role,
          trial_expiration_email_sent
        FROM users
        WHERE role != 'super_admin'
      `
      const params: any[] = []

      if (search) {
        query += ` AND (name LIKE ? OR email LIKE ?)`
        params.push(`%${search}%`, `%${search}%`)
      }

      if (statusFilter) {
        query += ` AND subscription_status = ?`
        params.push(statusFilter)
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
      params.push(limit, offset)

      let users: any[]
      try {
        [users] = await connection.execute(query, params) as any[]
      } catch (error: any) {
        // If column doesn't exist, retry without it
        if (error.message && (error.message.includes("trial_expiration_email_sent") || error.message.includes("Unknown column 'role'"))) {
          // If role column doesn't exist, get all users (no role filtering)
          let fallbackQuery = `
            SELECT 
              id, 
              name, 
              email, 
              created_at,
              trial_start_date,
              subscription_status,
              subscription_end_date,
              subscription_plan
            FROM users
            WHERE 1=1
          `
          const fallbackParams: any[] = []
          
          if (search) {
            fallbackQuery += ` AND (name LIKE ? OR email LIKE ?)`
            fallbackParams.push(`%${search}%`, `%${search}%`)
          }

          if (statusFilter) {
            fallbackQuery += ` AND subscription_status = ?`
            fallbackParams.push(statusFilter)
          }

          fallbackQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
          fallbackParams.push(limit, offset)
          
          [users] = await connection.execute(fallbackQuery, fallbackParams) as any[]
          // Set default values for missing columns
          users = users.map((u: any) => ({ 
            ...u, 
            trial_expiration_email_sent: false,
            role: 'user'
          }))
        } else {
          throw error
        }
      }

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM users WHERE role != 'super_admin'`
      const countParams: any[] = []

      if (search) {
        countQuery += ` AND (name LIKE ? OR email LIKE ?)`
        countParams.push(`%${search}%`, `%${search}%`)
      }

      if (statusFilter) {
        countQuery += ` AND subscription_status = ?`
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
          let fallbackCountQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`
          const fallbackParams: any[] = []
          
          if (search) {
            fallbackCountQuery += ` AND (name LIKE ? OR email LIKE ?)`
            fallbackParams.push(`%${search}%`, `%${search}%`)
          }

          if (statusFilter) {
            fallbackCountQuery += ` AND subscription_status = ?`
            fallbackParams.push(statusFilter)
          }

          const [fallbackCountResult] = await connection.execute(fallbackCountQuery, fallbackParams) as any[]
          total = fallbackCountResult[0]?.total || 0
        } else {
          throw countError
        }
      }

      return NextResponse.json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
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
