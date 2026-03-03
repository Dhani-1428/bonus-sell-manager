import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
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

    const settings = await getRestaurantSettings(params.userId)
    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error("Error getting restaurant settings:", error)
    return NextResponse.json(
      { error: error.message },
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
    await saveRestaurantSettings(params.userId, body)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error saving restaurant settings:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
