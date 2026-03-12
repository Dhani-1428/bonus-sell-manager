import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * POST /api/auth/logout
 * Clear session cookie and set logout flag to prevent auto-login
 */
export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
  cookieStore.delete("admin_session") // Also clear admin session if present
  
  // Set logout flag cookie to prevent auto-login
  cookieStore.set("logout_flag", "true", {
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60, // 1 minute - just enough to prevent immediate auto-login
    path: "/",
  })

  return NextResponse.json({ success: true })
}
