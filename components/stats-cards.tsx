"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Package, DollarSign, Percent, TrendingUp } from "lucide-react"

interface StatsData {
  totalOrdersToday: number
  totalItemsToday: number
  grossToday: number
  discountToday: number
  netToday: number
  totalOrders: number
  totalRevenue: number
}

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export function StatsCards({ stats }: { stats: StatsData }) {
  const cards = [
    {
      label: "Orders Today",
      value: stats.totalOrdersToday.toString(),
      icon: ShoppingBag,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      label: "Items Sold Today",
      value: stats.totalItemsToday.toString(),
      icon: Package,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      label: "Gross Sales Today",
      value: formatter.format(stats.grossToday),
      icon: DollarSign,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      label: "Discounts Today",
      value: formatter.format(stats.discountToday),
      icon: Percent,
      color: "text-chart-5",
      bg: "bg-chart-5/10",
    },
    {
      label: "Total Revenue",
      value: formatter.format(stats.totalRevenue),
      icon: TrendingUp,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="py-4">
          <CardContent className="flex flex-col gap-2 px-4">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
