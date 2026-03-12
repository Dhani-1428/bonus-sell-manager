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
import { Search, Package, User, DollarSign } from "lucide-react"
import { toast } from "sonner"

interface MenuItem {
  id: string
  user_id: string
  name: string
  price: number
  category: string
  extras: any
  created_at: string
  user_name: string
  user_email: string
}

export default function AdminMenuItemsPage() {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  // Use explicit "all" value instead of empty string to avoid Select value errors
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    loadMenuItems()
  }, [searchTerm, categoryFilter, pagination.page])

  const loadMenuItems = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (searchTerm) params.append("search", searchTerm)
      if (categoryFilter && categoryFilter !== "all") {
        params.append("category", categoryFilter)
      }

      const response = await fetch(`/api/admin/menu-items?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load menu items")
      }

      setMenuItems(data.menuItems || [])
      setPagination(data.pagination || pagination)
    } catch (error: any) {
      console.error("Error loading menu items:", error)
      toast.error("Failed to load menu items")
    } finally {
      setIsLoading(false)
    }
  }

  const categories = ["Main", "Starter", "Dessert", "Beverage"]

  const stats = {
    total: pagination.total,
    byCategory: menuItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    totalValue: menuItems.reduce((sum, item) => sum + item.price, 0),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Menu Items</h1>
        <p className="text-muted-foreground">View all menu items from all users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Menu Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(menuItems.map((item) => item.user_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</div>
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
                  placeholder="Search by name, user name, or email..."
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
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value)
                setPagination({ ...pagination, page: 1 })
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading menu items...</div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No menu items found. Users need to create menu items in their dashboard.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium">Item Name</th>
                    <th className="text-left p-3 text-sm font-medium">Category</th>
                    <th className="text-right p-3 text-sm font-medium">Price</th>
                    <th className="text-left p-3 text-sm font-medium">User</th>
                    <th className="text-left p-3 text-sm font-medium">Email</th>
                    <th className="text-left p-3 text-sm font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{item.name}</div>
                        {item.extras && Array.isArray(item.extras) && item.extras.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.extras.length} extra(s)
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td className="p-3 text-right font-medium">€{item.price.toFixed(2)}</td>
                      <td className="p-3">
                        <button
                          onClick={() => router.push(`/admin/users/${item.user_id}`)}
                          className="text-primary hover:underline"
                        >
                          {item.user_name || "Unknown"}
                        </button>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{item.user_email}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
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
