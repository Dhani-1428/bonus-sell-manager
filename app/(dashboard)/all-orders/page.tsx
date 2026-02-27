"use client"

import { useMemo, useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { getOrders, updateOrder, getMenuItems } from "@/lib/store"
import type { Order, OrderItem } from "@/lib/types"
import { Download, Search, Pencil, Printer } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export default function AllOrdersPage() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [discount, setDiscount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "online">("cash")
  const [menuItems, setMenuItems] = useState<{ id: string; name: string; price: number }[]>([])

  useEffect(() => {
    if (session) {
      const allOrders = getOrders(session.userId)
      setOrders(allOrders)
      const items = getMenuItems(session.userId)
      setMenuItems(items.map((item) => ({ id: item.id, name: item.name, price: item.price })))
    } else {
      setOrders([])
      setMenuItems([])
    }
  }, [session])

  const refreshOrders = useCallback(() => {
    if (session) {
      const allOrders = getOrders(session.userId)
      setOrders(allOrders)
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

  const openEditDialog = (order: Order) => {
    setEditingOrder(order)
    setDiscount(order.discountAmount.toString())
    setPaymentMethod(order.paymentMethod)
    setDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!session || !editingOrder) return

    const discountAmount = parseFloat(discount) || 0
    const grossTotal = editingOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const finalAmount = Math.max(0, grossTotal - discountAmount)

    updateOrder(session.userId, editingOrder.id, {
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      totalAmount: Math.round(grossTotal * 100) / 100,
      paymentMethod,
    })

    toast.success("Order updated successfully!")
    refreshOrders()
    setDialogOpen(false)
    setEditingOrder(null)
  }

  const handlePrint = (order: Order) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order ${order.orderNumber}</title>
          <style>
            @media print {
              @page { margin: 20mm; }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 80mm;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .order-info {
              margin-bottom: 15px;
            }
            .items {
              margin: 20px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .totals {
              border-top: 1px solid #000;
              padding-top: 10px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .final-total {
              font-weight: bold;
              font-size: 1.2em;
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 0.9em;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SalesRocket</h1>
            <p>Order Receipt</p>
          </div>
          <div class="order-info">
            <p><strong>Order #:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</p>
            <p><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
          </div>
          <div class="items">
            ${order.items
              .map(
                (item) => `
              <div class="item-row">
                <span>${item.menuItemName} × ${item.quantity}</span>
                <span>${formatter.format(item.price * item.quantity)}</span>
              </div>
            `
              )
              .join("")}
          </div>
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatter.format(order.totalAmount)}</span>
            </div>
            ${order.discountAmount > 0
              ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-${formatter.format(order.discountAmount)}</span>
            </div>
            `
              : ""}
            <div class="total-row final-total">
              <span>Total:</span>
              <span>${formatter.format(order.finalAmount)}</span>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for your order!</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
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
                <th className="border-r border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
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
                    <td className="border-r border-border px-4 py-3 text-sm text-foreground">
                      <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditDialog(order)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          aria-label={`Edit order ${order.orderNumber}`}
                          title="Edit Order"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(order)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          aria-label={`Print order ${order.orderNumber}`}
                          title="Print Order"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Order {editingOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <div className="flex flex-col gap-4 py-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Order Items</p>
                <div className="space-y-1">
                  {editingOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-foreground">
                        {item.menuItemName} × {item.quantity}
                      </span>
                      <span className="text-foreground">{formatter.format(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="text-foreground font-medium">
                      {formatter.format(
                        editingOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Discount ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: "cash" | "card" | "online") => setPaymentMethod(value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-foreground">
                    {formatter.format(
                      editingOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="text-destructive">
                    -{formatter.format(parseFloat(discount) || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-border">
                  <span className="text-foreground">Total:</span>
                  <span className="text-foreground">
                    {formatter.format(
                      Math.max(
                        0,
                        editingOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0) -
                          (parseFloat(discount) || 0)
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => {
                setDialogOpen(false)
                setEditingOrder(null)
              }}
              className="flex h-12 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
