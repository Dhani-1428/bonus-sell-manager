"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { CookingLoader } from "@/components/cooking-loader"
import { AuthSuccessAnimation } from "@/components/auth-success-animation"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/sections/hero"
import { AboutSection } from "@/components/sections/about"
import { FeaturesSection } from "@/components/sections/features"
import { PricingSection } from "@/components/sections/pricing"
import { TestimonialsSection } from "@/components/sections/testimonials"
import { FaqSection } from "@/components/sections/faq"
import { ContactSection } from "@/components/sections/contact"
import { Footer } from "@/components/footer"
import { FloatingButtons } from "@/components/floating-buttons"
import { redirectToDashboard } from "@/lib/redirect"

export default function LandingPage() {
  const { session, isLoading, showSuccessAnimation, hideSuccessAnimation } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<"landing" | "login" | "signup">("landing")
  const [showAnimation, setShowAnimation] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [redirectTimeout, setRedirectTimeout] = useState(false)

  // Timeout fallback for loading state - prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn("Loading timeout - showing content anyway")
        setLoadingTimeout(true)
      }
    }, 3000) // 3 second timeout
    
    return () => clearTimeout(timer)
  }, [isLoading])

  // Handle hash routing and error parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash
      const urlParams = new URLSearchParams(window.location.search)
      const error = urlParams.get("error")
      
      // Show error toast if error parameter exists
      if (error) {
        // Import toast dynamically to avoid SSR issues
        import("sonner").then(({ toast }) => {
          toast.error(decodeURIComponent(error))
        })
        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname + window.location.hash)
      }
      
      if (hash === "#login" || hash === "#sign-in") {
        setView("login")
      } else if (hash === "#signup" || hash === "#sign-up") {
        setView("signup")
      }
    }
  }, [])

  // Check if we're coming from successful auth
  useEffect(() => {
    if (typeof window !== "undefined" && session && showSuccessAnimation) {
      setShowAnimation(true)
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [session, showSuccessAnimation])

  // Handle redirects after animation completes
  const handleAnimationComplete = () => {
    setShowAnimation(false)
    hideSuccessAnimation()
    // Redirect immediately after animation - use window.location.href for reliable redirect
    if (session && typeof window !== "undefined") {
      console.log('🔄 Animation complete, redirecting to dashboard, session:', session);
      redirectToDashboard(session)
    }
  }

  // Timeout for redirect loader - if redirect doesn't happen, show content
  useEffect(() => {
    if (session && !showAnimation && !hasRedirected) {
      const timer = setTimeout(() => {
        console.warn("Redirect timeout - showing content anyway")
        setRedirectTimeout(true)
      }, 2000) // 2 second timeout for redirect
      
      return () => clearTimeout(timer)
    }
  }, [session, showAnimation, hasRedirected])

  // Handle redirect to dashboard when session exists
  // Only redirect if we're on the home page - don't redirect if already on dashboard
  // Also check for logout flag to prevent auto-login after logout
  useEffect(() => {
    // Check for logout flag first - if present, don't auto-redirect
    if (typeof window !== "undefined") {
      const logoutFlag = document.cookie.split('; ').find(row => row.startsWith('logout_flag='))
      if (logoutFlag) {
        console.log("🚫 Logout flag detected - preventing auto-redirect")
        // Clear the logout flag cookie
        document.cookie = "logout_flag=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        return // Don't redirect
      }
    }

    if ((!isLoading || loadingTimeout) && session && !hasRedirected) {
      // Only redirect if we're on the home page (pathname is "/")
      // Don't redirect if already on dashboard or other pages
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname
        const currentHash = window.location.hash
        // Allow redirect from home page (with or without hash)
        if (currentPath === "/") {
          // Mark as redirected immediately to prevent multiple redirects
          setHasRedirected(true)
          
          // If showing animation, wait for it to complete
          if (showAnimation) {
            // Animation will handle redirect via handleAnimationComplete
            return
          }
          
          // Otherwise redirect immediately
          console.log('🔄 Redirecting to dashboard, session:', session, 'path:', currentPath, 'hash:', currentHash);
          redirectToDashboard(session);
        }
      }
    }
  }, [session, isLoading, loadingTimeout, showAnimation, hasRedirected])

  // Show success animation if authentication just succeeded
  if (showAnimation && session) {
    return <AuthSuccessAnimation onComplete={handleAnimationComplete} />
  }

  // Show loading only briefly - don't block content forever
  if (isLoading && !loadingTimeout && !session) {
    return <CookingLoader text="Preparing your kitchen..." />
  }

  // If user has session and we're on home page, redirect immediately (fallback)
  if (session && !showAnimation && typeof window !== "undefined" && !hasRedirected) {
    const currentPath = window.location.pathname
    // Only redirect from home page
    if (currentPath === "/") {
      // Redirect immediately - don't wait
      setHasRedirected(true)
      console.log('🔄 Immediate redirect to dashboard (fallback), session:', session);
      redirectToDashboard(session)
      // Show loader while redirecting
      return <CookingLoader text="Opening your dashboard..." />
    }
  }

  // If redirect was attempted but we're still here, show content anyway
  // This prevents infinite loading if redirect fails
  // Also show content if no session (user not logged in)

  if (view === "login") {
    return (
      <LoginForm
        onBack={() => setView("landing")}
        onSwitchToSignup={() => setView("signup")}
        onSuccess={() => setShowAnimation(true)}
      />
    )
  }

  if (view === "signup") {
    return (
      <SignupForm
        onBack={() => setView("landing")}
        onSwitchToLogin={() => setView("login")}
        onSuccess={() => setShowAnimation(true)}
      />
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <Navbar onLogin={() => setView("login")} onSignup={() => setView("signup")} />
      <main>
        <HeroSection onGetStarted={() => setView("signup")} />
        <AboutSection />
        <FeaturesSection />
        <PricingSection onGetStarted={() => setView("signup")} />
        <TestimonialsSection />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  )
}
