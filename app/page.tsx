"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { CookingLoader } from "@/components/cooking-loader"
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
  const { session, isLoading } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<"landing" | "login" | "signup">("landing")

  // Handle hash routing for Clerk - MUST be called before any early returns
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

  // Handle redirects after hooks are called
  useEffect(() => {
    if (!isLoading && session) {
      router.push("/dashboard")
    }
  }, [session, isLoading, router])

  if (isLoading) {
    return <CookingLoader text="Preparing your kitchen..." />
  }

  if (session) {
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
