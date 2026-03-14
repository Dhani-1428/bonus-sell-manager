"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { getMenuItems, addOrder } from "@/lib/api-store"
import type { OrderItem, MenuItem } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus, Trash2, ShoppingCart, X } from "lucide-react"
import { toast } from "sonner"
import { HoverEffect } from "@/components/ui/card-hover-effect"

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export default function NewOrderPage() {
  const { session } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load menu items from database
  useEffect(() => {
    const loadMenuItems = async () => {
      if (session) {
        setIsLoading(true)
        try {
          const items = await getMenuItems(session.userId)
          setMenuItems(items)
        } catch (error) {
          console.error("Error loading menu items:", error)
          toast.error("Failed to load menu items")
        } finally {
          setIsLoading(false)
        }
      } else {
        setMenuItems([])
      }
    }
    loadMenuItems()
  }, [session])

  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedItem, setSelectedItem] = useState("")
  const [discount, setDiscount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "online">("cash")

  const grossTotal = useMemo(() => orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0), [orderItems])
  const discountAmount = parseFloat(discount) || 0
  const netTotal = Math.max(0, grossTotal - discountAmount)

  const addItem = useCallback(() => {
    const item = menuItems.find((m) => m.id === selectedItem)
    if (!item) return

    // Add item with base price
    setOrderItems((prev) => {
      const existing = prev.find((o) => o.menuItemId === item.id)
      if (existing) {
        return prev.map((o) =>
          o.menuItemId === item.id ? { ...o, quantity: o.quantity + 1 } : o
        )
      }
      return [...prev, { menuItemId: item.id, menuItemName: item.name, quantity: 1, price: item.price }]
    })
    setSelectedItem("")
  }, [selectedItem, menuItems])

  const calculateExtrasPrice = (menuItem: typeof menuItems[0], selectedExtras: string[]): number => {
    if (!menuItem.extras || selectedExtras.length === 0) return 0
    return selectedExtras.reduce((total, extraName) => {
      const extra = menuItem.extras?.find(e => e.name === extraName)
      return total + (extra?.price || 0)
    }, 0)
  }


  const toggleExtra = (itemIndex: number, extraName: string) => {
    setOrderItems((prev) => {
      return prev.map((item, idx) => {
        if (idx === itemIndex) {
          const menuItem = menuItems.find(m => m.id === item.menuItemId)
          if (!menuItem) return item

          const currentExtras = item.selectedExtras || []
          const isSelected = currentExtras.includes(extraName)
          const newExtras = isSelected
            ? currentExtras.filter(e => e !== extraName)
            : [...currentExtras, extraName]

          // Calculate new price
          const basePrice = menuItem.price
          const extrasPrice = calculateExtrasPrice(menuItem, newExtras)

          return {
            ...item,
            selectedExtras: newExtras,
            price: basePrice + extrasPrice
          }
        }
        return item
      })
    })
  }

  const updateQuantity = (menuItemId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((o) => (o.menuItemId === menuItemId ? { ...o, quantity: Math.max(0, o.quantity + delta) } : o))
        .filter((o) => o.quantity > 0)
    )
  }

  const removeItem = (menuItemId: string) => {
    setOrderItems((prev) => prev.filter((o) => o.menuItemId !== menuItemId))
  }

  const handleSaveOrder = async () => {
    if (!session) return
    if (orderItems.length === 0) {
      toast.error("Add at least one item to the order")
      return
    }

    try {
      const newOrder = await addOrder(session.userId, {
        date: new Date().toISOString().split("T")[0],
        items: orderItems,
        totalAmount: Math.round(grossTotal * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalAmount: Math.round(netTotal * 100) / 100,
        paymentMethod,
      })
      
      console.log("✅ Order added via UI:", newOrder)
      toast.success("Order saved successfully!")
      setOrderItems([])
      setDiscount("")
      setPaymentMethod("cash")
    } catch (error: any) {
      console.error("❌ Error saving order:", error)
      console.error("Error details:", {
        message: error.message,
        userId: session.userId,
        itemCount: orderItems.length,
      })
      toast.error(`Failed to save order: ${error.message || "Unknown error"}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div>
        <h2 className="text-2xl font-bold text-black">New Order</h2>
        <p className="text-sm text-gray-600">Create a new order by adding items</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Add Items */}
        <Card className="bg-white border-sidebar">
          <CardHeader>
            <CardTitle className="text-base text-black">Add Items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger className="h-12 flex-1">
                  <SelectValue placeholder="Select an item..." />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((item) => {
                    return (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - {formatter.format(item.price)}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <button
                onClick={addItem}
                disabled={!selectedItem}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sidebar text-white disabled:opacity-50 transition-colors hover:bg-sidebar/90"
                aria-label="Add item"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Quick add grid */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600 uppercase tracking-wider">Quick Add</p>
              <HoverEffect className="grid grid-cols-2 gap-2 sm:grid-cols-3 py-0">
                {menuItems.slice(0, 6).map((item) => {
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        // Add item with base price
                        setOrderItems((prev) => {
                          const existing = prev.find((o) => o.menuItemId === item.id)
                          if (existing) {
                            return prev.map((o) =>
                              o.menuItemId === item.id ? { ...o, quantity: o.quantity + 1 } : o
                            )
                          }
                          return [...prev, { menuItemId: item.id, menuItemName: item.name, quantity: 1, price: item.price }]
                        })
                      }}
                      className="group flex flex-col items-center gap-1 rounded-lg border border-sidebar bg-white p-3 text-center transition-colors hover:bg-sidebar hover:text-white active:scale-95"
                    >
                      <span className="text-sm font-medium text-black truncate w-full group-hover:text-white transition-colors">{item.name}</span>
                      <span className="text-xs text-gray-600 group-hover:text-white/80 transition-colors">{formatter.format(item.price)}</span>
                    </button>
                  )
                })}
              </HoverEffect>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="bg-white border-sidebar">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-black">
              <ShoppingCart className="h-4 w-4" />
              Order Summary ({orderItems.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {orderItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-600">No items added yet. Select items from the left.</p>
            ) : (
              <HoverEffect className="flex flex-col gap-2 py-0">
                {orderItems.map((item, idx) => {
                  const menuItem = menuItems.find(m => m.id === item.menuItemId)
                  const hasExtras = menuItem?.extras && menuItem.extras.length > 0
                  
                  return (
                    <div key={`${item.menuItemId}-${idx}`} className="flex flex-col gap-3 rounded-lg border border-sidebar p-3 bg-sidebar">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.menuItemName}</p>
                          <p className="text-xs text-white/80">
                            {formatter.format(item.price)} each
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, -1)}
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/30 text-white hover:bg-white/20"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/30 text-white hover:bg-white/20"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="w-20 text-right text-sm font-semibold text-white">
                          {formatter.format(item.price * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeItem(item.menuItemId)}
                          className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-red-500/20 hover:text-red-300"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Extras Selection - Only show for items with extras */}
                      {menuItem?.extras && menuItem.extras.length > 0 && (
                        <div className="pt-2 border-t border-white/30">
                          <Label className="text-xs font-medium text-white/80 mb-2 block">Extras:</Label>
                          <div className="flex flex-wrap gap-2">
                            {menuItem.extras.map((extra, extraIdx) => {
                              const isSelected = item.selectedExtras?.includes(extra.name) || false
                              return (
                                <button
                                  key={extraIdx}
                                  onClick={() => toggleExtra(idx, extra.name)}
                                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                    isSelected
                                      ? "border-white bg-white/20 text-white"
                                      : "border-white/30 bg-sidebar-accent text-white hover:bg-white/20"
                                  }`}
                                >
                                  <span>{extra.name}</span>
                                  <span className="text-white/80">+{formatter.format(extra.price)}</span>
                                  {isSelected && <X className="h-3 w-3" />}
                                </button>
                              )
                            })}
                          </div>
                          {item.selectedExtras && item.selectedExtras.length > 0 && (
                            <p className="mt-2 text-xs text-white/80">
                              Selected: {item.selectedExtras.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </HoverEffect>
            )}

            {/* Discount */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-red-600">Discount ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="h-12 text-base bg-white border-sidebar text-red-600 placeholder:text-gray-400"
              />
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-black">Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["cash", "card", "online"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex h-12 items-center justify-center rounded-lg border text-sm font-medium capitalize transition-colors ${
                      paymentMethod === method
                        ? "border-sidebar bg-sidebar text-white"
                        : "border-sidebar bg-white text-black hover:bg-sidebar hover:text-white"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-lg border border-sidebar bg-sidebar-accent p-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Gross Total</span>
                <span className="text-white">{formatter.format(grossTotal)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-white/80">Discount</span>
                <span className="text-red-300">-{formatter.format(discountAmount)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/30 pt-2 text-lg font-bold">
                <span className="text-white">Net Total</span>
                <span className="text-white">{formatter.format(netTotal)}</span>
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSaveOrder}
              disabled={orderItems.length === 0}
              className="flex h-14 w-full items-center justify-center rounded-lg bg-sidebar text-base font-bold text-white transition-colors hover:bg-sidebar/90 disabled:opacity-50 active:scale-[0.98]"
            >
              Save Order
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
