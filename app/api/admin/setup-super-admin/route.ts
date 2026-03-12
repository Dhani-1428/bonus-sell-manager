import { NextRequest, NextResponse } from "next/server"
import { getSuperAdminByEmail, createSuperAdmin, getAllSuperAdmins } from "@/lib/admin-auth"
import { getPool } from "@/lib/db"
import { hashPassword } from "@/lib/auth-server"

/**
 * POST /api/admin/setup-super-admin
 * Setup super admin with specific credentials
 * This will create or update the super admin account
 */
export async function POST(request: NextRequest) {
  try {
    const email = "bonusfoodsellmanager@gmail.com"
    const password = "bonusfoodsellmanager.com"
    const name = "Super Admin"
    const normalizedEmail = email.toLowerCase()

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      // First, check if ANY user exists with this email (regardless of role)
      const [existingUsers] = await connection.execute(
        `SELECT id, name, email, role FROM users WHERE email = ?`,
        [normalizedEmail]
      ) as any[]

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0]

        // Promote this user to super_admin and update password
        const hashedPassword = hashPassword(password)
        await connection.execute(
          `UPDATE users 
             SET password = ?, role = 'super_admin', subscription_status = 'active' 
           WHERE email = ?`,
          [hashedPassword, normalizedEmail]
        )

        return NextResponse.json({
          success: true,
          message: existingUser.role === 'super_admin'
            ? "Super admin password updated successfully"
            : "Existing user promoted to super admin successfully",
          admin: {
            email: normalizedEmail,
            name: existingUser.name || name,
          },
          credentials: {
            email,
            password,
          },
        })
      }

      // If no user with this email exists at all, create a fresh super admin

      // Create super admin
      const admin = await createSuperAdmin(name, email, password)
      
      return NextResponse.json({
        success: true,
        message: "Super admin created successfully",
        admin: {
          email: admin.email,
          name: admin.name,
        },
        credentials: {
          email: email,
          password: password,
        },
        loginUrl: "/admin/login",
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error setting up super admin:", error)
    return NextResponse.json(
      { error: error.message || "Failed to setup super admin" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/setup-super-admin
 * Same as POST, allows calling via browser
 */
export async function GET(request: NextRequest) {
  return POST(request)
}
