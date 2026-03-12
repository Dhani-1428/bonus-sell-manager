/**
 * Server-side authentication middleware
 * Verifies session cookie and returns user info
 */

import { cookies } from "next/headers"
import { getUserById } from "./auth-server"

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      console.log("[getSession] No session cookie found")
      return null
    }

    console.log("[getSession] Session cookie found:", sessionId.substring(0, 20) + "...")

    const user = await getUserById(sessionId)

    if (!user) {
      console.log("[getSession] User not found for sessionId:", sessionId.substring(0, 20) + "...")
      return null
    }

    console.log("[getSession] User found:", user.email)
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    }
  } catch (error: any) {
    console.error("[getSession] Session error:", error.message || error)
    console.error("[getSession] Error stack:", error.stack)
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}
