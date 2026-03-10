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
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession()
    
    // Verify user is authenticated and accessing their own data
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    if (session.userId !== params.userId) {
      return NextResponse.json(
        { error: "Forbidden - Cannot access other user's data" },
        { status: 403 }
      )
    }

    const items = await getMenuItems(params.userId)
    console.log(`[GET /api/users/${params.userId}/menu-items] Found ${items.length} menu items`)
    return NextResponse.json({ items })
  } catch (error: any) {
    console.error("Error getting menu items:", error)
    return NextResponse.json(
      { error: error.message },
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
    console.log(`[POST /api/users/${params.userId}/menu-items] Adding menu item:`, body)
    console.log(`[POST /api/users/${params.userId}/menu-items] Session userId: ${session.userId}, params userId: ${params.userId}`)
    
    const item = await addMenuItem(params.userId, body)
    console.log(`[POST /api/users/${params.userId}/menu-items] ✅ Menu item added successfully:`, item.id)
    
    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    console.error(`❌ [POST /api/users/${params.userId}/menu-items] Error adding menu item:`, error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      userId: params.userId,
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
    await saveMenuItems(params.userId, body.items)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error saving menu items:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

