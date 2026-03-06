import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"

/**
 * GET /api/admin/session
 * Get current super admin session
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("admin_session")?.value

    if (!sessionId) {
      return NextResponse.json({ admin: null })
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    try {
      const [rows] = await connection.execute(
        'SELECT id, name, email, role FROM users WHERE id = ? AND role = ?',
        [sessionId, 'super_admin']
      ) as any[]
      
      if (rows.length === 0) {
        // Clear invalid session
        cookieStore.delete("admin_session")
        return NextResponse.json({ admin: null })
      }

      return NextResponse.json({
        admin: {
          id: rows[0].id,
          name: rows[0].name,
          email: rows[0].email,
          role: rows[0].role,
        },
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Super admin session error:", error)
    return NextResponse.json({ admin: null })
  }
}
