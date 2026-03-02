"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { getUserById, getSubscriptionStatus, syncServerUpdates } from "@/lib/subscription"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Clock, CreditCard, Zap, Crown } from "lucide-react"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { CardBody as ThreeDCardBody, CardContainer, CardItem } from "@/components/ui/3d-card"

export default function SubscriptionPage() {
  const { session } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscriptionStatus, setSubscriptionStatus] = useState<ReturnType<typeof getSubscriptionStatus> | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const refreshStatus = useCallback(async () => {
    if (session) {
      // Sync server-side updates first
      await syncServerUpdates(session.userId)
      
      const user = getUserById(session.userId)
      if (user) {
        setSubscriptionStatus(getSubscriptionStatus(user))
      }
    }
  }, [session])

  useEffect(() => {
    refreshStatus()
    // Refresh status every minute to update days remaining
    const interval = setInterval(refreshStatus, 60000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  // Handle Stripe redirect
  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")
    
    if (success === "true") {
      toast.success("Payment successful! Your subscription is now active.")
      refreshStatus()
      // Clean URL
      router.replace("/subscription")
    } else if (canceled === "true") {
      toast.info("Payment canceled. You can try again anytime.")
      router.replace("/subscription")
    }
  }, [searchParams, router, refreshStatus])

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    if (!session) return

    setIsProcessing(true)
    try {
      // Create Stripe checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          userId: session.userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error: any) {
      console.error("Subscription error:", error)
      toast.error(error.message || "Failed to start checkout. Please try again.")
      setIsProcessing(false)
    }
  }

  if (!subscriptionStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading subscription status...</div>
      </div>
    )
  }

  const plans = [
    {
      name: "6 Months",
      price: "€120",
      period: "/ 6 months",
      plan: "monthly" as const, // internally treated as 6‑month period
      features: [
        "Unlimited orders & menu items",
        "Full dashboard & reports",
        "CSV export",
        "1 user account",
        "Email support",
        "All future updates",
      ],
      popular: false,
    },
    {
      name: "12 Months",
      price: "€199",
      period: "/ year",
      plan: "yearly" as const, // internally treated as 12‑month period
      features: [
        "Everything in 6 Months plan",
        "Unlimited user accounts",
        "Priority support",
        "Advanced analytics",
        "Custom categories",
        "Early access to new features",
      ],
      popular: true,
    },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Subscription</h2>
        <p className="text-sm text-muted-foreground">Manage your subscription and billing</p>
      </div>

      {/* Current Status (3D card) */}
      <CardContainer className="inter-var">
        <ThreeDCardBody className="bg-background border border-border rounded-xl">
          <CardItem translateZ="40">
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
              <CardDescription>Your subscription and trial information</CardDescription>
            </CardHeader>
          </CardItem>
          <CardItem translateZ="80">
            <CardContent>
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    subscriptionStatus.hasAccess
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {subscriptionStatus.hasAccess ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <X className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {subscriptionStatus.status === "trial" && "Free Trial"}
                      {subscriptionStatus.status === "active" && "Active Subscription"}
                      {subscriptionStatus.status === "expired" && "Subscription Expired"}
                      {subscriptionStatus.status === "cancelled" && "Subscription Cancelled"}
                    </p>
                    {subscriptionStatus.status === "trial" && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-500">
                        Trial
                      </span>
                    )}
                    {subscriptionStatus.status === "active" && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{subscriptionStatus.message}</p>
                  {subscriptionStatus.daysRemaining > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {subscriptionStatus.daysRemaining} day{subscriptionStatus.daysRemaining !== 1 ? "s" : ""} remaining
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </CardItem>
        </ThreeDCardBody>
      </CardContainer>

      {/* Subscription Plans - always visible so user can easily subscribe/upgrade */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Choose a Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <CardContainer key={plan.name} className="inter-var">
              <ThreeDCardBody
                className={`rounded-xl border p-4 ${
                  plan.popular ? "border-primary ring-1 ring-primary/40" : "border-border bg-background"
                }`}
              >
                <CardItem translateZ="40">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {plan.popular && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                              Best Value
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                          <span className="text-muted-foreground"> {plan.period}</span>
                        </CardDescription>
                      </div>
                      {plan.name === "6 Months" && <Zap className="h-8 w-8 text-muted-foreground" />}
                      {plan.name === "12 Months" && <Crown className="h-8 w-8 text-primary" />}
                    </div>
                  </CardHeader>
                </CardItem>
                <CardItem translateZ="80">
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSubscribe(plan.plan)}
                      disabled={isProcessing}
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {isProcessing
                        ? "Processing..."
                        : subscriptionStatus.hasAccess && subscriptionStatus.status === "active"
                        ? "Change / Extend Plan"
                        : `Get Started`}
                    </Button>
                  </CardContent>
                </CardItem>
              </ThreeDCardBody>
            </CardContainer>
          ))}
        </div>
      </div>

      {/* Active Subscription Info (3D card) */}
      {subscriptionStatus.hasAccess && subscriptionStatus.status === "active" && (
        <CardContainer className="inter-var">
          <ThreeDCardBody className="bg-background border border-border rounded-xl">
            <CardItem translateZ="40">
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>Your active subscription information</CardDescription>
              </CardHeader>
            </CardItem>
            <CardItem translateZ="80">
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="font-medium text-foreground capitalize">
                      {subscriptionStatus.plan || "Monthly"}
                    </span>
                  </div>
                  {subscriptionStatus.subscriptionEndDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Renews on</span>
                      <span className="font-medium text-foreground">
                        {new Date(subscriptionStatus.subscriptionEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                      Active
                    </span>
                  </div>
                </div>
              </CardContent>
            </CardItem>
          </ThreeDCardBody>
        </CardContainer>
      )}

      {/* Payment Info (3D card) */}
      <CardContainer className="inter-var">
        <ThreeDCardBody className="bg-muted/50 rounded-xl border border-border/40">
          <CardItem translateZ="40">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Secure Payment</p>
                  <p className="text-xs text-muted-foreground">
                    Payments are securely processed by Stripe. Your subscription will be activated immediately after successful payment.
                  </p>
                </div>
              </div>
            </CardContent>
          </CardItem>
        </ThreeDCardBody>
      </CardContainer>
    </div>
  )
}
