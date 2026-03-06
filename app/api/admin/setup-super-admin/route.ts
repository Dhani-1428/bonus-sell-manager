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

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      // Check if super admin exists
      const existingAdmin = await getSuperAdminByEmail(email)
      
      if (existingAdmin) {
        // Update password if admin exists
        const hashedPassword = hashPassword(password)
        await connection.execute(
          `UPDATE users SET password = ? WHERE email = ? AND role = ?`,
          [hashedPassword, email.toLowerCase(), 'super_admin']
        )
        
        return NextResponse.json({
          success: true,
          message: "Super admin password updated successfully",
          admin: {
            email: existingAdmin.email,
            name: existingAdmin.name,
          },
          credentials: {
            email: email,
            password: password,
          },
        })
      }

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
