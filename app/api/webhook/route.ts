import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { sendSubscriptionConfirmationEmail } from "@/lib/email"
import { query } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

async function updateSubscription(
  userId: string,
  plan: "monthly" | "yearly",
  durationDays: number
): Promise<void> {
  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + durationDays)

  // Store subscription update via sync API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || "https://bonusfoodsellmanager.com"
  await fetch(`${baseUrl}/api/sync-subscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      plan,
      endDate: endDate.toISOString(),
    }),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        // For one-time payments (both 6‑month and 12‑month plans)
        if (session.mode === "payment" && session.payment_status === "paid") {
          const userId = session.metadata?.userId || session.client_reference_id
          const plan = (session.metadata?.plan || "yearly") as "monthly" | "yearly"

          if (userId) {
            // Treat "monthly" as 6‑month (180 days) and "yearly" as 12‑month (365 days)
            const durationDays = plan === "monthly" ? 180 : 365
            await updateSubscription(userId, plan, durationDays)
            console.log(`Subscription activated for user ${userId} - ${plan} plan`)
            
            // Send subscription confirmation email
            try {
              const [users] = await query(
                `SELECT name, email, subscription_end_date FROM users WHERE id = ?`,
                [userId]
              ) as any[]
              
              if (users.length > 0) {
                const user = users[0]
                await sendSubscriptionConfirmationEmail(
                  user.email,
                  user.name,
                  plan,
                  user.subscription_end_date || new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
                )
              }
            } catch (emailError: any) {
              console.error("Failed to send subscription confirmation email:", emailError)
              // Don't fail the webhook if email fails
            }
          }
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.userId || subscription.metadata?.client_reference_id
          
          if (userId) {
            // Renew subscription for another fixed period
            const plan = (subscription.metadata?.plan || "monthly") as "monthly" | "yearly"
            const durationDays = plan === "monthly" ? 180 : 365
            await updateSubscription(userId, plan, durationDays)
            console.log(`Subscription renewed for user ${userId} - ${plan} plan`)
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId || subscription.metadata?.client_reference_id
        
        if (userId) {
          // Handle subscription cancellation
          console.log(`Subscription cancelled for user ${userId}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    )
  }
}
