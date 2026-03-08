import { NextRequest, NextResponse } from "next/server"
import { verifyUser } from "@/lib/auth-server"
import { cookies } from "next/headers"
import { sendLoginEmail } from "@/lib/email"

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

    // Send login notification email
    // Try to send email, but don't block login if it fails
    try {
      await sendLoginEmail(user.email, user.name);
      console.log("✅ Login email sent successfully");
    } catch (error: any) {
      console.error("❌ Failed to send login email:", error);
      // Continue anyway - email failure shouldn't block login
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
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
