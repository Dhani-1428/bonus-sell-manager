import { NextRequest, NextResponse } from "next/server"
import { verifyUser } from "@/lib/auth-server"
import { cookies } from "next/headers"

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Verify user credentials
    const user = await verifyUser(email, password)

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Create session cookie
    const cookieStore = await cookies()
    cookieStore.set("session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to login" },
      { status: 500 }
    )
  }
}
