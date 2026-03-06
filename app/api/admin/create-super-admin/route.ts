import { NextRequest, NextResponse } from "next/server"
import { createSuperAdmin } from "@/lib/admin-auth"

/**
 * POST /api/admin/create-super-admin
 * Create a super admin (protected - should only be called once during setup)
 * 
 * SECURITY: In production, you should protect this endpoint or remove it after creating the first admin
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    // For now, allow creation (you can secure this later)
    
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const admin = await createSuperAdmin(name, email, password)

    return NextResponse.json({
      success: true,
      message: "Super admin created successfully",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error: any) {
    console.error("Error creating super admin:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create super admin" },
      { status: 500 }
    )
  }
}
