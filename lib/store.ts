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
  return data ? JSON.parse(data) : []
}

export function saveOrders(userId: string, orders: Order[]): void {
  localStorage.setItem(getKey(userId, "orders"), JSON.stringify(orders))
}

export function addOrder(userId: string, order: Omit<Order, "id" | "createdAt">): Order {
  const orders = getOrders(userId)
  const newOrder: Order = {
    ...order,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  orders.unshift(newOrder)
  saveOrders(userId, orders)
  return newOrder
}
