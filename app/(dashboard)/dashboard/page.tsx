"use client"

import { useAuth } from "@/components/auth-provider"
import { getOrders, getMenuItems } from "@/lib/api-store"
import { StatsCards } from "@/components/stats-cards"
import { RevenueChart } from "@/components/revenue-chart"
import { PaymentChart } from "@/components/payment-chart"
import { useMemo, useState, useEffect } from "react"

export default function DashboardPage() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      if (session) {
        setIsLoading(true)
        try {
          const [ordersData, menuItemsData] = await Promise.all([
            getOrders(session.userId),
            getMenuItems(session.userId)
          ])
          setOrders(ordersData || [])
          setMenuItems(menuItemsData || [])
        } catch (error) {
          console.error("Error loading dashboard data:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setOrders([])
        setMenuItems([])
        setIsLoading(false)
      }
    }
    loadData()
  }, [session])

  const todayStr = new Date().toISOString().split("T")[0]

  const stats = useMemo(() => {
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr))
    const totalOrdersToday = todayOrders.length
    const totalItemsToday = todayOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    )
    const grossToday = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const discountToday = todayOrders.reduce((sum, o) => sum + o.discountAmount, 0)
    const netToday = todayOrders.reduce((sum, o) => sum + o.finalAmount, 0)

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0)

    return {
      totalOrdersToday,
      totalItemsToday,
      grossToday: Math.round(grossToday * 100) / 100,
      discountToday: Math.round(discountToday * 100) / 100,
      netToday: Math.round(netToday * 100) / 100,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    }
  }, [orders, todayStr])

  const itemSalesData = useMemo(() => {
    const map = new Map<string, number>()
    orders.forEach((o) => {
      o.items.forEach((item) => {
        map.set(item.menuItemName, (map.get(item.menuItemName) || 0) + item.quantity)
      })
    })
    return Array.from(map.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8)
  }, [orders])

  const paymentData = useMemo(() => {
    const map = { cash: 0, card: 0, online: 0 }
    orders.forEach((o) => {
      map[o.paymentMethod] += o.finalAmount
    })
    return [
      { name: "Cash", value: Math.round(map.cash * 100) / 100, fill: "var(--color-chart-1)" },
      { name: "Card", value: Math.round(map.card * 100) / 100, fill: "var(--color-chart-2)" },
      { name: "Online", value: Math.round(map.online * 100) / 100, fill: "var(--color-chart-3)" },
    ].filter((d) => d.value > 0)
  }, [orders])

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          {menuItems.length} menu items, {stats.totalOrders} total orders
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={itemSalesData} />
        <PaymentChart data={paymentData} />
      </div>
    </div>
  )
}
