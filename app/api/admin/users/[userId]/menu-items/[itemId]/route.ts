import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * PATCH /api/admin/users/[userId]/menu-items/[itemId]
 * Update a specific menu item (super admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string; itemId: string } }
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
      const updates: string[] = []
      const values: any[] = []

      if (name !== undefined) {
        updates.push("name = ?")
        values.push(name)
      }
      if (price !== undefined) {
        updates.push("price = ?")
        values.push(price)
      }
      if (category !== undefined) {
        updates.push("category = ?")
        values.push(category)
      }
      if (extras !== undefined) {
        updates.push("extras = ?")
        values.push(extras ? JSON.stringify(extras) : null)
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 }
        )
      }

      values.push(params.itemId, params.userId)

      await connection.execute(
        `UPDATE menu_items SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
        values
      )

      // Get updated item
      const [items] = await connection.query(
        `SELECT id, name, price, category, extras, created_at 
         FROM menu_items 
         WHERE id = ? AND user_id = ?`,
        [params.itemId, params.userId]
      ) as any[]

      if (items.length === 0) {
        return NextResponse.json(
          { error: "Menu item not found" },
          { status: 404 }
        )
      }

      const item = items[0]
      return NextResponse.json({
        item: {
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          category: item.category,
          extras: item.extras ? JSON.parse(item.extras) : null,
          createdAt: item.created_at,
        },
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error updating menu item:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[userId]/menu-items/[itemId]
 * Delete a specific menu item (super admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; itemId: string } }
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
      await connection.execute(
        `DELETE FROM menu_items WHERE id = ? AND user_id = ?`,
        [params.itemId, params.userId]
      )

      return NextResponse.json({ success: true })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error deleting menu item:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
