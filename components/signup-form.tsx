"use client"

import { ArrowLeft } from "lucide-react"
import { SignUp } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"

export function SignupForm({
  onBack,
  onSwitchToLogin,
}: {
  onBack: () => void
  onSwitchToLogin: () => void
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground">Get your own admin panel with sample data to explore</p>
        </div>

        <div className="flex justify-center">
          <SignUp
            appearance={clerkAppearance}
            routing="hash"
            signInUrl="#login"
            afterSignUpUrl="/dashboard"
            afterSignUp={() => {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("clerk-auth-flow", "true")
              }
            }}
          />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} className="font-medium text-primary hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </main>
  )
}
