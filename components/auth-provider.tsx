"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import type { AuthSession } from "@/lib/types"
import { getCurrentSession, login as authLogin, signup as authSignup, logout as authLogout } from "@/lib/auth"

interface AuthContextType {
  session: AuthSession | null
  isLoading: boolean
  login: (email: string, password: string) => { success: boolean; error?: string }
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const current = getCurrentSession()
    setSession(current)
    setIsLoading(false)
  }, [])

  const login = useCallback((email: string, password: string) => {
    const result = authLogin(email, password)
    if (result.success) {
      setSession(getCurrentSession())
    }
    return result
  }, [])

  const signup = useCallback((name: string, email: string, password: string) => {
    const result = authSignup(name, email, password)
    if (result.success) {
      setSession(getCurrentSession())
    }
    return result
  }, [])

  const logout = useCallback(() => {
    authLogout()
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, isLoading, login, signup, logout }}>
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
