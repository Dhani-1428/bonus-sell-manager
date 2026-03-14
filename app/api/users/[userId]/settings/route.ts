import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
import {
  getRestaurantSettings,
  saveRestaurantSettings,
} from "@/lib/db-store"

/**
 * GET /api/users/[userId]/settings
 * Get restaurant settings for a user
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
      console.log(`[GET /api/users/${userId}/settings] No session found`)
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[GET /api/users/${userId}/settings] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[GET /api/users/${userId}/settings] User ID mismatch - Forbidden`)
      return NextResponse.json(
        { error: "Forbidden - Cannot access other user's data" },
        { status: 403 }
      )
    }

    const settings = await getRestaurantSettings(userId)
    return NextResponse.json({ settings })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    console.error(`[GET /api/users/${userId}/settings] Error getting restaurant settings:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to get restaurant settings" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[userId]/settings
 * Update restaurant settings
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
      console.log(`[PUT /api/users/${userId}/settings] No session found`)
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }
    
    console.log(`[PUT /api/users/${userId}/settings] Session userId: ${session.userId}, Request userId: ${userId}`)
    
    if (session.userId !== userId) {
      console.log(`[PUT /api/users/${userId}/settings] User ID mismatch - Forbidden`)
      return NextResponse.json(
        { error: "Unauthorized - Cannot access other user's data" },
        { status: 401 }
      )
    }

    const body = await request.json()
    await saveRestaurantSettings(userId, body)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.userId
    console.error(`[PUT /api/users/${userId}/settings] Error saving restaurant settings:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to save restaurant settings" },
      { status: 500 }
    )
  }
}
