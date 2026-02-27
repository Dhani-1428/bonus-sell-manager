"use client"

import { useMemo, useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { getOrders } from "@/lib/store"
import type { Order } from "@/lib/types"
import { Download, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export default function AllOrdersPage() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (session) {
      const allOrders = getOrders(session.userId)
      setOrders(allOrders)
    } else {
      setOrders([])
    }
  }, [session])

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders
    const term = searchTerm.toLowerCase()
    return orders.filter((order) => {
      return (
        order.orderNumber.toLowerCase().includes(term) ||
        order.date.includes(term) ||
        order.items.some((item) => item.menuItemName.toLowerCase().includes(term)) ||
        order.paymentMethod.toLowerCase().includes(term)
      )
    })
  }, [orders, searchTerm])

  const exportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders to export")
      return
    }

    const headers = ["Order #", "Date", "Items", "Gross", "Discount", "Net", "Payment Method"]
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.date).toLocaleDateString(),
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
    a.download = `all-orders-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported!")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">All Orders</h2>
          <p className="text-sm text-muted-foreground">
            {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 sm:w-64"
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Excel-like Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <div className="min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="border-r border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Order #
                </th>
                <th className="border-r border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="border-r border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Items
                </th>
                <th className="border-r border-border px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Gross
                </th>
                <th className="border-r border-border px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Discount
                </th>
                <th className="border-r border-border px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Net
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {searchTerm ? "No orders found matching your search." : "No orders yet. Create your first order!"}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`border-b border-border transition-colors hover:bg-muted/30 ${
                      index % 2 === 0 ? "bg-card" : "bg-muted/10"
                    }`}
                  >
                    <td className="border-r border-border px-4 py-3 text-sm font-semibold text-foreground">
                      {order.orderNumber || "N/A"}
                    </td>
                    <td className="border-r border-border px-4 py-3 text-sm text-foreground">
                      {new Date(order.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="border-r border-border px-4 py-3 text-sm text-foreground">
                      <div className="max-w-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="truncate">
                            {item.menuItemName} × {item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="border-r border-border px-4 py-3 text-right text-sm text-foreground">
                      {formatter.format(order.totalAmount)}
                    </td>
                    <td className="border-r border-border px-4 py-3 text-right text-sm text-destructive">
                      {order.discountAmount > 0 ? `-${formatter.format(order.discountAmount)}` : "-"}
                    </td>
                    <td className="border-r border-border px-4 py-3 text-right text-sm font-semibold text-foreground">
                      {formatter.format(order.finalAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                        {order.paymentMethod}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
