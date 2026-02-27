import type { MenuItem, Order } from "./types"

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

export function getSeedMenuItems(): MenuItem[] {
  const now = new Date().toISOString()
  return [
    { id: generateId(), name: "Classic Burger", price: 8.99, category: "Main", createdAt: now },
    { id: generateId(), name: "Margherita Pizza", price: 12.99, category: "Main", createdAt: now },
    { id: generateId(), name: "Spaghetti Carbonara", price: 10.99, category: "Main", createdAt: now },
    { id: generateId(), name: "Caesar Salad", price: 7.99, category: "Starter", createdAt: now },
    { id: generateId(), name: "Espresso Coffee", price: 3.99, category: "Beverage", createdAt: now },
    { id: generateId(), name: "Fresh Orange Juice", price: 4.99, category: "Beverage", createdAt: now },
    { id: generateId(), name: "Grilled Steak", price: 18.99, category: "Main", createdAt: now },
    { id: generateId(), name: "Fish & Chips", price: 11.99, category: "Main", createdAt: now },
    { id: generateId(), name: "Chocolate Brownie", price: 5.99, category: "Dessert", createdAt: now },
    { id: generateId(), name: "Ice Cream Sundae", price: 6.49, category: "Dessert", createdAt: now },
  ]
}

export function getSeedOrders(menuItems: MenuItem[]): Order[] {
  const today = new Date()
  const orders: Order[] = []

  const paymentMethods: ("cash" | "card" | "online")[] = ["cash", "card", "online"]

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)
    const dateStr = date.toISOString().split("T")[0]

    const ordersPerDay = 2 + Math.floor(Math.random() * 3)

    for (let i = 0; i < ordersPerDay; i++) {
      const itemCount = 1 + Math.floor(Math.random() * 4)
      const orderItems = []
      const usedIndices = new Set<number>()

      for (let j = 0; j < itemCount; j++) {
        let idx: number
        do {
          idx = Math.floor(Math.random() * menuItems.length)
        } while (usedIndices.has(idx))
        usedIndices.add(idx)

        const item = menuItems[idx]
        const quantity = 1 + Math.floor(Math.random() * 3)
        orderItems.push({
          menuItemId: item.id,
          menuItemName: item.name,
          quantity,
          price: item.price,
        })
      }

      const totalAmount = orderItems.reduce((sum, oi) => sum + oi.price * oi.quantity, 0)
      const discountAmount = Math.random() > 0.7 ? Math.round(totalAmount * 0.1 * 100) / 100 : 0
      const finalAmount = Math.round((totalAmount - discountAmount) * 100) / 100

      orders.push({
        id: generateId(),
        date: dateStr,
        items: orderItems,
        totalAmount: Math.round(totalAmount * 100) / 100,
        discountAmount,
        finalAmount,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        createdAt: new Date(date.getTime() + i * 3600000).toISOString(),
      })
    }
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
