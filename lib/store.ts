import type { MenuItem, Order } from "./types"
import { generateId } from "./seed-data"

function getKey(userId: string, collection: string): string {
  return `restaurant_${userId}_${collection}`
}

// Menu Items
export function getMenuItems(userId: string): MenuItem[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(getKey(userId, "menuItems"))
  return data ? JSON.parse(data) : []
}

export function saveMenuItems(userId: string, items: MenuItem[]): void {
  localStorage.setItem(getKey(userId, "menuItems"), JSON.stringify(items))
}

export function addMenuItem(userId: string, item: Omit<MenuItem, "id" | "createdAt">): MenuItem {
  const items = getMenuItems(userId)
  const newItem: MenuItem = {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  items.push(newItem)
  saveMenuItems(userId, items)
  return newItem
}

export function updateMenuItem(userId: string, id: string, data: Partial<MenuItem>): MenuItem | null {
  const items = getMenuItems(userId)
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) return null
  items[index] = { ...items[index], ...data }
  saveMenuItems(userId, items)
  return items[index]
}

export function deleteMenuItem(userId: string, id: string): boolean {
  const items = getMenuItems(userId)
  const filtered = items.filter((item) => item.id !== id)
  if (filtered.length === items.length) return false
  saveMenuItems(userId, filtered)
  return true
}

// Orders
export function getOrders(userId: string): Order[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(getKey(userId, "orders"))
  if (!data) return []
  const orders: Order[] = JSON.parse(data)
  // Migrate old orders without orderNumber
  let needsMigration = false
  const migratedOrders = orders.map((order, index) => {
    if (!order.orderNumber) {
      needsMigration = true
      // Generate order number based on position (oldest first)
      const orderNum = String(index + 1).padStart(4, "0")
      return { ...order, orderNumber: orderNum }
    }
    return order
  })
  if (needsMigration) {
    saveOrders(userId, migratedOrders)
  }
  return needsMigration ? migratedOrders : orders
}

export function saveOrders(userId: string, orders: Order[]): void {
  localStorage.setItem(getKey(userId, "orders"), JSON.stringify(orders))
}

function getNextOrderNumber(userId: string): string {
  const orders = getOrders(userId)
  if (orders.length === 0) return "0001"
  
  // Find the highest order number
  const maxOrderNum = orders.reduce((max, order) => {
    const num = parseInt(order.orderNumber || "0", 10)
    return num > max ? num : max
  }, 0)
  
  return String(maxOrderNum + 1).padStart(4, "0")
}

export function addOrder(userId: string, order: Omit<Order, "id" | "orderNumber" | "createdAt">): Order {
  const orders = getOrders(userId)
  const orderNumber = getNextOrderNumber(userId)
  const newOrder: Order = {
    ...order,
    id: generateId(),
    orderNumber,
    createdAt: new Date().toISOString(),
  }
  orders.unshift(newOrder)
  saveOrders(userId, orders)
  return newOrder
}
