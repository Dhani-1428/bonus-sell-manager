import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/check-auth
 * Diagnostic endpoint to check authentication status
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSessionCookie = cookieStore.get("admin_session")
    const regularSessionCookie = cookieStore.get("session")
    
    const diagnostics = {
      cookies: {
        hasAdminSession: !!adminSessionCookie?.value,
        hasRegularSession: !!regularSessionCookie?.value,
        adminSessionId: adminSessionCookie?.value || null,
        regularSessionId: regularSessionCookie?.value || null,
      },
      user: null as any,
      isSuperAdmin: false,
      error: null as string | null,
    }

    let sessionId = adminSessionCookie?.value || regularSessionCookie?.value

    if (!sessionId) {
      diagnostics.error = "No session cookie found"
      return NextResponse.json(diagnostics)
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      // Get user info
      const [userRows] = await connection.execute(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [sessionId]
      ) as any[]

      if (userRows.length === 0) {
        diagnostics.error = "User not found in database"
        return NextResponse.json(diagnostics)
      }

      const user = userRows[0]
      diagnostics.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'NULL (not set)',
      }

      // Check if super admin
      diagnostics.isSuperAdmin = await isSuperAdmin(sessionId)

      return NextResponse.json(diagnostics)
    } finally {
      connection.release()
    }
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      cookies: {
        hasAdminSession: false,
        hasRegularSession: false,
      },
      user: null,
      isSuperAdmin: false,
    })
  }
}
