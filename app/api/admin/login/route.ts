import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdmin } from "@/lib/admin-auth"
import { cookies } from "next/headers"

/**
 * POST /api/admin/login
 * Super admin login
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

    // Verify super admin credentials
    const admin = await verifySuperAdmin(email, password)

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Create session cookie
    const cookieStore = await cookies()
    cookieStore.set("admin_session", admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error: any) {
    console.error("Super admin login error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to login" },
      { status: 500 }
    )
  }
}
