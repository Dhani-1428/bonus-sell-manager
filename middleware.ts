import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/", "/sign-in", "/sign-up", "/api/auth"]
const adminRoutes = ["/admin/login", "/api/admin/login"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))
  ) {
    return NextResponse.next()
  }

  // Allow admin login page and admin login API
  if (
    adminRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))
  ) {
    return NextResponse.next()
  }

  // For admin routes, check for admin_session cookie
  if (pathname.startsWith("/admin")) {
    const adminSessionId = request.cookies.get("admin_session")?.value
    const regularSessionId = request.cookies.get("session")?.value
    
    // Allow if either admin_session or session cookie exists
    // The admin layout will verify if user is actually a super_admin
    if (adminSessionId || regularSessionId) {
      return NextResponse.next()
    }
    
    // No session cookies, redirect to admin login
    const url = request.nextUrl.clone()
    url.pathname = "/admin/login"
    return NextResponse.redirect(url)
  }

  // Check for session cookie for regular routes
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
