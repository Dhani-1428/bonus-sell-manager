"use client"

import { ArrowLeft } from "lucide-react"
import { SignIn } from "@clerk/nextjs"

const clerkAppearance = {
  elements: {
    rootBox: "mx-auto w-full",
    card: "shadow-none border border-border bg-card rounded-xl",
    headerTitle: "text-2xl font-bold tracking-tight text-foreground",
    headerSubtitle: "text-sm text-muted-foreground",
    socialButtonsBlockButton: "border border-border bg-card text-foreground hover:bg-accent transition-colors rounded-lg h-11",
    socialButtonsBlockButtonText: "text-foreground font-medium text-sm",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground text-sm",
    formFieldLabel: "text-foreground font-medium text-sm",
    formFieldInput: "bg-background border-border text-foreground rounded-lg h-11 focus:ring-2 focus:ring-primary focus:border-primary",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold transition-colors h-11 text-sm",
    footerActionLink: "text-primary hover:text-primary/80 font-medium text-sm",
    footerActionText: "text-muted-foreground text-sm",
    identityPreviewText: "text-foreground text-sm",
    identityPreviewEditButton: "text-primary hover:text-primary/80 text-sm",
    formFieldSuccessText: "text-green-500 text-sm",
    formFieldErrorText: "text-destructive text-sm",
    alertText: "text-destructive text-sm",
    formResendCodeLink: "text-primary hover:text-primary/80 text-sm",
    otpCodeFieldInput: "bg-background border-border text-foreground rounded-lg focus:ring-2 focus:ring-primary",
  },
  variables: {
    colorPrimary: "var(--color-primary)",
    colorBackground: "var(--color-background)",
    colorInputBackground: "var(--color-background)",
    colorInputText: "var(--color-foreground)",
    colorText: "var(--color-foreground)",
    colorTextSecondary: "var(--color-muted-foreground)",
    colorDanger: "var(--color-destructive)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-sans)",
  },
}

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
