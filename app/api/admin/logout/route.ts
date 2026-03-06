import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * POST /api/admin/logout
 * Super admin logout
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("admin_session")
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Super admin logout error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to logout" },
      { status: 500 }
    )
  }
}
