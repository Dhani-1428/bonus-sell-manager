// Clerk appearance configuration to match website theme
export const clerkAppearance = {
  baseTheme: "dark",
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
    // Using actual color values that match the dark theme
    colorPrimary: "#8b5cf6", // Purple/violet matching primary
    colorBackground: "#1a1a2e", // Dark background
    colorInputBackground: "#1a1a2e",
    colorInputText: "#f3f4f6", // Light text
    colorText: "#f3f4f6",
    colorTextSecondary: "#9ca3af", // Muted text
    colorDanger: "#ef4444", // Red for errors
    borderRadius: "0.625rem",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
  },
}
