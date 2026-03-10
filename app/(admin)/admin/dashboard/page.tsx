"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  Package,
  FileText,
  Settings
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
    totalMenuItems: 0,
    totalOrders: 0,
    totalPayments: 0,
    totalRestaurantSettings: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Load stats function
  const loadStats = async () => {
    setIsLoadingStats(true)
    try {
      // Load comprehensive stats from dedicated endpoint
      const statsResponse = await fetch("/api/admin/stats")
      
      if (!statsResponse.ok) {
        throw new Error("Failed to load stats")
      }
      
      const statsData = await statsResponse.json()
      console.log("Admin stats data:", statsData) // Debug log

      setStats({
        totalUsers: statsData.stats.totalUsers || 0,
        activeSubscriptions: statsData.stats.activeSubscriptions || 0,
        totalRevenue: statsData.stats.totalRevenue || 0,
        pendingPayments: statsData.stats.pendingPayments || 0,
        totalMenuItems: statsData.stats.totalMenuItems || 0,
        totalOrders: statsData.stats.totalOrders || 0,
        totalPayments: statsData.stats.totalPayments || 0,
        totalRestaurantSettings: statsData.stats.totalRestaurantSettings || 0,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
      // Show error details
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack)
      }
      // Set error state so user knows something went wrong
      setStats({
        totalUsers: 0,
        activeSubscriptions: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        totalMenuItems: 0,
        totalOrders: 0,
        totalPayments: 0,
        totalRestaurantSettings: 0,
      })
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
        
        {/* Additional Data Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Menu Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMenuItems}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
              <p className="text-xs text-muted-foreground mt-1">All payment records</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restaurant Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRestaurantSettings}</div>
              <p className="text-xs text-muted-foreground mt-1">Configured restaurants</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
