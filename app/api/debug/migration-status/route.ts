import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"

/**
 * GET /api/debug/migration-status
 * Check if user has localStorage data that needs migration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }

    // This needs to run client-side, so we'll return instructions
    return NextResponse.json({
      message: "Check browser console for localStorage data",
      userId: session.userId,
      instructions: [
        "1. Open browser console (F12)",
        "2. Check localStorage keys",
        "3. Look for keys starting with 'restaurant_' + userId",
        "4. Migration should run automatically on login/dashboard access",
      ],
      localStorageKeys: typeof window !== "undefined" ? Object.keys(localStorage).filter(
        key => key.startsWith(`restaurant_${session.userId}_`)
      ) : "Server-side - check client console",
    })
  } catch (error: any) {
    console.error("Error checking migration status:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
