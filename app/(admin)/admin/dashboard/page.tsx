"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  ShoppingCart,
  UtensilsCrossed,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    totalOrders: 0,
    totalMenuItems: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Load stats function
  const loadStats = async () => {
    setIsLoadingStats(true)
    try {
      // Load all data in parallel for faster loading
      const [usersResponse, paymentsResponse, ordersResponse, menuItemsResponse] = await Promise.all([
        fetch("/api/admin/users?limit=1000", {
          credentials: 'include',
          cache: 'no-store'
        }),
        fetch("/api/admin/payments?limit=1000", {
          credentials: 'include',
          cache: 'no-store'
        }),
        fetch("/api/admin/orders?limit=1", {
          credentials: 'include',
          cache: 'no-store'
        }),
        fetch("/api/admin/menu-items?limit=1", {
          credentials: 'include',
          cache: 'no-store'
        })
      ])
      
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json()
        console.error("Users API error:", errorData)
        throw new Error(errorData.error || "Failed to load users")
      }
      
      const usersData = await usersResponse.json()
      const paymentsData = paymentsResponse.ok ? await paymentsResponse.json() : { payments: [], pagination: { total: 0 } }
      const ordersData = ordersResponse.ok ? await ordersResponse.json() : { orders: [], pagination: { total: 0 } }
      const menuItemsData = menuItemsResponse.ok ? await menuItemsResponse.json() : { menuItems: [], pagination: { total: 0 } }
      
      console.log("Dashboard data loaded:", {
        users: usersData.users?.length || 0,
        usersTotal: usersData.pagination?.total || 0,
        usersSummary: usersData.summary,
        payments: paymentsData.pagination?.total || 0,
        orders: ordersData.pagination?.total || 0,
        menuItems: menuItemsData.pagination?.total || 0,
      })
      
      // Use pagination total for accurate counts
      const totalUsers = usersData.pagination?.total || usersData.users?.length || 0
      
      // Use summary if available, otherwise calculate from users array
      const totalMenuItems = usersData.summary?.totalMenuItems || menuItemsData.pagination?.total || 0
      const totalOrders = ordersData.pagination?.total || 0
      
      // Count active subscriptions from users array
      const activeSubscriptions = usersData.users?.filter(
        (u: any) => u.subscription_status === "active"
      ).length || 0

      // Calculate revenue and pending payments
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
      // Set error state but don't block UI
      setStats({
        totalUsers: 0,
        activeSubscriptions: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        totalOrders: 0,
        totalMenuItems: 0,
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Menu Items</CardTitle>
                <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMenuItems}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From completed payments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <CardDescription>Manage all user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full">
                    View All Users
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
                <CardDescription>View all menu items</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/menu-items">
                  <Button variant="outline" className="w-full">
                    View All Menus
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <CardDescription>View all orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/orders">
                  <Button variant="outline" className="w-full">
                    View All Orders
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
