"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import type { AuthSession } from "@/lib/types"
import { useRouter } from "next/navigation"

interface AuthContextType {
  session: AuthSession | null
  isLoading: boolean
  showSuccessAnimation: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  hideSuccessAnimation: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const router = useRouter()

  // Check session on mount and when needed
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session")
      const data = await response.json()

      if (data.user) {
        setSession({
          userId: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role || 'user',
        })
      } else {
        setSession(null)
      }
    } catch (error) {
      console.error("Session check error:", error)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to login" }
      }

      // Set session immediately
      const newSession = {
        userId: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role || 'user',
      }
      setSession(newSession)
      
      // Initialize user data in localStorage (client-side)
      if (typeof window !== "undefined") {
        try {
          // Import and use initializeUserData from lib/auth
          const { initializeUserData } = await import("@/lib/auth")
          initializeUserData(data.user.id, data.user.name, data.user.email)

          // Migrate localStorage data to database if it exists
          const { hasLocalStorageData, migrateLocalStorageToDatabase } = await import("@/lib/migrate-localStorage-to-db")
          if (hasLocalStorageData(data.user.id)) {
            console.log("Found localStorage data, migrating to database...")
            const migrationResult = await migrateLocalStorageToDatabase(data.user.id)
            if (migrationResult.success) {
              console.log("✅ Migration successful:", migrationResult.migrated)
            } else {
              console.warn("⚠️ Migration had errors:", migrationResult.errors)
            }
          }
        } catch (err) {
          console.warn("Failed to initialize user data:", err)
          // Continue anyway - user data will be initialized on first dashboard load
        }
      }
      
      // Refresh session to ensure it's up to date
      await checkSession()
      
      setShowSuccessAnimation(true)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "An error occurred" }
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to create account" }
      }

      // Set session immediately
      const newSession = {
        userId: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role || 'user',
      }
      setSession(newSession)
      
      // Initialize user data in localStorage (client-side)
      if (typeof window !== "undefined") {
        try {
          // Import and use initializeUserData from lib/auth
          const { initializeUserData } = await import("@/lib/auth")
          initializeUserData(data.user.id, data.user.name, data.user.email)

          // Migrate localStorage data to database if it exists
          const { hasLocalStorageData, migrateLocalStorageToDatabase } = await import("@/lib/migrate-localStorage-to-db")
          if (hasLocalStorageData(data.user.id)) {
            console.log("Found localStorage data, migrating to database...")
            const migrationResult = await migrateLocalStorageToDatabase(data.user.id)
            if (migrationResult.success) {
              console.log("✅ Migration successful:", migrationResult.migrated)
            } else {
              console.warn("⚠️ Migration had errors:", migrationResult.errors)
            }
          }
        } catch (err) {
          console.warn("Failed to initialize user data:", err)
          // Continue anyway - user data will be initialized on first dashboard load
        }
      }
      
      // Refresh session to ensure it's up to date
      await checkSession()
      
      setShowSuccessAnimation(true)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "An error occurred" }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setSession(null)
      setShowSuccessAnimation(false)
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }, [router])

  const hideSuccessAnimation = useCallback(() => {
    setShowSuccessAnimation(false)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        showSuccessAnimation,
        login,
        signup,
        logout,
        hideSuccessAnimation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
