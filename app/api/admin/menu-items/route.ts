import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/menu-items
 * Get all menu items from all users (super admin only)
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
      const categoryFilter = searchParams.get("category") || ""

      let query = `
        SELECT 
          m.id,
          m.user_id,
          m.name,
          m.price,
          m.category,
          m.extras,
          m.created_at,
          u.name as user_name,
          u.email as user_email
        FROM menu_items m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE 1=1
      `
      const params: any[] = []

      if (search) {
        query += ` AND (m.name LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`
        params.push(`%${search}%`, `%${search}%`, `%${search}%`)
      }

      if (userIdFilter) {
        query += ` AND m.user_id = ?`
        params.push(userIdFilter)
      }

      if (categoryFilter) {
        query += ` AND m.category = ?`
        params.push(categoryFilter)
      }

      query += ` ORDER BY m.created_at DESC LIMIT ? OFFSET ?`
      params.push(limit, offset)

      const [menuItems] = await connection.execute(query, params) as any[]

      // Parse extras JSON
      const itemsWithParsedExtras = menuItems.map((item: any) => ({
        ...item,
        extras: item.extras ? JSON.parse(item.extras) : null,
      }))

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM menu_items m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE 1=1
      `
      const countParams: any[] = []

      if (search) {
        countQuery += ` AND (m.name LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
      }

      if (userIdFilter) {
        countQuery += ` AND m.user_id = ?`
        countParams.push(userIdFilter)
      }

      if (categoryFilter) {
        countQuery += ` AND m.category = ?`
        countParams.push(categoryFilter)
      }

      const [countResult] = await connection.execute(countQuery, countParams) as any[]
      const total = countResult[0]?.total || 0

      return NextResponse.json({
        menuItems: itemsWithParsedExtras,
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
    console.error("Error getting menu items:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get menu items" },
      { status: 500 }
    )
  }
}
