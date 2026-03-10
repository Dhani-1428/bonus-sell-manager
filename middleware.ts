import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/", "/sign-in", "/sign-up", "/api/auth"]
const adminRoutes = ["/admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))
  ) {
    return NextResponse.next()
  }

  // Allow admin routes - they have their own authentication check
  if (
    adminRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next()
  }

  // Check for session cookie
  // Note: We only check for cookie existence here, not database verification
  // Database verification happens in API routes which run in Node.js runtime
  const sessionId = request.cookies.get("session")?.value

  if (!sessionId) {
    // Redirect to home page if no session cookie
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // Cookie exists, allow request to proceed
  // API routes will verify the user exists in database
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|json)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
