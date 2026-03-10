"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
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
    // Redirect immediately after animation
    if (session) {
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

  // Handle redirect to dashboard when session exists (but not showing animation)
  // Only redirect if we're on the home page - don't redirect if already on dashboard
  useEffect(() => {
    if ((!isLoading || loadingTimeout) && session && !showAnimation && !hasRedirected && !redirectTimeout) {
      // Only redirect if we're on the home page (pathname is "/")
      // Don't redirect if already on dashboard or other pages
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname
        if (currentPath === "/" || currentPath === "/#login" || currentPath === "/#signup") {
          // Use a small delay to prevent infinite loops and mark as redirected
          setHasRedirected(true)
          const timer = setTimeout(() => {
            console.log('🔄 Redirecting to dashboard, session:', session);
            redirectToDashboard(session);
          }, 200);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [session, isLoading, loadingTimeout, showAnimation, hasRedirected, redirectTimeout])

  // Show success animation if authentication just succeeded
  if (showAnimation && session) {
    return <AuthSuccessAnimation onComplete={handleAnimationComplete} />
  }

  // Show content immediately - no loaders

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
