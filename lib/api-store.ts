/**
 * Client-side API store functions
 * These functions call the API routes which store data in the database
 * Use these instead of localStorage functions
 */

import type { MenuItem, Order, RestaurantSettings } from "./types"

const API_BASE = "/api/users"

// Menu Items
export async function getMenuItems(userId: string): Promise<MenuItem[]> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/menu-items`)
    if (!response.ok) throw new Error("Failed to fetch menu items")
    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error("Error fetching menu items:", error)
    return []
  }
}

export async function saveMenuItems(userId: string, items: MenuItem[]): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/menu-items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
    if (!response.ok) throw new Error("Failed to save menu items")
  } catch (error) {
    console.error("Error saving menu items:", error)
    throw error
  }
}

export async function addMenuItem(
  userId: string,
  item: Omit<MenuItem, "id" | "createdAt">
): Promise<MenuItem> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/menu-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!response.ok) throw new Error("Failed to add menu item")
    const data = await response.json()
    return data.item
  } catch (error) {
    console.error("Error adding menu item:", error)
    throw error
  }
}

export async function updateMenuItem(
  userId: string,
  id: string,
  data: Partial<MenuItem>
): Promise<MenuItem | null> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/menu-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error("Failed to update menu item")
    }
    const result = await response.json()
    return result.item
  } catch (error) {
    console.error("Error updating menu item:", error)
    throw error
  }
}

export async function deleteMenuItem(userId: string, id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/menu-items/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      if (response.status === 404) return false
      throw new Error("Failed to delete menu item")
    }
    return true
  } catch (error) {
    console.error("Error deleting menu item:", error)
    return false
  }
}

// Orders
export async function getOrders(userId: string): Promise<Order[]> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/orders`)
    if (!response.ok) throw new Error("Failed to fetch orders")
    const data = await response.json()
    return data.orders || []
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

export async function saveOrders(userId: string, orders: Order[]): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/orders`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders }),
    })
    if (!response.ok) throw new Error("Failed to save orders")
  } catch (error) {
    console.error("Error saving orders:", error)
    throw error
  }
}

export async function addOrder(
  userId: string,
  order: Omit<Order, "id" | "orderNumber" | "createdAt">
): Promise<Order> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    })
    if (!response.ok) throw new Error("Failed to add order")
    const data = await response.json()
    return data.order
  } catch (error) {
    console.error("Error adding order:", error)
    throw error
  }
}

export async function updateOrder(
  userId: string,
  id: string,
  data: Partial<Omit<Order, "id" | "orderNumber" | "createdAt">>
): Promise<Order | null> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error("Failed to update order")
    }
    const result = await response.json()
    return result.order
  } catch (error) {
    console.error("Error updating order:", error)
    throw error
  }
}

export async function deleteOrder(userId: string, id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/orders/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      if (response.status === 404) return false
      throw new Error("Failed to delete order")
    }
    return true
  } catch (error) {
    console.error("Error deleting order:", error)
    return false
  }
}

// Restaurant Settings
export async function getRestaurantSettings(
  userId: string
): Promise<RestaurantSettings | null> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/settings`)
    if (!response.ok) throw new Error("Failed to fetch restaurant settings")
    const data = await response.json()
    return data.settings
  } catch (error) {
    console.error("Error fetching restaurant settings:", error)
    return null
  }
}

export async function saveRestaurantSettings(
  userId: string,
  settings: RestaurantSettings
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    if (!response.ok) throw new Error("Failed to save restaurant settings")
  } catch (error) {
    console.error("Error saving restaurant settings:", error)
    throw error
  }
}

export async function initializeRestaurantSettings(
  userId: string,
  name: string
): Promise<void> {
  const existing = await getRestaurantSettings(userId)
  if (!existing) {
    await saveRestaurantSettings(userId, {
      name,
      address: "",
      contactNumber: "",
    })
  }
}
