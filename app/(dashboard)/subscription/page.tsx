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
    
    // Scroll to subscription plans if coming from email link
    const hash = window.location.hash
    if (hash === '#subscribe' || hash === '#plans') {
      setTimeout(() => {
        const plansSection = document.getElementById('subscription-plans')
        if (plansSection) {
          plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 500)
    }
    
    return () => clearInterval(interval)
  }, [refreshStatus])

  // Handle Stripe redirect
  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")
    
    if (success === "true") {
      toast.success("Payment successful! Your subscription is now active.")
      refreshStatus()
      // Clean URL - use setTimeout to ensure this happens after render
      setTimeout(() => {
        router.replace("/subscription")
      }, 0)
    } else if (canceled === "true") {
      toast.info("Payment canceled. You can try again anytime.")
      // Clean URL - use setTimeout to ensure this happens after render
      setTimeout(() => {
        router.replace("/subscription")
      }, 0)
    }
  }, [searchParams, router, refreshStatus])

  const handleSubscribe = (plan: "monthly" | "yearly") => {
    if (!session) return
    // Go to MB WAY checkout page where user will see number and confirm payment
    router.push(`/subscription/checkout?plan=${plan}`)
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
    <div className="flex flex-col gap-6 w-full h-full">
      <div>
        <h2 className="text-2xl font-bold text-black">Subscription</h2>
        <p className="text-sm text-gray-600">Manage your subscription and billing</p>
      </div>

      {/* Current Status and Payment Info - Two equal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* Current Status (3D card) */}
        <CardContainer className="inter-var h-full">
          <ThreeDCardBody className="bg-white border border-sidebar rounded-xl h-full p-4 md:p-6">
          <CardItem translateZ="40">
            <CardHeader className="pb-4">
              <CardTitle className="text-black">Current Status</CardTitle>
              <CardDescription className="text-gray-600">Your subscription and trial information</CardDescription>
            </CardHeader>
          </CardItem>
          <CardItem translateZ="80">
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full shrink-0 ${
                    subscriptionStatus.hasAccess
                      ? "bg-sidebar/10 text-sidebar"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {subscriptionStatus.hasAccess ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <X className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-black">
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
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-sidebar/10 text-sidebar">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{subscriptionStatus.message}</p>
                  {subscriptionStatus.daysRemaining > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">
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

      {/* Secure Payment (3D card) */}
      <CardContainer className="inter-var h-full">
        <ThreeDCardBody className="bg-white rounded-xl border border-sidebar h-full p-4 md:p-6">
          <CardItem translateZ="40">
            <CardHeader className="pb-4">
              <CardTitle className="text-black">Payment via MB WAY</CardTitle>
              <CardDescription className="text-gray-600">Manual payment and approval information</CardDescription>
            </CardHeader>
          </CardItem>
          <CardItem translateZ="80">
            <CardContent className="pt-0">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-sidebar shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black mb-2">MB WAY Payment</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    You can pay your subscription using <strong>MB WAY</strong>. After you choose a plan, you will be guided
                    through a short checkout step to see the MB WAY details and confirm your payment. Your payment will then be
                    reviewed by our super admin, and once it is <strong>approved</strong> your admin panel access will be unlocked
                    or extended.
                  </p>
                </div>
              </div>
            </CardContent>
          </CardItem>
        </ThreeDCardBody>
      </CardContainer>
      </div>

      {/* Subscription Plans - always visible so user can easily subscribe/upgrade */}
      <div id="subscription-plans">
        <h3 className="text-lg font-semibold text-black mb-4">Choose a Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <CardContainer key={plan.name} className="inter-var">
              <ThreeDCardBody
                className={`rounded-xl border p-4 ${
                  plan.popular ? "border-white ring-1 ring-white/40 bg-sidebar" : "border-white bg-sidebar"
                }`}
              >
                <CardItem translateZ="40">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {plan.popular && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-sidebar/10 text-sidebar">
                              Best Value
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <span className="text-2xl font-bold text-white">{plan.price}</span>
                          <span className="text-white/80"> {plan.period}</span>
                        </CardDescription>
                      </div>
                      {plan.name === "6 Months" && <Zap className="h-8 w-8 text-white/80" />}
                      {plan.name === "12 Months" && <Crown className="h-8 w-8 text-white" />}
                    </div>
                  </CardHeader>
                </CardItem>
                <CardItem translateZ="80">
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-sidebar shrink-0 mt-0.5" />
                          <span className="text-sm text-white">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSubscribe(plan.plan)}
                      disabled={isProcessing}
                      className={`w-full ${
                        plan.popular 
                          ? "bg-sidebar text-white hover:bg-sidebar/90" 
                          : "bg-white border border-sidebar text-black hover:bg-sidebar hover:text-white"
                      }`}
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
          <ThreeDCardBody className="bg-sidebar border border-white rounded-xl">
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
                    <span className="text-sm text-white/80">Plan</span>
                    <span className="font-medium text-white capitalize">
                      {subscriptionStatus.plan || "Monthly"}
                    </span>
                  </div>
                  {subscriptionStatus.subscriptionEndDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80">Renews on</span>
                      <span className="font-medium text-white">
                        {new Date(subscriptionStatus.subscriptionEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Status</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-sidebar/10 text-sidebar">
                      Active
                    </span>
                  </div>
                </div>
              </CardContent>
            </CardItem>
          </ThreeDCardBody>
        </CardContainer>
      )}

    </div>
  )
}
