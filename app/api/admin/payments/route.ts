import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/payments
 * Get all payments (super admin only)
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
      const searchParams = request.nextUrl.searchParams
      const page = parseInt(searchParams.get("page") || "1")
      const limit = parseInt(searchParams.get("limit") || "50")
      const offset = (page - 1) * limit
      const statusFilter = searchParams.get("status") || ""

      let query = `
        SELECT 
          p.id,
          p.user_id,
          p.amount,
          p.currency,
          p.plan,
          p.status,
          p.created_at,
          p.updated_at,
          p.approved_by,
          p.notes,
          p.stripe_session_id,
          p.stripe_payment_intent_id,
          u.name as user_name,
          u.email as user_email
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE 1=1
      `
      const params: any[] = []

      if (statusFilter) {
        query += ` AND p.status = ?`
        params.push(statusFilter)
      }

      // Use template literals for LIMIT/OFFSET to avoid parameter issues
      query += ` ORDER BY p.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`

      const [payments] = await connection.execute(query, params) as any[]

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM payments WHERE 1=1`
      const countParams: any[] = []

      if (statusFilter) {
        countQuery += ` AND status = ?`
        countParams.push(statusFilter)
      }

      const [countResult] = await connection.execute(countQuery, countParams) as any[]
      const total = countResult[0]?.total || 0

      return NextResponse.json({
        payments,
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
    console.error("Error getting payments:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get payments" },
      { status: 500 }
    )
  }
}
