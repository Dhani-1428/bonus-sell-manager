import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * POST /api/auth/logout
 * Clear session cookie
 */
export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete("session")

  return NextResponse.json({ success: true })
}
