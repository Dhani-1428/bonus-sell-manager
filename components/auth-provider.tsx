"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs"
import type { AuthSession } from "@/lib/types"
import { initializeUserData } from "@/lib/auth"

interface AuthContextType {
  session: AuthSession | null
  isLoading: boolean
  login: (email: string, password: string) => { success: boolean; error?: string }
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser()
  const { signOut } = useClerkAuth()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userLoaded) {
      setIsLoading(true)
      return
    }

    if (user) {
      // Initialize user data in localStorage if needed (for subscription system)
      initializeUserData(user.id, user.fullName || user.firstName || "User", user.primaryEmailAddress?.emailAddress || "")

      // Create session from Clerk user
      const authSession: AuthSession = {
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "User",
      }
      setSession(authSession)
    } else {
      setSession(null)
    }
    setIsLoading(false)
  }, [user, userLoaded])

  const login = useCallback((email: string, password: string) => {
    // Clerk handles login through their UI components
    // This is kept for compatibility but will redirect to Clerk sign-in
    return { success: false, error: "Please use the sign-in button to login." }
  }, [])

  const signup = useCallback((name: string, email: string, password: string) => {
    // Clerk handles signup through their UI components
    // This is kept for compatibility but will redirect to Clerk sign-up
    return { success: false, error: "Please use the sign-up button to create an account." }
  }, [])

  const logout = useCallback(async () => {
    await signOut()
    setSession(null)
    setShowSuccessAnimation(false)
    previousUserRef.current = null
  }, [signOut])

  const hideSuccessAnimation = useCallback(() => {
    setShowSuccessAnimation(false)
  }, [])

  return (
    <AuthContext.Provider value={{ session, isLoading, showSuccessAnimation, login, signup, logout, hideSuccessAnimation }}>
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
