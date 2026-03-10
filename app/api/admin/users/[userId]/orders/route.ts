import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/users/[userId]/orders
 * Get all orders for a specific user (super admin only)
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
      const [orders] = await connection.query(
        `SELECT id, order_number, date, items, total_amount, discount_amount, final_amount, payment_method, created_at 
         FROM orders 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [params.userId]
      ) as any[]

      const formattedOrders = orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number,
        date: order.date.toISOString().split("T")[0],
        items: JSON.parse(order.items),
        totalAmount: parseFloat(order.total_amount),
        discountAmount: parseFloat(order.discount_amount),
        finalAmount: parseFloat(order.final_amount),
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
      }))

      return NextResponse.json({ orders: formattedOrders })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error getting orders:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[userId]/orders/[orderId]
 * Update a specific order (super admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string; orderId: string } }
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
    const { date, items, totalAmount, discountAmount, finalAmount, paymentMethod } = body

    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      const updates: string[] = []
      const values: any[] = []

      if (date !== undefined) {
        updates.push("date = ?")
        values.push(new Date(date))
      }
      if (items !== undefined) {
        updates.push("items = ?")
        values.push(JSON.stringify(items))
      }
      if (totalAmount !== undefined) {
        updates.push("total_amount = ?")
        values.push(totalAmount)
      }
      if (discountAmount !== undefined) {
        updates.push("discount_amount = ?")
        values.push(discountAmount)
      }
      if (finalAmount !== undefined) {
        updates.push("final_amount = ?")
        values.push(finalAmount)
      }
      if (paymentMethod !== undefined) {
        updates.push("payment_method = ?")
        values.push(paymentMethod)
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 }
        )
      }

      values.push(params.orderId, params.userId)

      await connection.execute(
        `UPDATE orders SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
        values
      )

      // Get updated order
      const [orders] = await connection.query(
        `SELECT id, order_number, date, items, total_amount, discount_amount, final_amount, payment_method, created_at 
         FROM orders 
         WHERE id = ? AND user_id = ?`,
        [params.orderId, params.userId]
      ) as any[]

      if (orders.length === 0) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        )
      }

      const order = orders[0]
      return NextResponse.json({
        order: {
          id: order.id,
          orderNumber: order.order_number,
          date: order.date.toISOString().split("T")[0],
          items: JSON.parse(order.items),
          totalAmount: parseFloat(order.total_amount),
          discountAmount: parseFloat(order.discount_amount),
          finalAmount: parseFloat(order.final_amount),
          paymentMethod: order.payment_method,
          createdAt: order.created_at,
        },
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[userId]/orders/[orderId]
 * Delete a specific order (super admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; orderId: string } }
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
        `DELETE FROM orders WHERE id = ? AND user_id = ?`,
        [params.orderId, params.userId]
      )

      return NextResponse.json({ success: true })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error deleting order:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
