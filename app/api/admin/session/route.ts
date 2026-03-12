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
    const adminSessionCookie = cookieStore.get("admin_session")
    const regularSessionCookie = cookieStore.get("session")
    
    console.log('🔐 Admin Session API - Cookie check:', {
      hasAdminSession: !!adminSessionCookie?.value,
      hasRegularSession: !!regularSessionCookie?.value,
    })
    
    let sessionId = adminSessionCookie?.value

    // If no admin_session, check regular session cookie
    // This allows super_admins to access admin panel after logging in via Google or email/password
    if (!sessionId) {
      sessionId = regularSessionCookie?.value
      console.log('📝 Using regular session cookie instead of admin_session')
    }

    if (!sessionId) {
      console.error('❌ No session cookie found')
      return NextResponse.json({ 
        admin: null,
        error: "No session cookie found",
        diagnostics: {
          hasAdminSession: false,
          hasRegularSession: false,
        }
      })
    }

    console.log('✅ Session ID found:', sessionId.substring(0, 20) + '...')

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
          // Check if user exists at all (with any role)
          const [userRows] = await connection.execute(
            'SELECT id, name, email, role FROM users WHERE id = ?',
            [sessionId]
          ) as any[]
          
          if (userRows.length === 0) {
            console.error('❌ User not found in database')
            return NextResponse.json({ 
              admin: null,
              error: "User not found in database",
              diagnostics: {
                hasAdminSession: !!adminSessionCookie?.value,
                hasRegularSession: !!regularSessionCookie?.value,
                sessionId: sessionId.substring(0, 20) + '...',
              }
            })
          }
          
          const user = userRows[0]
          console.error('❌ User found but not super admin:', {
            id: user.id,
            email: user.email,
            role: user.role || 'NULL',
          })
          
          // User is not a super_admin or doesn't exist
          // Clear invalid admin_session if it was set
          if (cookieStore.get("admin_session")?.value === sessionId) {
            cookieStore.delete("admin_session")
          }
          return NextResponse.json({ 
            admin: null,
            error: `User is not a super admin. Current role: ${user.role || 'NULL'}`,
            diagnostics: {
              hasAdminSession: !!adminSessionCookie?.value,
              hasRegularSession: !!regularSessionCookie?.value,
              user: {
                id: user.id,
                email: user.email,
                role: user.role || 'NULL',
              }
            }
          })
        }

        // User is a super_admin - return admin data
        console.log('✅ Super admin verified:', rows[0].email)
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
          return NextResponse.json({ 
            admin: null,
            error: "Role column not found in database. Run /api/db/init to fix.",
          })
        }
        throw error
      }
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Super admin session error:", error)
    return NextResponse.json({ 
      admin: null,
      error: error.message || "Unknown error",
    })
  }
}
