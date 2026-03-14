import { NextResponse } from "next/server"

/**
 * Diagnostic endpoint to check Stripe configuration
 * Only available in development mode for security
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    )
  }

  const hasSecretKey = !!process.env.STRIPE_SECRET_KEY
  const hasPublishableKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET

  return NextResponse.json({
    configured: hasSecretKey && hasPublishableKey,
    hasSecretKey,
    hasPublishableKey,
    hasWebhookSecret,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY
      ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + "..."
      : "not set",
    publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 7) + "..."
      : "not set",
  })
}
