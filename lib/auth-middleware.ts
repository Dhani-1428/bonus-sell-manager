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
      return null
    }

    const user = await getUserById(sessionId)

    if (!user) {
      return null
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    }
  } catch (error) {
    console.error("Session error:", error)
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
