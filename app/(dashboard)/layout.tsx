"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { CookingLoader } from "@/components/cooking-loader"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useState, useEffect, type ReactNode } from "react"
import { getUserById, getSubscriptionStatus } from "@/lib/subscription"
import { cn } from "@/lib/utils"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { session, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [subscriptionCheck, setSubscriptionCheck] = useState<{ hasAccess: boolean; message: string } | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Handle redirect if no session - but give it time to load
  useEffect(() => {
    // Wait a bit for session to load before redirecting
    if (isLoading) {
      setIsInitializing(true)
      return
    }
    
    setIsInitializing(false)
    
    // Only redirect if we're sure there's no session after loading completes
    if (!session) {
      const timer = setTimeout(() => {
        // Double check session one more time before redirecting
        const checkSession = async () => {
          try {
            const response = await fetch("/api/auth/session")
            const data = await response.json()
            if (!data.user) {
              router.push("/")
            }
          } catch (error) {
            console.error("Session check failed:", error)
            router.push("/")
          }
        }
        checkSession()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [session, isLoading, router])

  useEffect(() => {
    if (session) {
      // Initialize user data if not in localStorage
      const initializeUserData = async () => {
        try {
          const user = getUserById(session.userId)
          if (!user) {
            // User not in localStorage - initialize it client-side
            const { initializeUserData: initUser } = await import("@/lib/auth")
            initUser(session.userId, session.name, session.email)
          }
        } catch (err) {
          console.warn("Failed to initialize user data:", err)
        }
      }
      
      initializeUserData()
      
      // Small delay to ensure user data is initialized
      const timer = setTimeout(() => {
        const user = getUserById(session.userId)
        if (user) {
          const status = getSubscriptionStatus(user)
          setSubscriptionCheck({ hasAccess: status.hasAccess, message: status.message })
          
          // Redirect to subscription page if no access (except if already on subscription page)
          // Allow subscription page to be accessible even without active subscription
          // Use setTimeout to ensure redirect happens after state update
          if (!status.hasAccess && pathname !== "/subscription" && !pathname.startsWith("/subscription")) {
            setTimeout(() => {
              router.push("/subscription")
            }, 0)
          }
        } else {
          // User not found in localStorage - give access by default (trial users)
          // This might happen on first login before user data is fully initialized
          // Allow dashboard access - user data will be initialized in background
          setSubscriptionCheck({ hasAccess: true, message: "Trial access" })
        }
      }, 200) // Small delay to allow initialization
      
      return () => clearTimeout(timer)
    } else {
      setSubscriptionCheck(null)
    }
  }, [session, pathname, router])

  // Show dashboard immediately if we have session, even if still loading other things
  // Don't block on isLoading - session might be set but isLoading might still be true
  if (isLoading && !session) {
    return <CookingLoader text="Loading dashboard..." />
  }

  // If we have a session, show dashboard immediately
  // Don't wait for subscription checks or other async operations
  if (session) {
    // Continue to render dashboard - don't block
  } else if (!isInitializing && !isLoading) {
    // Only show redirecting if we're sure there's no session
    return <CookingLoader text="Redirecting..." />
  }

  // Always show dashboard if session exists - don't block on subscription check
  // Subscription check happens in background and won't block dashboard access
  // Only redirect to subscription page if explicitly needed and not already there
  if (subscriptionCheck && !subscriptionCheck.hasAccess && pathname !== "/subscription" && !pathname.startsWith("/subscription")) {
    // Only redirect if subscription is explicitly expired/cancelled
    // Don't redirect for trial users - they should see dashboard
    if (subscriptionCheck.message && (subscriptionCheck.message.includes('expired') || subscriptionCheck.message.includes('cancelled'))) {
      setTimeout(() => {
        router.push("/subscription")
      }, 100)
      return <CookingLoader text="Redirecting to subscription..." />
    }
    // For trial users, show dashboard anyway
  }

  // Always show dashboard if we have session - don't block on anything
  if (!session && !isLoading && !isInitializing) {
    return <CookingLoader text="Redirecting..." />
  }

  // If we have session, show dashboard immediately
  // Use session.name if available, otherwise use a default
  const userName = session?.name || "User"

  return (
    <SidebarProvider>
      <div className={cn("flex h-svh w-full overflow-hidden bg-background")}>
        <DashboardSidebar userName={userName} />
        <SidebarInset className="w-full flex-1 min-w-0">
          <DashboardHeader
            userName={userName}
            onMenuToggle={() => {}}
            onLogout={() => {
              logout()
              router.push("/")
            }}
          />
          <main className="flex-1 overflow-y-auto w-full h-full">
            <div className="w-full h-full p-4 lg:p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
