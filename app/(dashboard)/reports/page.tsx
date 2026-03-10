"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { getOrders } from "@/lib/api-store"
import type { Order } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Download, Calendar } from "lucide-react"
import { toast } from "sonner"

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

type FilterPeriod = "today" | "week" | "month" | "all"

function getDateRange(period: FilterPeriod): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  let start: Date

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case "week":
      start = new Date(now.getTime() - 7 * 86400000)
      start.setHours(0, 0, 0, 0)
      break
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case "all":
    default:
      start = new Date(0)
      break
  }

  return { start, end }
}

export default function ReportsPage() {
  const { session } = useAuth()
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [period, setPeriod] = useState<FilterPeriod>("all")
  const [isLoading, setIsLoading] = useState(true)

  // Load orders from database
  useEffect(() => {
    const loadOrders = async () => {
      if (session) {
        setIsLoading(true)
        try {
          const ordersData = await getOrders(session.userId)
          setAllOrders(ordersData || [])
        } catch (error) {
          console.error("Error loading orders:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setAllOrders([])
        setIsLoading(false)
      }
    }
    loadOrders()
  }, [session])

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange(period)
    return allOrders.filter((o) => {
      const d = new Date(o.createdAt)
      return d >= start && d <= end
    })
  }, [allOrders, period])

  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length
    const totalItems = filteredOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0)
    const gross = filteredOrders.reduce((s, o) => s + o.totalAmount, 0)
    const discounts = filteredOrders.reduce((s, o) => s + o.discountAmount, 0)
    const net = filteredOrders.reduce((s, o) => s + o.finalAmount, 0)

    const itemMap = new Map<string, number>()
    filteredOrders.forEach((o) => o.items.forEach((i) => {
      itemMap.set(i.menuItemName, (itemMap.get(i.menuItemName) || 0) + i.quantity)
    }))
    let bestSeller = "-"
    let bestCount = 0
    itemMap.forEach((count, name) => {
      if (count > bestCount) { bestCount = count; bestSeller = name }
    })

    return {
      totalOrders,
      totalItems,
      gross: Math.round(gross * 100) / 100,
      discounts: Math.round(discounts * 100) / 100,
      net: Math.round(net * 100) / 100,
      bestSeller,
      bestCount,
    }
  }, [filteredOrders])

  const dailyRevenue = useMemo(() => {
    const map = new Map<string, number>()
    filteredOrders.forEach((o) => {
      const day = o.createdAt.split("T")[0]
      map.set(day, (map.get(day) || 0) + o.finalAmount)
    })
    return Array.from(map.entries())
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredOrders])

  const exportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders to export")
      return
    }

    const headers = ["Order ID", "Date", "Items", "Gross", "Discount", "Net", "Payment"]
    const rows = filteredOrders.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleDateString(),
      o.items.map((i) => `${i.menuItemName} x${i.quantity}`).join("; "),
      o.totalAmount.toFixed(2),
      o.discountAmount.toFixed(2),
      o.finalAmount.toFixed(2),
      o.paymentMethod,
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-report-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported!")
  }

  const periods: { key: FilterPeriod; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ]

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports</h2>
          <p className="text-sm text-muted-foreground">Analyze your sales performance</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex h-12 items-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex h-10 shrink-0 items-center rounded-lg px-4 text-sm font-medium transition-colors ${
              period === p.key
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Orders", value: summary.totalOrders.toString() },
          { label: "Items Sold", value: summary.totalItems.toString() },
          { label: "Gross Sales", value: formatter.format(summary.gross) },
          { label: "Discounts", value: formatter.format(summary.discounts) },
          { label: "Net Revenue", value: formatter.format(summary.net) },
        ].map((stat) => (
          <Card key={stat.label} className="py-4">
            <CardContent className="px-4">
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Best Seller */}
      {summary.bestSeller !== "-" && (
        <Card className="border-primary/30 bg-primary/5 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">Best Seller</p>
            <p className="text-lg font-bold text-foreground">
              {summary.bestSeller} <span className="text-sm font-normal text-muted-foreground">({summary.bestCount} sold)</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart */}
      {dailyRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyRevenue} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "T00:00:00")
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  formatter={(value: number) => formatter.format(value)}
                  labelFormatter={(label: string) => {
                    const d = new Date(label + "T00:00:00")
                    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                  }}
                  contentStyle={{
                    backgroundColor: "var(--color-popover)",
                    borderColor: "var(--color-border)",
                    borderRadius: "8px",
                    color: "var(--color-popover-foreground)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="revenue" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order History ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 50)
                    .map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-48 truncate text-sm">
                          {order.items.map((i) => `${i.menuItemName} x${i.quantity}`).join(", ")}
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatter.format(order.totalAmount)}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">
                          {order.discountAmount > 0 ? `-${formatter.format(order.discountAmount)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatter.format(order.finalAmount)}</TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                            {order.paymentMethod}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
