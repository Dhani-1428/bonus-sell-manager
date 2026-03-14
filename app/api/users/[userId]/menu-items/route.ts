import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
import {
  getMenuItems,
  saveMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/lib/db-store"

/**
 * GET /api/users/[userId]/menu-items
 * Get all menu items for a user
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
    
    // Verify user is authenticated and accessing their own data
    if (!session) {
      console.log(`[GET /api/users/${userId}/menu-items] No session found`)
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[GET /api/users/${userId}/menu-items] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[GET /api/users/${userId}/menu-items] User ID mismatch - Forbidden`)
      return NextResponse.json(
        { error: "Forbidden - Cannot access other user's data" },
        { status: 403 }
      )
    }

    const items = await getMenuItems(userId)
    console.log(`[GET /api/users/${userId}/menu-items] Found ${items.length} menu items`)
    return NextResponse.json({ items })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    console.error(`[GET /api/users/${userId}/menu-items] Error getting menu items:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to get menu items" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/[userId]/menu-items
 * Add a new menu item
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
      console.log(`[POST /api/users/${userId}/menu-items] No session found`)
      console.log(`[POST /api/users/${userId}/menu-items] Request headers:`, Object.fromEntries(request.headers.entries()))
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[POST /api/users/${userId}/menu-items] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[POST /api/users/${userId}/menu-items] User ID mismatch - Session: ${session.userId}, Request: ${userId}`)
      return NextResponse.json(
        { error: "Unauthorized - Cannot access other user's data" },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log(`[POST /api/users/${userId}/menu-items] Adding menu item:`, body)
    console.log(`[POST /api/users/${userId}/menu-items] Session userId: ${session.userId}, params userId: ${userId}`)
    
    const item = await addMenuItem(userId, body)
    console.log(`[POST /api/users/${userId}/menu-items] ✅ Menu item added successfully:`, item.id)
    
    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    console.error(`❌ [POST /api/users/${userId}/menu-items] Error adding menu item:`, error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      userId: userId,
    })
    return NextResponse.json(
      { 
        error: error.message || "Failed to add menu item",
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
 * PUT /api/users/[userId]/menu-items
 * Save all menu items (bulk update)
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
      console.log(`[PUT /api/users/${userId}/menu-items] No session found`)
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[PUT /api/users/${userId}/menu-items] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[PUT /api/users/${userId}/menu-items] User ID mismatch - Forbidden`)
      return NextResponse.json(
        { error: "Unauthorized - Cannot access other user's data" },
        { status: 401 }
      )
    }

    const body = await request.json()
    await saveMenuItems(userId, body.items)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    console.error(`[PUT /api/users/${userId}/menu-items] Error saving menu items:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to save menu items" },
      { status: 500 }
    )
  }
}

