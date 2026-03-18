/**
 * API-based store functions - uses database via API routes
 * All user data (menu items, orders, restaurant settings) is stored in database
 * with proper user_id isolation
 */

import type { MenuItem, Order, RestaurantSettings } from "./types"

// Menu Items
export async function getMenuItems(userId: string): Promise<MenuItem[]> {
  try {
    const response = await fetch(`/api/users/${userId}/menu-items`, {
      credentials: 'include',
      cache: 'no-store'
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      console.error(`❌ Error fetching menu items: ${response.status}`, errorData)
      throw new Error(errorData.error || `Failed to fetch menu items: ${response.statusText}`)
    }
    const data = await response.json()
    const items = data.items || []
    console.log(`✅ Fetched ${items.length} menu items from API`)
    return items
  } catch (error: any) {
    console.error("❌ Error getting menu items:", error)
    throw error // Re-throw to let caller handle it
  }
}

export async function saveMenuItems(userId: string, items: MenuItem[]): Promise<void> {
  try {
    const response = await fetch(`/api/users/${userId}/menu-items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
      credentials: 'include',
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || "Failed to save menu items")
    }
  } catch (error) {
    console.error("Error saving menu items:", error)
    throw error
  }
}

export async function addMenuItem(userId: string, item: Omit<MenuItem, "id" | "createdAt">): Promise<MenuItem> {
  try {
    const response = await fetch(`/api/users/${userId}/menu-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
      credentials: 'include',
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error(`❌ Failed to add menu item: ${response.status}`, errorData)
      throw new Error(errorData.error || `Failed to add menu item: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`✅ Menu item added successfully via API:`, data.item?.id)
    
    // Immediately verify it was saved to database
    if (data.item?.id) {
      try {
        const verifyResponse = await fetch(`/api/debug/trace-save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: 'menu_item', itemId: data.item.id }),
        })
        const verifyData = await verifyResponse.json()
        if (!verifyData.found) {
          console.error(`⚠️ WARNING: Menu item ${data.item.id} was not found in database after save!`)
        } else {
          console.log(`✅ Verified: Menu item ${data.item.id} exists in database`)
        }
      } catch (verifyError) {
        console.warn("Could not verify menu item save:", verifyError)
      }
    }
    
    return data.item
  } catch (error: any) {
    console.error("❌ Error adding menu item:", error)
    console.error("Error details:", {
      userId,
      itemName: item.name,
      errorMessage: error.message,
    })
    throw error
  }
}

export async function updateMenuItem(userId: string, id: string, data: Partial<MenuItem>): Promise<MenuItem | null> {
  try {
    const response = await fetch(`/api/users/${userId}/menu-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: 'include',
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
    const response = await fetch(`/api/users/${userId}/menu-items/${id}`, {
      method: "DELETE",
      credentials: 'include',
    })
    if (!response.ok) {
      if (response.status === 404) return false
      throw new Error("Failed to delete menu item")
    }
    const result = await response.json()
    return result.success || false
  } catch (error) {
    console.error("Error deleting menu item:", error)
    return false
  }
}

// Orders
export async function getOrders(userId: string): Promise<Order[]> {
  try {
    const response = await fetch(`/api/users/${userId}/orders`, {
      credentials: 'include',
      cache: 'no-store'
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const message =
        (errorData && errorData.error) ||
        `Failed to fetch orders: ${response.status} ${response.statusText}`
      throw new Error(message)
    }
    const data = await response.json()
    if (!Array.isArray(data.orders)) {
      throw new Error("Invalid orders response format")
    }
    return data.orders
  } catch (error) {
    console.error("Error getting orders:", error)
    throw error
  }
}

export async function saveOrders(userId: string, orders: Order[]): Promise<void> {
  try {
    const response = await fetch(`/api/users/${userId}/orders`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders }),
      credentials: 'include',
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || "Failed to save orders")
    }
  } catch (error) {
    console.error("Error saving orders:", error)
    throw error
  }
}

export async function addOrder(userId: string, order: Omit<Order, "id" | "orderNumber" | "createdAt">): Promise<Order> {
  try {
    const response = await fetch(`/api/users/${userId}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
      credentials: 'include',
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error(`❌ Failed to add order: ${response.status}`, errorData)
      throw new Error(errorData.error || `Failed to add order: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`✅ Order added successfully via API:`, data.order?.id)
    
    // Immediately verify it was saved to database
    if (data.order?.id) {
      try {
        const verifyResponse = await fetch(`/api/debug/trace-save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: 'order', orderId: data.order.id }),
        })
        const verifyData = await verifyResponse.json()
        if (!verifyData.found) {
          console.error(`⚠️ WARNING: Order ${data.order.id} was not found in database after save!`)
        } else {
          console.log(`✅ Verified: Order ${data.order.id} exists in database`)
        }
      } catch (verifyError) {
        console.warn("Could not verify order save:", verifyError)
      }
    }
    
    return data.order
  } catch (error: any) {
    console.error("❌ Error adding order:", error)
    console.error("Error details:", {
      userId,
      itemCount: order.items.length,
      errorMessage: error.message,
    })
    throw error
  }
}

export async function updateOrder(userId: string, id: string, data: Partial<Omit<Order, "id" | "orderNumber" | "createdAt">>): Promise<Order | null> {
  try {
    const response = await fetch(`/api/users/${userId}/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: 'include',
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
    const response = await fetch(`/api/users/${userId}/orders/${id}`, {
      method: "DELETE",
      credentials: 'include',
    })
    if (!response.ok) {
      if (response.status === 404) return false
      throw new Error("Failed to delete order")
    }
    const result = await response.json()
    return result.success || false
  } catch (error) {
    console.error("Error deleting order:", error)
    return false
  }
}

// Restaurant Settings
export async function getRestaurantSettings(userId: string): Promise<RestaurantSettings | null> {
  try {
    const response = await fetch(`/api/users/${userId}/settings`, {
      credentials: 'include',
      cache: 'no-store'
    })
    if (!response.ok) {
      if (response.status === 404) return null
      console.error("Error fetching restaurant settings:", response.statusText)
      return null
    }
    const data = await response.json()
    return data.settings || null
  } catch (error) {
    console.error("Error getting restaurant settings:", error)
    return null
  }
}

export async function saveRestaurantSettings(userId: string, settings: RestaurantSettings): Promise<void> {
  try {
    const response = await fetch(`/api/users/${userId}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
      credentials: 'include',
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || "Failed to save restaurant settings")
    }
  } catch (error) {
    console.error("Error saving restaurant settings:", error)
    throw error
  }
}
