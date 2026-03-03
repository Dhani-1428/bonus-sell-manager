"use client"

import { ArrowLeft } from "lucide-react"
import { SignIn } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"

export function LoginForm({
  onBack,
  onSwitchToSignup,
}: {
  onBack: () => void
  onSwitchToSignup: () => void
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your SalesRocket account</p>
        </div>

        <div className="flex justify-center">
          <SignIn
            appearance={clerkAppearance}
            routing="hash"
            signUpUrl="#signup"
            afterSignInUrl="/dashboard"
          />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <button onClick={onSwitchToSignup} className="font-medium text-primary hover:underline">
            Create one
          </button>
        </p>
      </div>
    </main>
  )
}
