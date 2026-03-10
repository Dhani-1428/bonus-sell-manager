"use client"

import { ShoppingCart, UtensilsCrossed, LineChart, Receipt, Users, Bell } from "lucide-react"
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card"
import { Vortex } from "@/components/ui/vortex"

const features = [
  {
    icon: ShoppingCart,
    title: "Quick Order Entry",
    description: "Add orders in seconds with a touch-friendly interface. Select items from your menu, adjust quantities, apply discounts, and choose payment methods.",
  },
  {
    icon: UtensilsCrossed,
    title: "Menu Management",
    description: "Create, edit, and organize your menu items by category. Update prices, add new dishes, or remove seasonal items anytime.",
  },
  {
    icon: LineChart,
    title: "Sales Reports",
    description: "View daily, weekly, and monthly reports with clear charts. Identify your best-sellers, track revenue, and export data as CSV.",
  },
  {
    icon: Receipt,
    title: "Order History",
    description: "Full searchable log of every order placed. Filter by date, payment method, or amount to find exactly what you need.",
  },
  {
    icon: Users,
    title: "Multi-User Accounts",
    description: "Each team member gets their own account with an independent admin panel. Perfect for franchises or multi-location businesses.",
  },
  {
    icon: Bell,
    title: "Real-Time Dashboard",
    description: "Live stats that update with every order. See today's sales, items sold, and payment breakdowns the moment they happen.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 px-4 py-20 lg:py-28 relative overflow-hidden">
      {/* Vortex Background */}
      <div className="absolute inset-0 -z-10">
        <Vortex
          backgroundColor="transparent"
          className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full"
        />
      </div>

      <div className="mx-auto max-w-6xl relative z-10">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Features</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl text-balance">
            Everything you need to manage sales
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty lg:text-lg">
            From quick order entry to detailed reports, Bonus Food Sell Manager gives you the tools to stay on top of every aspect of your restaurant's sales.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <CardContainer key={feature.title} className="inter-var">
              <CardBody className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 dark:bg-black dark:border-white/[0.2]">
                <CardItem translateZ="50" className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-5 w-5 text-primary" />
                </CardItem>
                <CardItem translateZ="60" className="text-base font-semibold text-card-foreground">
                  {feature.title}
                </CardItem>
                <CardItem translateZ="70" as="p" className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardItem>
              </CardBody>
            </CardContainer>
          ))}
        </div>
      </div>
    </section>
  )
}
