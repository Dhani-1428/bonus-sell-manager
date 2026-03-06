"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

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
      } catch (error) {
        console.error("Session check error:", error)
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [router, pathname])

  if (isLoading && pathname !== "/admin/login") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
