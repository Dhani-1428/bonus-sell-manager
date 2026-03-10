/**
 * Migration utility to move localStorage data to database
 * This ensures all existing user data is preserved when migrating from localStorage to database
 */

import type { MenuItem, Order, RestaurantSettings } from "./types"
import { getMenuItems, saveMenuItems, getOrders, saveOrders, getRestaurantSettings, saveRestaurantSettings } from "./api-store"

/**
 * Get localStorage data for a user (legacy format)
 */
function getLocalStorageData(userId: string): {
  menuItems: MenuItem[]
  orders: Order[]
  restaurantSettings: RestaurantSettings | null
} {
  if (typeof window === "undefined") {
    return { menuItems: [], orders: [], restaurantSettings: null }
  }

  // Use the same key format as lib/store.ts
  const getKey = (collection: string) => `restaurant_${userId}_${collection}`

  try {
    const menuItemsData = localStorage.getItem(getKey("menuItems"))
    const ordersData = localStorage.getItem(getKey("orders"))
    const settingsData = localStorage.getItem(getKey("restaurantSettings"))

    return {
      menuItems: menuItemsData ? JSON.parse(menuItemsData) : [],
      orders: ordersData ? JSON.parse(ordersData) : [],
      restaurantSettings: settingsData ? JSON.parse(settingsData) : null,
    }
  } catch (error) {
    console.error("Error reading localStorage data:", error)
    return { menuItems: [], orders: [], restaurantSettings: null }
  }
}

/**
 * Check if user has localStorage data that needs migration
 */
export function hasLocalStorageData(userId: string): boolean {
  if (typeof window === "undefined") return false

  const getKey = (collection: string) => `restaurant_${userId}_${collection}`
  const menuItemsData = localStorage.getItem(getKey("menuItems"))
  const ordersData = localStorage.getItem(getKey("orders"))
  const settingsData = localStorage.getItem(getKey("restaurantSettings"))

  return !!(menuItemsData || ordersData || settingsData)
}

/**
 * Migrate localStorage data to database for a user
 * Returns true if migration was successful, false otherwise
 */
export async function migrateLocalStorageToDatabase(userId: string): Promise<{
  success: boolean
  migrated: {
    menuItems: number
    orders: number
    settings: boolean
  }
  errors: string[]
}> {
  const result = {
    success: true,
    migrated: {
      menuItems: 0,
      orders: 0,
      settings: false,
    },
    errors: [] as string[],
  }

  try {
    // Get localStorage data
    const localStorageData = getLocalStorageData(userId)

    // Check if there's any data to migrate
    if (
      localStorageData.menuItems.length === 0 &&
      localStorageData.orders.length === 0 &&
      !localStorageData.restaurantSettings
    ) {
      console.log("No localStorage data to migrate for user:", userId)
      return result
    }

    console.log("Starting migration for user:", userId, {
      menuItems: localStorageData.menuItems.length,
      orders: localStorageData.orders.length,
      hasSettings: !!localStorageData.restaurantSettings,
    })

    // Migrate menu items
    if (localStorageData.menuItems.length > 0) {
      try {
        // Get existing database items to avoid duplicates
        const existingItems = await getMenuItems(userId)
        const existingItemIds = new Set(existingItems.map((item) => item.id))

        // Filter out items that already exist in database
        const newItems = localStorageData.menuItems.filter(
          (item) => !existingItemIds.has(item.id)
        )

        if (newItems.length > 0) {
          // Merge with existing items
          const allItems = [...existingItems, ...newItems]
          await saveMenuItems(userId, allItems)
          result.migrated.menuItems = newItems.length
          console.log(`Migrated ${newItems.length} menu items to database`)
        } else {
          console.log("All menu items already in database")
        }
      } catch (error: any) {
        const errorMsg = `Failed to migrate menu items: ${error.message}`
        console.error(errorMsg, error)
        result.errors.push(errorMsg)
        result.success = false
      }
    }

    // Migrate orders
    if (localStorageData.orders.length > 0) {
      try {
        // Get existing database orders to avoid duplicates
        const existingOrders = await getOrders(userId)
        const existingOrderIds = new Set(existingOrders.map((order) => order.id))

        // Filter out orders that already exist in database
        const newOrders = localStorageData.orders.filter(
          (order) => !existingOrderIds.has(order.id)
        )

        if (newOrders.length > 0) {
          // Merge with existing orders
          const allOrders = [...existingOrders, ...newOrders]
          await saveOrders(userId, allOrders)
          result.migrated.orders = newOrders.length
          console.log(`Migrated ${newOrders.length} orders to database`)
        } else {
          console.log("All orders already in database")
        }
      } catch (error: any) {
        const errorMsg = `Failed to migrate orders: ${error.message}`
        console.error(errorMsg, error)
        result.errors.push(errorMsg)
        result.success = false
      }
    }

    // Migrate restaurant settings
    if (localStorageData.restaurantSettings) {
      try {
        const existingSettings = await getRestaurantSettings(userId)
        if (!existingSettings) {
          // Only migrate if no settings exist in database
          await saveRestaurantSettings(userId, localStorageData.restaurantSettings)
          result.migrated.settings = true
          console.log("Migrated restaurant settings to database")
        } else {
          console.log("Restaurant settings already exist in database")
        }
      } catch (error: any) {
        const errorMsg = `Failed to migrate restaurant settings: ${error.message}`
        console.error(errorMsg, error)
        result.errors.push(errorMsg)
        result.success = false
      }
    }

    // Clear localStorage after successful migration (optional - commented out for safety)
    // Only clear if migration was successful and we migrated something
    if (result.success && (result.migrated.menuItems > 0 || result.migrated.orders > 0 || result.migrated.settings)) {
      console.log("Migration successful. localStorage data can be cleared manually if needed.")
      // Uncomment to auto-clear localStorage after migration:
      // clearLocalStorageData(userId)
    }

    return result
  } catch (error: any) {
    const errorMsg = `Migration failed: ${error.message}`
    console.error(errorMsg, error)
    result.errors.push(errorMsg)
    result.success = false
    return result
  }
}

/**
 * Clear localStorage data for a user (after successful migration)
 */
export function clearLocalStorageData(userId: string): void {
  if (typeof window === "undefined") return

  const getKey = (collection: string) => `restaurant_${userId}_${collection}`

  try {
    localStorage.removeItem(getKey("menuItems"))
    localStorage.removeItem(getKey("orders"))
    localStorage.removeItem(getKey("restaurantSettings"))
    console.log("Cleared localStorage data for user:", userId)
  } catch (error) {
    console.error("Error clearing localStorage:", error)
  }
}
