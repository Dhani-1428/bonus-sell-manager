import { NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/auth-server"
import { cookies } from "next/headers"
import { sendWelcomeEmail } from "@/lib/email"

/**
 * POST /api/auth/signup
 * Create a new user account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser(name, email, password)

    // Get user with role from database
    const { getUserById } = await import("@/lib/auth-server")
    const userWithRole = await getUserById(user.id)

    // Create session cookie
    const cookieStore = await cookies()
    cookieStore.set("session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    // Send welcome email
    // Try to send email, but don't block signup if it fails
    try {
      await sendWelcomeEmail(user.email, user.name);
      console.log("✅ Welcome email sent successfully");
    } catch (error: any) {
      console.error("❌ Failed to send welcome email:", error);
      // Continue anyway - email failure shouldn't block signup
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userWithRole?.role || 'user',
      },
    })
  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    )
  }
}
