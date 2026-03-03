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
    
    // Verify user is accessing their own data
    if (!session || session.userId !== params.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const items = await getMenuItems(params.userId)
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
    const item = await addMenuItem(params.userId, body)
    
    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    console.error("Error adding menu item:", error)
    return NextResponse.json(
      { error: error.message },
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

/**
 * PATCH /api/users/[userId]/menu-items/[itemId]
 * Update a menu item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string; itemId: string } }
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
    const item = await updateMenuItem(params.userId, params.itemId, body)
    
    if (!item) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ item })
  } catch (error: any) {
    console.error("Error updating menu item:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[userId]/menu-items/[itemId]
 * Delete a menu item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; itemId: string } }
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

    const success = await deleteMenuItem(params.userId, params.itemId)
    
    if (!success) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting menu item:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
