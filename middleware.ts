import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getUserById } from "@/lib/auth-server"

const publicRoutes = ["/", "/sign-in", "/sign-up", "/api/auth"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))
  ) {
    return NextResponse.next()
  }

  // Check session for protected routes
  // In middleware, we read cookies directly from the request
  const sessionId = request.cookies.get("session")?.value

  if (!sessionId) {
    // Redirect to home page if not authenticated
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // Verify user exists in database
  try {
    const user = await getUserById(sessionId)

    if (!user) {
      // Invalid session, redirect to home
      const url = request.nextUrl.clone()
      url.pathname = "/"
      const response = NextResponse.redirect(url)
      // Clear invalid session cookie
      response.cookies.delete("session")
      return response
    }

    // Valid session, allow request
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware auth error:", error)
    // On error, redirect to home
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|json)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
