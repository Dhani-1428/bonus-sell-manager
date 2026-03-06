import { NextRequest, NextResponse } from "next/server"
import { getSuperAdminByEmail, createSuperAdmin, getAllSuperAdmins } from "@/lib/admin-auth"

/**
 * GET /api/admin/check-or-create
 * Check if super admin exists, create one if not
 * This is a setup endpoint - can be called to ensure super admin exists
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email") || "bonusfoodsellmanager@gmail.com"
    const password = searchParams.get("password") || "bonusfoodsellmanager.com"
    const name = searchParams.get("name") || "Super Admin"

    // Check if super admin exists
    const existingAdmin = await getSuperAdminByEmail(email)
    
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        exists: true,
        message: "Super admin already exists",
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
        },
      })
    }

    // Get all super admins to see if any exist
    const allAdmins = await getAllSuperAdmins()
    
    if (allAdmins.length > 0) {
      return NextResponse.json({
        success: true,
        exists: true,
        message: "Super admin exists (different email)",
        admins: allAdmins.map(a => ({ email: a.email, name: a.name })),
      })
    }

    // Create super admin
    try {
      const admin = await createSuperAdmin(name, email, password)
      
      return NextResponse.json({
        success: true,
        exists: false,
        created: true,
        message: "Super admin created successfully",
        admin: {
          email: admin.email,
          name: admin.name,
          password: password, // Return password for first login
        },
        instructions: "Use these credentials to login at /admin/login",
      })
    } catch (createError: any) {
      return NextResponse.json({
        success: false,
        error: createError.message || "Failed to create super admin",
        message: "Super admin does not exist and could not be created",
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error checking/creating super admin:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check super admin" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/check-or-create
 * Same as GET, but allows passing credentials in body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = body.email || "bonusfoodsellmanager@gmail.com"
    const password = body.password || "bonusfoodsellmanager.com"
    const name = body.name || "Super Admin"

    // Check if super admin exists
    const existingAdmin = await getSuperAdminByEmail(email)
    
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        exists: true,
        message: "Super admin already exists",
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
        },
      })
    }

    // Get all super admins to see if any exist
    const allAdmins = await getAllSuperAdmins()
    
    if (allAdmins.length > 0) {
      return NextResponse.json({
        success: true,
        exists: true,
        message: "Super admin exists (different email)",
        admins: allAdmins.map(a => ({ email: a.email, name: a.name })),
      })
    }

    // Create super admin
    try {
      const admin = await createSuperAdmin(name, email, password)
      
      return NextResponse.json({
        success: true,
        exists: false,
        created: true,
        message: "Super admin created successfully",
        admin: {
          email: admin.email,
          name: admin.name,
        },
        credentials: {
          email: admin.email,
          password: password,
        },
        instructions: "Use these credentials to login at /admin/login",
      })
    } catch (createError: any) {
      return NextResponse.json({
        success: false,
        error: createError.message || "Failed to create super admin",
        message: "Super admin does not exist and could not be created",
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error checking/creating super admin:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check super admin" },
      { status: 500 }
    )
  }
}
