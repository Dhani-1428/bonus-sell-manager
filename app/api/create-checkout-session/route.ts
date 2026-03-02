import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

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
      monthly: 2900, // $29.00
      yearly: 29000, // $290.00
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
            currency: "usd",
            product_data: {
              name: `${plan === "monthly" ? "Monthly" : "Yearly"} Subscription`,
              description: `SalesRocket ${plan === "monthly" ? "Monthly" : "Yearly"} Plan`,
            },
            unit_amount: price,
            recurring: plan === "monthly" ? { interval: "month" } : { interval: "year" },
          },
          quantity: 1,
        },
      ],
      mode: plan === "monthly" ? "subscription" : "payment",
      success_url: `${request.headers.get("origin") || "http://localhost:3000"}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin") || "http://localhost:3000"}/subscription?canceled=true`,
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
