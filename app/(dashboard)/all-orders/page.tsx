"use client"

import { useMemo, useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { getOrders, updateOrder, getMenuItems, getRestaurantSettings } from "@/lib/store"
import type { Order, OrderItem, MenuItem } from "@/lib/types"
import { Download, Search, Pencil, Printer, Plus, Minus, Trash2 } from "lucide-react"
import { HoverEffect } from "@/components/ui/card-hover-effect"
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

function OrderRowWithHover({ order, index, onEdit, onPrint }: { order: Order; index: number; onEdit: (order: Order) => void; onPrint: (order: Order) => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <tr
      className={`border-b border-border transition-colors hover:bg-muted/30 relative group ${
        index % 2 === 0 ? "bg-card" : "bg-muted/10"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.span
            className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-lg -z-10"
            layoutId={`hoverBackground-${order.id}`}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.15 },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.15, delay: 0.2 },
            }}
          />
        )}
      </AnimatePresence>
      <td className="border-r border-border px-4 py-3 text-sm font-semibold text-foreground relative z-10">
        {order.orderNumber || "N/A"}
      </td>
      <td className="border-r border-border px-4 py-3 text-sm text-foreground relative z-10">
        {new Date(order.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="border-r border-border px-4 py-3 text-sm text-foreground relative z-10">
        <div className="max-w-xs">
          {order.items.map((item, idx) => (
            <div key={idx} className="truncate">
              {item.menuItemName}
              {item.selectedSize && <span className="text-muted-foreground"> ({item.selectedSize})</span>}
              {" × "}
              {item.quantity}
            </div>
          ))}
        </div>
      </td>
      <td className="border-r border-border px-4 py-3 text-right text-sm text-foreground relative z-10">
        {formatter.format(order.totalAmount)}
      </td>
      <td className="border-r border-border px-4 py-3 text-right text-sm text-destructive relative z-10">
        {order.discountAmount > 0 ? `-${formatter.format(order.discountAmount)}` : "-"}
      </td>
      <td className="border-r border-border px-4 py-3 text-right text-sm font-semibold text-foreground relative z-10">
        {formatter.format(order.finalAmount)}
      </td>
      <td className="border-r border-border px-4 py-3 text-sm text-foreground relative z-10">
        <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
          {order.paymentMethod}
        </span>
      </td>
      <td className="px-4 py-3 relative z-10">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(order)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={`Edit order ${order.orderNumber}`}
            title="Edit Order"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPrint(order)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={`Print order ${order.orderNumber}`}
            title="Print Order"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function AllOrdersPage() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItems, setEditingItems] = useState<OrderItem[]>([])
  const [selectedItem, setSelectedItem] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [discount, setDiscount] = useState("")
  const [orderDate, setOrderDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "online">("cash")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  useEffect(() => {
    if (session) {
      const allOrders = getOrders(session.userId)
      setOrders(allOrders)
      const items = getMenuItems(session.userId)
      setMenuItems(items)
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
      o.items.map((i) => `${i.menuItemName}${i.selectedSize ? ` (${i.selectedSize})` : ""} x${i.quantity}`).join("; "),
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
    setSelectedSize("")
    setDialogOpen(true)
  }

  const selectedMenuItem = useMemo(() => {
    return menuItems.find((m) => m.id === selectedItem)
  }, [selectedItem, menuItems])

  const addItemToOrder = () => {
    const item = selectedMenuItem
    if (!item) return

    // Determine price based on selected size or base price
    let finalPrice = item.price
    let sizeName: string | undefined = undefined
    
    if (selectedSize && item.sizes && item.sizes.length > 0) {
      const size = item.sizes.find(s => s.size === selectedSize)
      if (size) {
        finalPrice = size.price
        sizeName = size.size
      }
    }

    // Create unique key for items with different sizes
    const itemKey = sizeName ? `${item.id}-${sizeName}` : item.id
    const displayName = sizeName ? `${item.name} (${sizeName})` : item.name

    setEditingItems((prev) => {
      const existing = prev.find((o) => {
        const existingKey = o.selectedSize ? `${o.menuItemId}-${o.selectedSize}` : o.menuItemId
        return existingKey === itemKey
      })
      
      if (existing) {
        return prev.map((o) => {
          const existingKey = o.selectedSize ? `${o.menuItemId}-${o.selectedSize}` : o.menuItemId
          return existingKey === itemKey ? { ...o, quantity: o.quantity + 1 } : o
        })
      }
      
      return [...prev, { 
        menuItemId: item.id, 
        menuItemName: displayName, 
        quantity: 1, 
        price: finalPrice,
        selectedSize: sizeName
      }]
    })
    setSelectedItem("")
    setSelectedSize("")
  }

  const updateItemQuantity = (menuItemId: string, selectedSize: string | undefined, delta: number) => {
    setEditingItems((prev) =>
      prev
        .map((o) => {
          const itemKey = o.selectedSize ? `${o.menuItemId}-${o.selectedSize}` : o.menuItemId
          const targetKey = selectedSize ? `${menuItemId}-${selectedSize}` : menuItemId
          return itemKey === targetKey ? { ...o, quantity: Math.max(0, o.quantity + delta) } : o
        })
        .filter((o) => o.quantity > 0)
    )
  }

  const removeItemFromOrder = (menuItemId: string, selectedSize: string | undefined) => {
    setEditingItems((prev) => prev.filter((o) => {
      const itemKey = o.selectedSize ? `${o.menuItemId}-${o.selectedSize}` : o.menuItemId
      const targetKey = selectedSize ? `${menuItemId}-${selectedSize}` : menuItemId
      return itemKey !== targetKey
    }))
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
    if (!session) return
    
    const restaurantSettings = getRestaurantSettings(session.userId)
    const restaurantName = restaurantSettings?.name || session.name || "Restaurant"
    const restaurantAddress = restaurantSettings?.address || ""
    const restaurantContact = restaurantSettings?.contactNumber || ""

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order ${order.orderNumber}</title>
          <style>
            @media print {
              @page {
                margin: 5mm;
                size: auto;
              }
              body {
                margin: 0;
                padding: 0;
              }
              /* Hide printer selection UI */
              @media print {
                .printer-selector { display: none !important; }
              }
            }
            
            /* Responsive receipt - adapts to printer width */
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 10px;
              font-size: 12px;
              line-height: 1.4;
            }
            
            /* Thermal printer (58mm) - default */
            @media print {
              body {
                max-width: 58mm;
                margin: 0 auto;
                font-size: 11px;
              }
            }
            
            /* Thermal printer (80mm) */
            @media print and (min-width: 80mm) {
              body {
                max-width: 80mm;
                font-size: 12px;
              }
            }
            
            /* Standard A4/Letter */
            @media print and (min-width: 200mm) {
              body {
                max-width: 80mm;
                margin: 0 auto;
                font-size: 14px;
              }
            }
            
            .receipt {
              width: 100%;
            }
            
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            
            .restaurant-name {
              font-size: 1.4em;
              font-weight: bold;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            
            .restaurant-info {
              font-size: 0.9em;
              line-height: 1.6;
              margin-bottom: 5px;
            }
            
            .restaurant-info p {
              margin: 2px 0;
            }
            
            .order-info {
              margin-bottom: 15px;
              padding: 8px 0;
              border-bottom: 1px dashed #000;
            }
            
            .order-info p {
              margin: 3px 0;
              font-size: 0.95em;
            }
            
            .items {
              margin: 15px 0;
            }
            
            .item-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              padding: 2px 0;
            }
            
            .item-name {
              flex: 1;
              margin-right: 10px;
            }
            
            .item-quantity {
              margin-right: 5px;
            }
            
            .item-price {
              text-align: right;
              font-weight: bold;
            }
            
            .totals {
              border-top: 1px solid #000;
              padding-top: 10px;
              margin-top: 15px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 0.95em;
            }
            
            .final-total {
              font-weight: bold;
              font-size: 1.3em;
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px dashed #000;
              font-size: 0.85em;
            }
            
            .footer p {
              margin: 5px 0;
            }
            
            .divider {
              text-align: center;
              margin: 10px 0;
              font-size: 0.8em;
            }
            
            /* Printer selector (hidden when printing) */
            .printer-selector {
              position: fixed;
              top: 10px;
              right: 10px;
              background: white;
              padding: 15px;
              border: 2px solid #000;
              border-radius: 8px;
              z-index: 1000;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .printer-selector h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
            }
            
            .printer-selector button {
              display: block;
              width: 100%;
              padding: 8px;
              margin: 5px 0;
              background: #000;
              color: white;
              border: none;
              cursor: pointer;
              border-radius: 4px;
            }
            
            .printer-selector button:hover {
              background: #333;
            }
          </style>
        </head>
        <body>
          <div class="printer-selector">
            <h3>Select Printer Size</h3>
            <button onclick="setPrinterSize('58mm')">Thermal 58mm</button>
            <button onclick="setPrinterSize('80mm')">Thermal 80mm</button>
            <button onclick="setPrinterSize('a4')">Standard A4</button>
            <button onclick="window.print()">Print Now</button>
          </div>
          
          <div class="receipt">
            <div class="header">
              <div class="restaurant-name">${restaurantName}</div>
              ${restaurantAddress ? `<div class="restaurant-info"><p>${restaurantAddress}</p></div>` : ""}
              ${restaurantContact ? `<div class="restaurant-info"><p>Tel: ${restaurantContact}</p></div>` : ""}
              <div class="divider">━━━━━━━━━━━━━━━━</div>
            </div>
            
            <div class="order-info">
              <p><strong>Order #:</strong> ${order.orderNumber}</p>
              <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</p>
              <p><strong>Time:</strong> ${new Date(order.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
              <p><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
            </div>
            
            <div class="divider">━━━━━━━━━━━━━━━━</div>
            
            <div class="items">
              ${order.items
                .map(
                  (item) => `
                <div class="item-row">
                  <span class="item-name">${item.menuItemName}${item.selectedSize ? ` (${item.selectedSize})` : ""}</span>
                  <span class="item-quantity">×${item.quantity}</span>
                  <span class="item-price">${formatter.format(item.price * item.quantity)}</span>
                </div>
              `
                )
                .join("")}
            </div>
            
            <div class="divider">━━━━━━━━━━━━━━━━</div>
            
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
                <span>TOTAL:</span>
                <span>${formatter.format(order.finalAmount)}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your order!</p>
              <p>Visit us again soon!</p>
              <p style="margin-top: 10px; font-size: 0.75em;">Printed: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          
          <script>
            function setPrinterSize(size) {
              const body = document.body;
              body.className = 'printer-' + size;
              if (size === '58mm') {
                body.style.maxWidth = '58mm';
                body.style.fontSize = '11px';
              } else if (size === '80mm') {
                body.style.maxWidth = '80mm';
                body.style.fontSize = '12px';
              } else if (size === 'a4') {
                body.style.maxWidth = '80mm';
                body.style.fontSize = '14px';
              }
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      // Auto-print after a short delay
      // printWindow.print()
      // printWindow.close()
    }, 250)
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full">
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
                  <OrderRowWithHover 
                    key={order.id} 
                    order={order} 
                    index={index}
                    onEdit={openEditDialog}
                    onPrint={handlePrint}
                  />
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
                <div className="flex flex-col gap-2">
                  <Select value={selectedItem} onValueChange={(value) => {
                    setSelectedItem(value)
                    setSelectedSize("") // Reset size when item changes
                  }}>
                    <SelectTrigger className="h-12 flex-1">
                      <SelectValue placeholder="Select an item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map((item) => {
                        const hasSizes = item.sizes && item.sizes.length > 0
                        const displayPrice = hasSizes 
                          ? `${formatter.format(Math.min(...item.sizes.map(s => s.price)))} - ${formatter.format(Math.max(...item.sizes.map(s => s.price)))}`
                          : formatter.format(item.price)
                        return (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} - {displayPrice}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  
                  {/* Size Selection */}
                  {selectedMenuItem && selectedMenuItem.sizes && selectedMenuItem.sizes.length > 0 && (
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select size (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No size (use base price)</SelectItem>
                        {selectedMenuItem.sizes.map((size, idx) => (
                          <SelectItem key={idx} value={size.size}>
                            {size.size} - {formatter.format(size.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <button
                    onClick={addItemToOrder}
                    disabled={!selectedItem}
                    className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
                    aria-label="Add item"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add to Order
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
                    {editingItems.map((item, idx) => {
                      const itemKey = item.selectedSize ? `${item.menuItemId}-${item.selectedSize}-${idx}` : `${item.menuItemId}-${idx}`
                      return (
                        <div key={itemKey} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.menuItemName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatter.format(item.price)} each
                              {item.selectedSize && <span className="ml-1">({item.selectedSize})</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateItemQuantity(item.menuItemId, item.selectedSize, -1)}
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                            <button
                              onClick={() => updateItemQuantity(item.menuItemId, item.selectedSize, 1)}
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
                            onClick={() => removeItemFromOrder(item.menuItemId, item.selectedSize)}
                            className="flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
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
