"use client"

import { ArrowLeft } from "lucide-react"
import { SignUp } from "@clerk/nextjs"

const clerkAppearance = {
  elements: {
    rootBox: "mx-auto w-full",
    card: "shadow-none border border-border bg-card rounded-xl",
    headerTitle: "text-2xl font-bold tracking-tight text-foreground",
    headerSubtitle: "text-sm text-muted-foreground",
    socialButtonsBlockButton: "border border-border bg-card text-foreground hover:bg-accent transition-colors rounded-lg",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground",
    formFieldLabel: "text-foreground font-medium",
    formFieldInput: "bg-background border-border text-foreground rounded-lg focus:ring-2 focus:ring-primary",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold transition-colors",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    footerActionText: "text-muted-foreground",
    identityPreviewText: "text-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
    formFieldSuccessText: "text-green-500",
    formFieldErrorText: "text-destructive",
    alertText: "text-destructive",
    formResendCodeLink: "text-primary hover:text-primary/80",
  },
  variables: {
    colorPrimary: "hsl(var(--primary))",
    colorBackground: "hsl(var(--background))",
    colorInputBackground: "hsl(var(--background))",
    colorInputText: "hsl(var(--foreground))",
    colorText: "hsl(var(--foreground))",
    colorTextSecondary: "hsl(var(--muted-foreground))",
    colorDanger: "hsl(var(--destructive))",
    borderRadius: "0.625rem",
    fontFamily: "var(--font-sans)",
  },
}

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
