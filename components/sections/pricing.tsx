import { Check } from "lucide-react"

const plans = [
  {
    name: "6 Months",
    price: "100",
    period: "/6 months",
    perMonth: "16.67",
    description: "Great for trying out SalesRocket with your restaurant.",
    features: [
      "Unlimited orders & menu items",
      "Full dashboard & reports",
      "CSV export",
      "1 user account",
      "Email support",
      "All future updates",
    ],
    highlighted: false,
  },
  {
    name: "12 Months",
    price: "210",
    period: "/year",
    perMonth: "17.50",
    badge: "Best Value",
    description: "Save more with an annual plan. Everything included, no limits.",
    features: [
      "Everything in 6 Months plan",
      "Unlimited user accounts",
      "Priority support",
      "Advanced analytics",
      "Custom categories",
      "Early access to new features",
    ],
    highlighted: true,
  },
]

export function PricingSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border bg-card px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
          <h2 className="text-3xl font-bold tracking-tight text-card-foreground lg:text-4xl text-balance">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty lg:text-lg">
            No hidden fees, no per-transaction charges. Just a flat subscription that covers everything.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-primary bg-background shadow-lg shadow-primary/5"
                  : "border-border bg-background"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {plan.badge}
                </span>
              )}

              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">&euro;{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mt-8 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={onGetStarted}
                className={`mt-8 flex h-12 items-center justify-center rounded-lg text-base font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border text-foreground hover:bg-accent"
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
