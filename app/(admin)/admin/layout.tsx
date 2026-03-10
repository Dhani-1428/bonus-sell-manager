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
      return
    }

    const checkSession = async () => {
      try {
        // Add a small delay to ensure cookies are available after redirect
        // This helps when coming from login page
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const response = await fetch("/api/admin/session", {
          cache: 'no-store', // Ensure fresh session check
          credentials: 'include' // Include cookies
        })
        const data = await response.json()

        if (!data.admin) {
          // Redirect immediately if no admin session
          console.log("No admin session found, redirecting to login")
          router.push("/admin/login")
          return
        }

        // Set admin immediately - this will trigger the panel to show
        console.log("Admin session found:", data.admin.email)
        setAdmin(data.admin)
        setIsLoading(false) // Stop loading immediately when admin is found
      } catch (error) {
        console.error("Session check error:", error)
        router.push("/admin/login")
      } finally {
        // Only set loading to false if we haven't already set admin
        if (!admin) {
          setIsLoading(false)
        }
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

  // Show loader only while checking session
  if (isLoading && !admin) {
    return <CookingLoader text="Loading admin panel..." />
  }

  // If no admin after loading, redirect (handled by useEffect)
  if (!admin && !isLoading) {
    return <CookingLoader text="Redirecting..." />
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

  // Fallback (shouldn't reach here)
  return <CookingLoader text="Loading admin panel..." />
}
