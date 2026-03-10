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
    
    // Only redirect if we're absolutely sure there's no session after multiple checks
    if (!session) {
      const timer = setTimeout(() => {
        // Double check session one more time before redirecting
        const checkSession = async () => {
          try {
            const response = await fetch("/api/auth/session")
            const data = await response.json()
            if (!data.user) {
              // Only redirect if we're 100% sure there's no session
              // This prevents redirect loops
              console.log("No session found, redirecting to home")
              router.push("/")
            } else {
              // Session exists, don't redirect
              console.log("Session found, staying on dashboard")
            }
          } catch (error) {
            console.error("Session check failed:", error)
            // Don't redirect on error - might be temporary network issue
            // Only redirect if we're absolutely sure
          }
        }
        checkSession()
      }, 1000) // Longer delay to ensure session has time to load
      return () => clearTimeout(timer)
    }
  }, [session, isLoading, router])

  useEffect(() => {
    if (session) {
      // Initialize user data and migrate localStorage to database
      const initializeUserData = async () => {
        try {
          const user = getUserById(session.userId)
          if (!user) {
            // User not in localStorage - initialize it client-side
            const { initializeUserData: initUser } = await import("@/lib/auth")
            initUser(session.userId, session.name, session.email)
          }

          // Migrate localStorage data to database if it exists
          const { hasLocalStorageData, migrateLocalStorageToDatabase } = await import("@/lib/migrate-localStorage-to-db")
          if (hasLocalStorageData(session.userId)) {
            console.log("Found localStorage data, migrating to database...")
            const migrationResult = await migrateLocalStorageToDatabase(session.userId)
            if (migrationResult.success) {
              console.log("✅ Migration successful:", migrationResult.migrated)
            } else {
              console.warn("⚠️ Migration had errors:", migrationResult.errors)
            }
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

  // If we have a session, ALWAYS show dashboard immediately - don't block on anything
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

  // Only show loader/redirect if we don't have session
  if (isLoading || isInitializing) {
    return <CookingLoader text="Loading dashboard..." />
  }

  // No session and not loading - redirect to home
  return <CookingLoader text="Redirecting..." />

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
