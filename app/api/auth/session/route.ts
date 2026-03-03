import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/auth-server"

/**
 * GET /api/auth/session
 * Get current user session
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ user: null })
    }

    const user = await getUserById(sessionId)

    if (!user) {
      // Clear invalid session
      cookieStore.delete("session")
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error("Session error:", error)
    return NextResponse.json({ user: null })
  }
}
