import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"

/**
 * GET /api/admin/session
 * Get current super admin session
 * Checks both admin_session cookie (from admin login) and session cookie (from regular login)
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    let sessionId = cookieStore.get("admin_session")?.value
    console.log("🍪 Admin session API: admin_session cookie:", sessionId ? "exists" : "not found")

    // If no admin_session, check regular session cookie
    // This allows super_admins to access admin panel after logging in via Google or email/password
    if (!sessionId) {
      sessionId = cookieStore.get("session")?.value
      console.log("🍪 Admin session API: session cookie:", sessionId ? "exists" : "not found")
    }

    if (!sessionId) {
      console.log("❌ Admin session API: No session cookies found")
      return NextResponse.json({ admin: null })
    }

    console.log("🔍 Admin session API: Checking user with sessionId:", sessionId)

    const pool = getPool()
    const connection = await pool.getConnection()
    try {
      // First check if user exists and is super_admin
      try {
        const [rows] = await connection.execute(
          'SELECT id, name, email, role FROM users WHERE id = ? AND role = ?',
          [sessionId, 'super_admin']
        ) as any[]
        
        if (rows.length === 0) {
          // User is not a super_admin or doesn't exist
          // Clear invalid admin_session if it was set
          if (cookieStore.get("admin_session")?.value === sessionId) {
            cookieStore.delete("admin_session")
          }
          return NextResponse.json({ admin: null })
        }

        // User is a super_admin - return admin data
        return NextResponse.json({
          admin: {
            id: rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
            role: rows[0].role,
          },
        })
      } catch (error: any) {
        // If role column doesn't exist, no one is a super admin yet
        if (error.message && error.message.includes("Unknown column 'role'")) {
          console.warn('⚠️  Role column not found. Run /api/db/migrate-role to add it.');
          return NextResponse.json({ admin: null })
        }
        throw error
      }
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Super admin session error:", error)
    return NextResponse.json({ admin: null })
  }
}
