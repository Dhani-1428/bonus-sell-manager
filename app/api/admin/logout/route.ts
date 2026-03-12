import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * POST /api/admin/logout
 * Super admin logout - clears both admin_session and regular session cookies
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Clear both admin_session and regular session cookies
    cookieStore.delete("admin_session")
    cookieStore.delete("session")
    
    // Set logout flag cookie to prevent auto-login
    cookieStore.set("logout_flag", "true", {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60, // 1 minute - just enough to prevent immediate auto-login
      path: "/",
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Super admin logout error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to logout" },
      { status: 500 }
    )
  }
}
