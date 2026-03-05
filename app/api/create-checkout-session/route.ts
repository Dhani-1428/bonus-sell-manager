import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getAppUrl } from "@/lib/redirect"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: NextRequest) {
  try {
    const { plan, userId } = await request.json()

    if (!plan || !userId) {
      return NextResponse.json({ error: "Missing plan or userId" }, { status: 400 })
    }

    // Plan pricing (in cents)
    const prices = {
      monthly: 12000, // €120 for 6 months
      yearly: 19900, // €199 for 12 months
    }

    const price = prices[plan as keyof typeof prices]
    if (!price) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${plan === "monthly" ? "6 Months" : "12 Months"} Subscription`,
              description: `SalesRocket ${plan === "monthly" ? "6 Months" : "12 Months"} Plan`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      // Treat both as one‑time payments that unlock access for a fixed duration
      mode: "payment",
      success_url: `${getAppUrl()}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/subscription?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    )
  }
}
