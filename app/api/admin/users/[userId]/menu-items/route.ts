import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/users/[userId]/menu-items
 * Get all menu items for a specific user (super admin only)
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
      const [items] = await connection.query(
        `SELECT id, name, price, category, extras, created_at 
         FROM menu_items 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [params.userId]
      ) as any[]

      const menuItems = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        category: item.category,
        extras: item.extras ? JSON.parse(item.extras) : null,
        createdAt: item.created_at,
      }))

      return NextResponse.json({ items: menuItems })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error getting menu items:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users/[userId]/menu-items
 * Create menu item for a user (super admin only)
 */
export async function POST(
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
    const { name, price, category, extras } = body

    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      const id = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const createdAtDate = new Date()

      await connection.execute(
        `INSERT INTO menu_items (id, user_id, name, price, category, extras, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          params.userId,
          name,
          price,
          category,
          extras ? JSON.stringify(extras) : null,
          createdAtDate,
        ]
      )

      return NextResponse.json({
        item: {
          id,
          name,
          price,
          category,
          extras,
          createdAt: createdAtDate.toISOString(),
        },
      }, { status: 201 })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error creating menu item:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/users/[userId]/menu-items
 * Update menu items for a user (super admin only)
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
    const { items } = body

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items must be an array" },
        { status: 400 }
      )
    }

    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Delete all existing items for this user
      await connection.execute(
        `DELETE FROM menu_items WHERE user_id = ?`,
        [params.userId]
      )

      // Insert new items
      for (const item of items) {
        const id = item.id || `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const createdAtDate = item.createdAt ? new Date(item.createdAt) : new Date()

        await connection.execute(
          `INSERT INTO menu_items (id, user_id, name, price, category, extras, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            params.userId,
            item.name,
            item.price,
            item.category,
            item.extras ? JSON.stringify(item.extras) : null,
            createdAtDate,
          ]
        )
      }

      await connection.commit()

      return NextResponse.json({ success: true })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error updating menu items:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
