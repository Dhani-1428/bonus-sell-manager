"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, CreditCard } from "lucide-react"
import { toast } from "sonner"

const MBWAY_PHONE = "+351920306889"
const MBWAY_NAME = "Sheetal Sheetal"

export default function MbwayCheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const plan = (searchParams.get("plan") as "monthly" | "yearly") || "monthly"

  useEffect(() => {
    if (!session) {
      router.push("/subscription")
    }
  }, [session, router])

  const amount = plan === "monthly" ? 120 : 199
  const planLabel = plan === "monthly" ? "6 Months" : "12 Months"

  const handleConfirmPayment = async () => {
    if (!session) return
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/create-mbway-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          userId: session.userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create MB WAY payment request")
      }

      toast.success("Your MB WAY payment is pending. We will email you once it is reviewed.")
      router.push("/subscription")
    } catch (error: any) {
      console.error("MB WAY checkout error:", error)
      toast.error(error.message || "Failed to confirm MB WAY payment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div>
        <h2 className="text-2xl font-bold text-black">Confirm MB WAY Payment</h2>
        <p className="text-sm text-gray-600">Review your subscription and confirm your MB WAY payment request.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <Card className="h-full bg-white text-black border border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">Subscription Summary</CardTitle>
            <CardDescription className="text-gray-600">
              Your selected subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-black">{planLabel} Plan</p>
                  <p className="text-sm text-gray-600">
                    {amount} EUR • {plan === "monthly" ? "Access for 6 months" : "Access for 12 months"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full bg-white text-black border border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">MB WAY Payment</CardTitle>
            <CardDescription className="text-gray-600">
              Proceed to pay and confirm your request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-sidebar shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Click <strong>Proceed to pay with MB WAY</strong> to see the MB WAY number and name. After you send the
                  payment in your MB WAY app and click <strong>Confirm payment</strong>, your payment will be marked as{" "}
                  <strong>pending</strong> and reviewed by our super admin.
                </p>
              </div>

              {!showDetails && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-sidebar text-sidebar hover:bg-sidebar hover:text-white"
                  onClick={() => setShowDetails(true)}
                >
                  Proceed to pay with MB WAY
                </Button>
              )}

              {showDetails && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-dashed border-emerald-400 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">
                      MB WAY payment details
                    </p>
                    <p className="text-sm text-emerald-800">
                      <strong>Amount:</strong> {amount.toFixed(2)} EUR
                    </p>
                    <p className="text-sm text-emerald-800">
                      <strong>MB WAY Number:</strong> {MBWAY_PHONE}
                    </p>
                    <p className="text-sm text-emerald-800">
                      <strong>Account Name:</strong> {MBWAY_NAME}
                    </p>
                  </div>

                  <Button
                    type="button"
                    className="w-full bg-sidebar text-white hover:bg-sidebar/90"
                    onClick={handleConfirmPayment}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Confirming payment..." : "I have paid, confirm payment"}
                  </Button>

                  <p className="text-xs text-gray-500">
                    After you confirm, your MB WAY payment will be marked as <strong>pending</strong>. You&apos;ll receive an
                    email when it is approved and your admin panel access is activated.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

