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

  useEffect(() => {
    if (session) {
      const user = getUserById(session.userId)
      if (user) {
        const status = getSubscriptionStatus(user)
        setSubscriptionCheck({ hasAccess: status.hasAccess, message: status.message })
        
        // Redirect to subscription page if no access (except if already on subscription page)
        // Allow subscription page to be accessible even without active subscription
        if (!status.hasAccess && pathname !== "/subscription" && !pathname.startsWith("/subscription")) {
          router.push("/subscription")
        }
      }
    }
  }, [session, pathname, router])

  if (isLoading) {
    return <CookingLoader text="Loading dashboard..." />
  }

  if (!session) {
    router.push("/")
    return <CookingLoader text="Redirecting..." />
  }

  // Show subscription page if no access (unless already on subscription page)
  // Allow subscription page to be accessible even without active subscription
  if (subscriptionCheck && !subscriptionCheck.hasAccess && pathname !== "/subscription" && !pathname.startsWith("/subscription")) {
    return <CookingLoader text="Checking subscription..." />
  }

  return (
    <SidebarProvider>
      <div className={cn("flex h-svh overflow-hidden bg-background")}>
        <DashboardSidebar userName={session.name} />
        <SidebarInset>
          <DashboardHeader
            userName={session.name}
            onMenuToggle={() => {}}
            onLogout={() => {
              logout()
              router.push("/")
            }}
          />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 w-full h-full">
            <div className="w-full h-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
