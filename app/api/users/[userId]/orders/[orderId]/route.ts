import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
import {
  updateOrder,
  deleteOrder,
} from "@/lib/db-store"

/**
 * PATCH /api/users/[userId]/orders/[orderId]
 * Update an order
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; orderId: string }> | { userId: string; orderId: string } }
) {
  try {
    // Handle both Next.js 14 and 15+ params format
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    const orderId = resolvedParams.orderId
    
    const session = await getSession()
    
    // Verify user is accessing their own data
    if (!session) {
      console.log(`[PATCH /api/users/${userId}/orders/${orderId}] No session found`)
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[PATCH /api/users/${userId}/orders/${orderId}] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[PATCH /api/users/${userId}/orders/${orderId}] User ID mismatch - Forbidden`)
      return NextResponse.json(
        { error: "Unauthorized - Cannot access other user's data" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const order = await updateOrder(userId, orderId, body)
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ order })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    const orderId = resolvedParams.orderId
    console.error(`[PATCH /api/users/${userId}/orders/${orderId}] Error updating order:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[userId]/orders/[orderId]
 * Delete an order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; orderId: string }> | { userId: string; orderId: string } }
) {
  try {
    // Handle both Next.js 14 and 15+ params format
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    const orderId = resolvedParams.orderId
    
    const session = await getSession()
    
    // Verify user is accessing their own data
    if (!session) {
      console.log(`[DELETE /api/users/${userId}/orders/${orderId}] No session found`)
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[DELETE /api/users/${userId}/orders/${orderId}] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[DELETE /api/users/${userId}/orders/${orderId}] User ID mismatch - Forbidden`)
      return NextResponse.json(
        { error: "Unauthorized - Cannot access other user's data" },
        { status: 401 }
      )
    }

    const success = await deleteOrder(userId, orderId)
    
    if (!success) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    const orderId = resolvedParams.orderId
    console.error(`[DELETE /api/users/${userId}/orders/${orderId}] Error deleting order:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to delete order" },
      { status: 500 }
    )
  }
}
