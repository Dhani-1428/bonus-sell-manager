import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
import {
  updateMenuItem,
  deleteMenuItem,
} from "@/lib/db-store"

/**
 * PATCH /api/users/[userId]/menu-items/[itemId]
 * Update a menu item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; itemId: string }> | { userId: string; itemId: string } }
) {
  try {
    // Handle both Next.js 14 and 15+ params format
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    const itemId = resolvedParams.itemId
    
    const session = await getSession()
    
    // Verify user is accessing their own data
    if (!session) {
      console.log(`[PATCH /api/users/${userId}/menu-items/${itemId}] No session found`)
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[PATCH /api/users/${userId}/menu-items/${itemId}] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[PATCH /api/users/${userId}/menu-items/${itemId}] User ID mismatch - Forbidden`)
      return NextResponse.json(
        { error: "Unauthorized - Cannot access other user's data" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const item = await updateMenuItem(userId, itemId, body)
    
    if (!item) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ item })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    const itemId = resolvedParams.itemId
    console.error(`[PATCH /api/users/${userId}/menu-items/${itemId}] Error updating menu item:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to update menu item" },
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
  { params }: { params: Promise<{ userId: string; itemId: string }> | { userId: string; itemId: string } }
) {
  try {
    // Handle both Next.js 14 and 15+ params format
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    const itemId = resolvedParams.itemId
    
    const session = await getSession()
    
    // Verify user is accessing their own data
    if (!session) {
      console.log(`[DELETE /api/users/${userId}/menu-items/${itemId}] No session found`)
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[DELETE /api/users/${userId}/menu-items/${itemId}] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[DELETE /api/users/${userId}/menu-items/${itemId}] User ID mismatch - Forbidden`)
      return NextResponse.json(
        { error: "Unauthorized - Cannot access other user's data" },
        { status: 401 }
      )
    }

    const success = await deleteMenuItem(userId, itemId)
    
    if (!success) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    const itemId = resolvedParams.itemId
    console.error(`[DELETE /api/users/${userId}/menu-items/${itemId}] Error deleting menu item:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to delete menu item" },
      { status: 500 }
    )
  }
}
