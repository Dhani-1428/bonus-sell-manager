"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp
} from "lucide-react"

interface Admin {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Load stats function
  const loadStats = async () => {
    setIsLoadingStats(true)
    try {
      // Load users and payments in parallel for faster loading
      const [usersResponse, paymentsResponse] = await Promise.all([
        fetch("/api/admin/users?limit=1000"),
        fetch("/api/admin/payments?limit=1000")
      ])
      
      const usersData = await usersResponse.json()
      const paymentsData = await paymentsResponse.json()
      
      const totalUsers = usersData.users?.length || 0
      const activeSubscriptions = usersData.users?.filter(
        (u: any) => u.subscription_status === "active"
      ).length || 0

      const allPayments = paymentsData.payments || []
      const totalRevenue = allPayments
        .filter((p: any) => p.status === "completed" || p.status === "approved")
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount.toString()), 0)
      const pendingPayments = allPayments.filter((p: any) => p.status === "pending").length

      setStats({
        totalUsers,
        activeSubscriptions,
        totalRevenue,
        pendingPayments,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Load stats immediately when component mounts
  // Admin session is already checked by layout
  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of users, subscriptions, and payments</p>
      </div>
      
      {/* Stats Cards */}
      {isLoadingStats ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
