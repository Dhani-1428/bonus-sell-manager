import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import {
  getOrders,
  saveOrders,
  addOrder,
  updateOrder,
  deleteOrder,
} from "@/lib/db-store"

/**
 * GET /api/users/[userId]/orders
 * Get all orders for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = await auth()
    
    // Verify user is accessing their own data
    if (!userId || userId !== params.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const orders = await getOrders(params.userId)
    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error("Error getting orders:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/[userId]/orders
 * Add a new order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = await auth()
    
    // Verify user is accessing their own data
    if (!userId || userId !== params.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const order = await addOrder(params.userId, body)
    
    return NextResponse.json({ order }, { status: 201 })
  } catch (error: any) {
    console.error("Error adding order:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[userId]/orders
 * Save all orders (bulk update)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = await auth()
    
    // Verify user is accessing their own data
    if (!userId || userId !== params.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    await saveOrders(params.userId, body.orders)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error saving orders:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/[userId]/orders/[orderId]
 * Update an order
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string; orderId: string } }
) {
  try {
    const { userId } = await auth()
    
    // Verify user is accessing their own data
    if (!userId || userId !== params.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const order = await updateOrder(params.userId, params.orderId, body)
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ order })
  } catch (error: any) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: error.message },
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
  { params }: { params: { userId: string; orderId: string } }
) {
  try {
    const { userId } = await auth()
    
    // Verify user is accessing their own data
    if (!userId || userId !== params.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const success = await deleteOrder(params.userId, params.orderId)
    
    if (!success) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting order:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
