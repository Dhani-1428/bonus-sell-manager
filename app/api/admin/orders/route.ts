import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/orders
 * Get all orders from all users (super admin only)
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
      const searchParams = request.nextUrl.searchParams
      const page = parseInt(searchParams.get("page") || "1")
      const limit = parseInt(searchParams.get("limit") || "50")
      const offset = (page - 1) * limit
      const search = searchParams.get("search") || ""
      const userIdFilter = searchParams.get("userId") || ""
      const statusFilter = searchParams.get("status") || ""

      let query = `
        SELECT 
          o.id,
          o.user_id,
          o.order_number,
          o.date,
          o.items,
          o.total_amount,
          o.discount_amount,
          o.final_amount,
          o.payment_method,
          o.created_at,
          u.name as user_name,
          u.email as user_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE 1=1
      `
      const params: any[] = []

      if (search) {
        query += ` AND (o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`
        params.push(`%${search}%`, `%${search}%`, `%${search}%`)
      }

      if (userIdFilter) {
        query += ` AND o.user_id = ?`
        params.push(userIdFilter)
      }

      if (statusFilter) {
        query += ` AND o.payment_method = ?`
        params.push(statusFilter)
      }

      query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
      params.push(limit, offset)

      const [orders] = await connection.execute(query, params) as any[]

      // Parse items JSON
      const ordersWithParsedItems = orders.map((order: any) => ({
        ...order,
        items: order.items ? JSON.parse(order.items) : [],
      }))

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE 1=1
      `
      const countParams: any[] = []

      if (search) {
        countQuery += ` AND (o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
      }

      if (userIdFilter) {
        countQuery += ` AND o.user_id = ?`
        countParams.push(userIdFilter)
      }

      if (statusFilter) {
        countQuery += ` AND o.payment_method = ?`
        countParams.push(statusFilter)
      }

      const [countResult] = await connection.execute(countQuery, countParams) as any[]
      const total = countResult[0]?.total || 0

      return NextResponse.json({
        orders: ordersWithParsedItems,
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
    console.error("Error getting orders:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get orders" },
      { status: 500 }
    )
  }
}
