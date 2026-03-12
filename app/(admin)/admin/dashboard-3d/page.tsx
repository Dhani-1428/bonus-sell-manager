"use client"

import { useState, useEffect } from "react"
import { Dashboard3DGrid } from "@/components/admin/3d-dashboard-grid"
import { motion } from "framer-motion"

export default function Dashboard3DPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalMenuItems: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersResponse, paymentsResponse, ordersResponse, menuItemsResponse] =
          await Promise.all([
            fetch("/api/admin/users?limit=1000", {
              credentials: "include",
              cache: "no-store",
            }),
            fetch("/api/admin/payments?limit=1000", {
              credentials: "include",
              cache: "no-store",
            }),
            fetch("/api/admin/orders?limit=1", {
              credentials: "include",
              cache: "no-store",
            }),
            fetch("/api/admin/menu-items?limit=1", {
              credentials: "include",
              cache: "no-store",
            }),
          ])

        const usersData = await usersResponse.json()
        const paymentsData = paymentsResponse.ok
          ? await paymentsResponse.json()
          : { payments: [], pagination: { total: 0 } }
        const ordersData = ordersResponse.ok
          ? await ordersResponse.json()
          : { orders: [], pagination: { total: 0 } }
        const menuItemsData = menuItemsResponse.ok
          ? await menuItemsResponse.json()
          : { menuItems: [], pagination: { total: 0 } }

        const totalUsers = usersData.pagination?.total || usersData.users?.length || 0
        const totalMenuItems =
          usersData.summary?.totalMenuItems || menuItemsData.pagination?.total || 0
        const totalOrders = ordersData.pagination?.total || 0

        const activeSubscriptions =
          usersData.users?.filter((u: any) => u.subscription_status === "active").length || 0

        const allPayments = paymentsData.payments || []
        const totalRevenue = allPayments
          .filter((p: any) => p.status === "completed" || p.status === "approved")
          .reduce((sum: number, p: any) => {
            const amount = parseFloat(p.amount?.toString() || "0")
            return sum + (isNaN(amount) ? 0 : amount)
          }, 0)
        const pendingPayments = allPayments.filter((p: any) => p.status === "pending").length

        setStats({
          totalUsers,
          activeSubscriptions,
          totalRevenue,
          pendingPayments,
          totalOrders,
          totalMenuItems,
        })
      } catch (error: any) {
        console.error("Error loading stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 -m-4 lg:-m-6">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    )
  }

  return <Dashboard3DGrid stats={stats} />
}
