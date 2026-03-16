"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    totalValue: menuItems.reduce((sum, item) => sum + Number(item.price || 0), 0),
  }

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Menu Items</h1>
        <p className="text-muted-foreground text-lg">View all menu items from all users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-2 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold">Total Menu Items</CardTitle>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-2 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold">Total Users</CardTitle>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {new Set(menuItems.map((item) => item.user_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold">Total Value</CardTitle>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">€{stats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-2 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold">Categories</CardTitle>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
              <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{Object.keys(stats.byCategory).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
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
                  className="pl-10 h-10 border-2 focus:border-primary transition-colors"
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
              <SelectTrigger className="w-full sm:w-[180px] h-10 border-2">
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
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">All Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-muted-foreground mt-4">Loading menu items...</p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No menu items found</p>
              <p className="text-sm mt-1">Users need to create menu items in their dashboard.</p>
            </div>
          ) : (
            <div className="rounded-lg border-2 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b-2">
                      <th className="text-left p-4 text-sm font-semibold">Item Name</th>
                      <th className="text-left p-4 text-sm font-semibold">Category</th>
                      <th className="text-right p-4 text-sm font-semibold">Price</th>
                      <th className="text-left p-4 text-sm font-semibold">User</th>
                      <th className="text-left p-4 text-sm font-semibold">Email</th>
                      <th className="text-left p-4 text-sm font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item) => (
                      <tr 
                        key={item.id} 
                        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/users/${item.user_id}`)}
                      >
                        <td className="p-4">
                          <div className="font-medium">{item.name}</div>
                          {item.extras && Array.isArray(item.extras) && item.extras.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.extras.length} extra(s)
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="font-medium">{item.category}</Badge>
                        </td>
                        <td className="p-4 text-right font-semibold">€{Number(item.price).toFixed(2)}</td>
                        <td className="p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/users/${item.user_id}`)
                            }}
                            className="text-primary hover:underline font-medium"
                          >
                            {item.user_name || "Unknown"}
                          </button>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{item.user_email}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground font-medium">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} items
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })
                  }
                  disabled={pagination.page === 1}
                  className="disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      page: Math.min(pagination.totalPages, pagination.page + 1),
                    })
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
