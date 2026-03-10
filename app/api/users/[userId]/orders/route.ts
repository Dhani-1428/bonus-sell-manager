import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
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
    const session = await getSession()
    
    // Verify user is accessing their own data
    if (!session || session.userId !== params.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const orders = await getOrders(params.userId)
    console.log(`[GET /api/users/${params.userId}/orders] Found ${orders.length} orders`)
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
    const session = await getSession()
    
    // Verify user is accessing their own data
    if (!session || session.userId !== params.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log(`[POST /api/users/${params.userId}/orders] Adding order:`, { ...body, items: body.items?.length || 0 })
    console.log(`[POST /api/users/${params.userId}/orders] Session userId: ${session.userId}, params userId: ${params.userId}`)
    
    const order = await addOrder(params.userId, body)
    console.log(`[POST /api/users/${params.userId}/orders] ✅ Order added successfully:`, order.id)
    
    return NextResponse.json({ order }, { status: 201 })
  } catch (error: any) {
    console.error(`❌ [POST /api/users/${params.userId}/orders] Error adding order:`, error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      userId: params.userId,
    })
    return NextResponse.json(
      { 
        error: error.message || "Failed to add order",
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          sqlState: error.sqlState,
        } : undefined,
      },
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
    const session = await getSession()
    
    // Verify user is accessing their own data
    if (!session || session.userId !== params.userId) {
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

