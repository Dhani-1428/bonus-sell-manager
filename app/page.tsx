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

export default function LandingPage() {
  const { session, isLoading, showSuccessAnimation, hideSuccessAnimation } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<"landing" | "login" | "signup">("landing")
  const [showAnimation, setShowAnimation] = useState(false)

  // Handle hash routing for Clerk
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash
      if (hash === "#login" || hash === "#sign-in") {
        setView("login")
      } else if (hash === "#signup" || hash === "#sign-up") {
        setView("signup")
      }
    }
  }, [])

  // Check if we're coming from successful auth
  useEffect(() => {
    if (typeof window !== "undefined" && session) {
      const params = new URLSearchParams(window.location.search)
      if (params.get("auth") === "success") {
        setShowAnimation(true)
        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname)
      }
    }
  }, [session])

  // Handle redirects after animation completes
  const handleAnimationComplete = () => {
    setShowAnimation(false)
    hideSuccessAnimation()
    // Use setTimeout to ensure this happens after render
    setTimeout(() => {
      router.push("/dashboard")
    }, 0)
  }

  // Handle redirect to dashboard when session exists (but not showing animation)
  useEffect(() => {
    if (!isLoading && session && !showAnimation) {
      // Use setTimeout to ensure this happens after render
      setTimeout(() => {
        router.push("/dashboard")
      }, 0)
    }
  }, [session, isLoading, showAnimation, router])

  // Show success animation if authentication just succeeded
  if (showAnimation && session) {
    return <AuthSuccessAnimation onComplete={handleAnimationComplete} />
  }

  if (isLoading) {
    return <CookingLoader text="Preparing your kitchen..." />
  }

  if (session && !showAnimation) {
    return <CookingLoader text="Opening your dashboard..." />
  }

  if (view === "login") {
    return <LoginForm onBack={() => setView("landing")} onSwitchToSignup={() => setView("signup")} />
  }

  if (view === "signup") {
    return <SignupForm onBack={() => setView("landing")} onSwitchToLogin={() => setView("login")} />
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
