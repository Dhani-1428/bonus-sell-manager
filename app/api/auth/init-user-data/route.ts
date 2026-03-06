import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/auth-server"

/**
 * POST /api/auth/init-user-data
 * Initialize user data in localStorage (client-side will handle this)
 * This endpoint verifies the user exists in database
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, name, email } = body

    // Verify session matches user
    if (sessionId !== userId) {
      return NextResponse.json(
        { error: "Session mismatch" },
        { status: 403 }
      )
    }

    // Verify user exists in database
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Return success - client will initialize localStorage
    return NextResponse.json({
      success: true,
      message: "User data can be initialized",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error("Init user data error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to initialize user data" },
      { status: 500 }
    )
  }
}
