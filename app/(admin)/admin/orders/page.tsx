"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, ShoppingCart, User, DollarSign, TrendingUp } from "lucide-react"
import { toast } from "sonner"

interface Order {
  id: string
  user_id: string
  order_number: string
  date: string
  items: any[]
  total_amount: number
  discount_amount: number
  final_amount: number
  payment_method: string
  created_at: string
  user_name: string
  user_email: string
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    loadOrders()
  }, [searchTerm, paymentFilter, pagination.page])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (searchTerm) params.append("search", searchTerm)
      if (paymentFilter && paymentFilter !== "all") params.append("status", paymentFilter)

      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load orders")
      }

      setOrders(data.orders || [])
      setPagination(data.pagination || pagination)
    } catch (error: any) {
      console.error("Error loading orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }

  const paymentMethods = ["cash", "card", "online"]

  const stats = {
    total: pagination.total,
    totalRevenue: orders.reduce((sum, order) => sum + order.final_amount, 0),
    totalDiscounts: orders.reduce((sum, order) => sum + order.discount_amount, 0),
    byPaymentMethod: orders.reduce((acc, order) => {
      acc[order.payment_method] = (acc[order.payment_method] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">View all orders from all users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
            <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalDiscounts.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(orders.map((order) => order.user_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number, user name, or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={paymentFilter || "all"}
              onValueChange={(value) => {
                setPaymentFilter(value || "all")
                setPagination({ ...pagination, page: 1 })
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Payment Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Methods</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders found. Users need to create orders in their dashboard.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium">Order #</th>
                    <th className="text-left p-3 text-sm font-medium">Date</th>
                    <th className="text-left p-3 text-sm font-medium">Items</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                    <th className="text-right p-3 text-sm font-medium">Discount</th>
                    <th className="text-right p-3 text-sm font-medium">Final</th>
                    <th className="text-left p-3 text-sm font-medium">Payment</th>
                    <th className="text-left p-3 text-sm font-medium">User</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{order.order_number}</td>
                      <td className="p-3 text-sm">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {order.items.length} item(s)
                          <div className="text-xs text-muted-foreground mt-1">
                            {order.items.slice(0, 2).map((item: any, idx: number) => (
                              <div key={idx}>
                                {item.menuItemName} × {item.quantity}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div>+{order.items.length - 2} more</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right">€{order.total_amount.toFixed(2)}</td>
                      <td className="p-3 text-right text-destructive">
                        {order.discount_amount > 0 ? `-€${order.discount_amount.toFixed(2)}` : "-"}
                      </td>
                      <td className="p-3 text-right font-medium">€{order.final_amount.toFixed(2)}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="capitalize">
                          {order.payment_method}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => router.push(`/admin/users/${order.user_id}`)}
                          className="text-primary hover:underline text-sm"
                        >
                          {order.user_name || "Unknown"}
                        </button>
                        <div className="text-xs text-muted-foreground">{order.user_email}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} items
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      page: Math.min(pagination.totalPages, pagination.page + 1),
                    })
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
