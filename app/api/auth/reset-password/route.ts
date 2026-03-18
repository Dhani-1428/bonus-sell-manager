import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById, hashPassword, verifyPassword } from "@/lib/auth-server"
import { getPool } from "@/lib/db"

/**
 * POST /api/auth/reset-password
 * Change password for the currently logged-in user.
 *
 * Body:
 * - currentPassword: string
 * - newPassword: string
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 })
    }

    const user = await getUserById(sessionId)
    if (!user) {
      cookieStore.delete("session")
      return NextResponse.json({ error: "User not found. Please log in again." }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : ""
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : ""

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
    }

    if (!user.password) {
      return NextResponse.json({ error: "Password reset is not available for this account" }, { status: 400 })
    }

    const isValid = verifyPassword(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    const hashed = hashPassword(newPassword)
    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      await connection.execute("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id])
      return NextResponse.json({ success: true })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: error?.message || "Failed to reset password" }, { status: 500 })
  }
}

