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
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    // Handle both Next.js 14 and 15+ params format
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    
    const session = await getSession()
    
    // Verify user is accessing their own data
    if (!session) {
      console.log(`[GET /api/users/${userId}/orders] No session found`)
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[GET /api/users/${userId}/orders] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[GET /api/users/${userId}/orders] User ID mismatch - Forbidden`)
      return NextResponse.json(
        { error: "Forbidden - Cannot access other user's data" },
        { status: 403 }
      )
    }

    const orders = await getOrders(userId)
    console.log(`[GET /api/users/${userId}/orders] Found ${orders.length} orders`)
    return NextResponse.json({ orders })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    console.error(`[GET /api/users/${userId}/orders] Error getting orders:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to get orders" },
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
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    // Handle both Next.js 14 and 15+ params format
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    
    const session = await getSession()
    
    // Verify user is accessing their own data
    if (!session) {
      console.log(`[POST /api/users/${userId}/orders] No session found`)
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[POST /api/users/${userId}/orders] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[POST /api/users/${userId}/orders] User ID mismatch - Forbidden`)
      return NextResponse.json(
        { error: "Unauthorized - Cannot access other user's data" },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log(`[POST /api/users/${userId}/orders] Adding order:`, { ...body, items: body.items?.length || 0 })
    console.log(`[POST /api/users/${userId}/orders] Session userId: ${session.userId}, params userId: ${userId}`)
    
    const order = await addOrder(userId, body)
    console.log(`[POST /api/users/${userId}/orders] ✅ Order added successfully:`, order.id)
    
    return NextResponse.json({ order }, { status: 201 })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    console.error(`❌ [POST /api/users/${userId}/orders] Error adding order:`, error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      userId: userId,
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
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    // Handle both Next.js 14 and 15+ params format
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    
    const session = await getSession()
    
    // Verify user is accessing their own data
    if (!session) {
      console.log(`[PUT /api/users/${userId}/orders] No session found`)
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[PUT /api/users/${userId}/orders] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[PUT /api/users/${userId}/orders] User ID mismatch - Forbidden`)
      return NextResponse.json(
        { error: "Unauthorized - Cannot access other user's data" },
        { status: 401 }
      )
    }

    const body = await request.json()
    await saveOrders(userId, body.orders)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    console.error(`[PUT /api/users/${userId}/orders] Error saving orders:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to save orders" },
      { status: 500 }
    )
  }
}

