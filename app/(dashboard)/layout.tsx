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

  // Handle redirect if no session
  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/")
    }
  }, [session, isLoading, router])

  useEffect(() => {
    if (session) {
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
          setSubscriptionCheck({ hasAccess: true, message: "Trial access" })
        }
      }, 100) // Small delay to allow initialization
      
      return () => clearTimeout(timer)
    } else {
      setSubscriptionCheck(null)
    }
  }, [session, pathname, router])

  if (isLoading) {
    return <CookingLoader text="Loading dashboard..." />
  }

  if (!session) {
    return <CookingLoader text="Redirecting..." />
  }

  // Show subscription page if no access (unless already on subscription page)
  // Allow subscription page to be accessible even without active subscription
  // Only show loader if we have a subscription check result and no access
  if (subscriptionCheck && !subscriptionCheck.hasAccess && pathname !== "/subscription" && !pathname.startsWith("/subscription")) {
    return <CookingLoader text="Checking subscription..." />
  }

  // If subscription check is still null but we have a session, show dashboard anyway
  // (user data might still be initializing - this prevents infinite loading)

  return (
    <SidebarProvider>
      <div className={cn("flex h-svh w-full overflow-hidden bg-background")}>
        <DashboardSidebar userName={session.name} />
        <SidebarInset className="w-full flex-1 min-w-0">
          <DashboardHeader
            userName={session.name}
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
