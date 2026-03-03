import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth-middleware"

const publicRoutes = ["/", "/sign-in", "/sign-up", "/api/auth", "/api/webhooks"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))
  ) {
    return NextResponse.next()
  }

  // Check session for protected routes
  const session = await getSession()

  if (!session) {
    // Redirect to home page if not authenticated
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

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
