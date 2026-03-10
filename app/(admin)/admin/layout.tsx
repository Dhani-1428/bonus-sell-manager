"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { CookingLoader } from "@/components/cooking-loader"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    // Don't check session on login page
    if (pathname === "/admin/login") {
      setIsLoading(false)
      setAdmin(null)
      return
    }

    const checkSession = async () => {
      // Don't show loader - check session silently in background
      try {
        // Small delay to ensure cookies are available after redirect
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const response = await fetch("/api/admin/session", {
          cache: 'no-store',
          credentials: 'include'
        })
        
        const data = await response.json()

        if (!data.admin) {
          // Redirect immediately if no admin session
          setAdmin(null)
          setIsLoading(false)
          router.push("/admin/login")
          return
        }

        // Set admin immediately - panel will show without loader
        setAdmin(data.admin)
        setIsLoading(false)
      } catch (error) {
        console.error("Session check error:", error)
        setAdmin(null)
        setIsLoading(false)
        router.push("/admin/login")
      }
    }

    checkSession()
  }, [router, pathname])

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  // Show admin panel immediately when admin data is available
  if (admin) {
    return (
      <SidebarProvider>
        <div className={cn("flex h-svh w-full overflow-hidden bg-background")}>
          <AdminSidebar userName={admin.name || admin.email} />
          <SidebarInset className="w-full flex-1 min-w-0">
            <DashboardHeader
              userName={admin.name || admin.email}
              onMenuToggle={() => {}}
              onLogout={handleLogout}
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

  // Show loader only if still loading and not on login page
  if (isLoading && pathname !== "/admin/login") {
    return <CookingLoader text="Loading admin panel..." />
  }

  // If no admin after loading, redirect (handled by useEffect)
  // Show nothing while redirecting
  return null
}
