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

  // Handle redirect if no session - but be very patient
  useEffect(() => {
    // Give session plenty of time to load (3 seconds)
    if (isLoading) {
      return // Still loading, wait
    }
    
    // Only redirect if we're absolutely certain there's no session
    if (!session) {
      const timer = setTimeout(async () => {
        // Final check before redirecting
        try {
          const response = await fetch("/api/auth/session")
          const data = await response.json()
          if (!data.user) {
            console.log("❌ No session found after waiting, redirecting to home")
            router.push("/")
          } else {
            console.log("✅ Session found, staying on dashboard")
          }
        } catch (error) {
          console.error("Session check failed:", error)
          // Don't redirect on network errors - might be temporary
        }
      }, 3000) // Wait 3 seconds before redirecting
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
          
          // DON'T automatically redirect to subscription page
          // Let users stay on dashboard - they can navigate to subscription page manually if needed
          // Only show subscription status in UI, don't force redirect
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

  // Show loader only if we're loading AND don't have session yet
  // If we have session, show dashboard immediately
  if (isLoading && !session) {
    return <CookingLoader text="Loading dashboard..." />
  }

  // If we have session, ALWAYS show dashboard - don't block on anything
  if (session) {
    const userName = session.name || "User"
    
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

  // Only show redirecting if we're sure there's no session and not loading
  if (!isLoading && !session) {
    return <CookingLoader text="Redirecting..." />
  }

  // Fallback - show loader while waiting
  return <CookingLoader text="Loading..." />

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
