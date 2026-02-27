"use client"

import { useMemo, useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { getOrders, updateOrder, getMenuItems } from "@/lib/store"
import type { Order, OrderItem } from "@/lib/types"
import { Download, Search, Pencil, Printer, Plus, Minus, Trash2 } from "lucide-react"
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
  const [editingItems, setEditingItems] = useState<OrderItem[]>([])
  const [selectedItem, setSelectedItem] = useState("")
  const [discount, setDiscount] = useState("")
  const [orderDate, setOrderDate] = useState("")
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
    setEditingItems([...order.items])
    setDiscount(order.discountAmount.toString())
    setOrderDate(order.date)
    setPaymentMethod(order.paymentMethod)
    setSelectedItem("")
    setDialogOpen(true)
  }

  const addItemToOrder = () => {
    const item = menuItems.find((m) => m.id === selectedItem)
    if (!item) return

    setEditingItems((prev) => {
      const existing = prev.find((o) => o.menuItemId === item.id)
      if (existing) {
        return prev.map((o) =>
          o.menuItemId === item.id ? { ...o, quantity: o.quantity + 1 } : o
        )
      }
      return [...prev, { menuItemId: item.id, menuItemName: item.name, quantity: 1, price: item.price }]
    })
    setSelectedItem("")
  }

  const updateItemQuantity = (menuItemId: string, delta: number) => {
    setEditingItems((prev) =>
      prev
        .map((o) => (o.menuItemId === menuItemId ? { ...o, quantity: Math.max(0, o.quantity + delta) } : o))
        .filter((o) => o.quantity > 0)
    )
  }

  const removeItemFromOrder = (menuItemId: string) => {
    setEditingItems((prev) => prev.filter((o) => o.menuItemId !== menuItemId))
  }

  const grossTotal = useMemo(() => editingItems.reduce((sum, i) => sum + i.price * i.quantity, 0), [editingItems])
  const discountAmount = parseFloat(discount) || 0
  const netTotal = Math.max(0, grossTotal - discountAmount)

  const handleSaveEdit = () => {
    if (!session || !editingOrder) return

    if (editingItems.length === 0) {
      toast.error("Order must have at least one item")
      return
    }

    const finalDiscountAmount = Math.round(discountAmount * 100) / 100
    const finalGrossTotal = Math.round(grossTotal * 100) / 100
    const finalNetTotal = Math.round(netTotal * 100) / 100

    updateOrder(session.userId, editingOrder.id, {
      date: orderDate,
      items: editingItems,
      discountAmount: finalDiscountAmount,
      finalAmount: finalNetTotal,
      totalAmount: finalGrossTotal,
      paymentMethod,
    })

    toast.success("Order updated successfully!")
    refreshOrders()
    setDialogOpen(false)
    setEditingOrder(null)
    setEditingItems([])
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order {editingOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <div className="flex flex-col gap-4 py-4">
              {/* Date */}
              <div className="flex flex-col gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              {/* Add Items */}
              <div className="flex flex-col gap-2">
                <Label>Add Item</Label>
                <div className="flex gap-2">
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger className="h-12 flex-1">
                      <SelectValue placeholder="Select an item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {formatter.format(item.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={addItemToOrder}
                    disabled={!selectedItem}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
                    aria-label="Add item"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Order Items */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Order Items</p>
                {editingItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No items. Add items above.</p>
                ) : (
                  <div className="space-y-2">
                    {editingItems.map((item) => (
                      <div key={item.menuItemId} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.menuItemName}</p>
                          <p className="text-xs text-muted-foreground">{formatter.format(item.price)} each</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateItemQuantity(item.menuItemId, -1)}
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.menuItemId, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="w-20 text-right text-sm font-semibold text-foreground">
                          {formatter.format(item.price * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeItemFromOrder(item.menuItemId)}
                          className="flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount */}
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

              {/* Payment Method */}
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

              {/* Totals */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-foreground">{formatter.format(grossTotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="text-destructive">-{formatter.format(discountAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-border">
                  <span className="text-foreground">Total:</span>
                  <span className="text-foreground">{formatter.format(netTotal)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => {
                setDialogOpen(false)
                setEditingOrder(null)
                setEditingItems([])
              }}
              className="flex h-12 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={editingItems.length === 0}
              className="flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
