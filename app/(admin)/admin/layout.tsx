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
        const response = await fetch("/api/admin/session")
        const data = await response.json()

        if (!data.admin) {
          router.push("/admin/login")
          return
        }

        setAdmin(data.admin)
      } catch (error) {
        console.error("Session check error:", error)
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
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

  if (isLoading && pathname !== "/admin/login") {
    return <CookingLoader text="Loading admin panel..." />
  }

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  if (!admin) {
    return <CookingLoader text="Redirecting..." />
  }

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
