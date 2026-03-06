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
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  })

  // Check admin session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/admin/session")
        const data = await response.json()

        if (!data.admin) {
          router.push("/admin/login")
          return
        }

        setAdmin(data.admin)
        loadStats()
      } catch (error) {
        console.error("Session check error:", error)
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [router])

  const loadStats = async () => {
    try {
      // Load users for stats
      const usersResponse = await fetch("/api/admin/users?limit=1000")
      const usersData = await usersResponse.json()
      
      const totalUsers = usersData.users?.length || 0
      const activeSubscriptions = usersData.users?.filter(
        (u: any) => u.subscription_status === "active"
      ).length || 0

      // Load payments for stats
      const paymentsResponse = await fetch("/api/admin/payments?limit=1000")
      const paymentsData = await paymentsResponse.json()
      
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
    }
  }



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of users, subscriptions, and payments</p>
      </div>
      
      {/* Stats Cards */}
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
    </div>
  )
}
