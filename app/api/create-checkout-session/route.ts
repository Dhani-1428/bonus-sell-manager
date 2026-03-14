import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getAppUrl } from "@/lib/redirect"

// Initialize Stripe with error handling
let stripe: Stripe | null = null
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  }
} catch (error) {
  console.error("Failed to initialize Stripe:", error)
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe secret key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured")
      return NextResponse.json(
        { error: "Payment system not configured. Please contact support." },
        { status: 500 }
      )
    }

    // Check if Stripe was initialized
    if (!stripe) {
      console.error("Stripe initialization failed")
      return NextResponse.json(
        { error: "Payment system initialization failed. Please contact support." },
        { status: 500 }
    }

    // Validate Stripe key format
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey.startsWith("sk_") && !secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
      console.error("Invalid Stripe secret key format")
      return NextResponse.json(
        { error: "Invalid payment configuration. Please contact support." },
        { status: 500 }
      )
    }

    const { plan, userId } = await request.json()

    if (!plan || !userId) {
      console.error("Missing required parameters:", { plan, userId })
      return NextResponse.json({ error: "Missing plan or userId" }, { status: 400 })
    }

    // Plan pricing (in cents)
    const prices = {
      monthly: 12000, // €120 for 6 months
      yearly: 19900, // €199 for 12 months
    }

    const price = prices[plan as keyof typeof prices]
    if (!price) {
      console.error("Invalid plan:", plan)
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const appUrl = getAppUrl()
    console.log("Creating Stripe checkout session:", { plan, userId, price, appUrl })

    // Validate appUrl
    if (!appUrl || appUrl.includes("undefined")) {
      console.error("Invalid app URL:", appUrl)
      return NextResponse.json(
        { error: "Invalid application configuration. Please contact support." },
        { status: 500 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe!.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${plan === "monthly" ? "6 Months" : "12 Months"} Subscription`,
              description: `Bonus Food Sell Manager ${plan === "monthly" ? "6 Months" : "12 Months"} Plan`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      // Treat both as one‑time payments that unlock access for a fixed duration
      mode: "payment",
      success_url: `${appUrl}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscription?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
    })

    console.log("Stripe checkout session created:", session.id)
    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error("Stripe checkout error:", {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
    })
    
    // Provide more helpful error messages
    let errorMessage = "Failed to create checkout session"
    let errorDetails: string | undefined = undefined

    if (error.type === "StripeInvalidRequestError") {
      errorMessage = "Invalid payment configuration. Please check your Stripe API keys."
      errorDetails = error.message
    } else if (error.message?.includes("No such API key") || error.message?.includes("Invalid API Key")) {
      errorMessage = "Invalid Stripe API key. Please check your environment variables."
      errorDetails = "The Stripe secret key is invalid or expired."
    } else if (error.message?.includes("You must provide")) {
      errorMessage = "Missing required payment information."
      errorDetails = error.message
    } else if (error.message) {
      errorMessage = error.message
      errorDetails = error.stack
    }

    // In development, show more details
    const isDevelopment = process.env.NODE_ENV === "development"
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: isDevelopment ? errorDetails : undefined,
        type: error.type,
        code: error.code,
      },
      { status: 500 }
    )
  }
}
