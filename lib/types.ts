export interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
  trialStartDate?: string // ISO date string when trial started
  subscriptionStatus: "trial" | "active" | "expired" | "cancelled"
  subscriptionEndDate?: string // ISO date string when subscription ends
  subscriptionPlan?: "monthly" | "yearly" // Plan type if subscribed
}

export interface MenuItemSize {
  size: string // e.g., "Small", "Medium", "Large"
  price: number
}

export interface MenuItem {
  id: string
  name: string
  price: number // Base price (used when no sizes)
  category: string
  sizes?: MenuItemSize[] // Optional sizes array
  createdAt: string
}

export interface OrderItem {
  menuItemId: string
  menuItemName: string
  quantity: number
  price: number
  selectedSize?: string // Optional: selected size name
}

export interface Order {
  id: string
  orderNumber: string // Sequential order number like "0001", "0002", etc.
  date: string
  items: OrderItem[]
  totalAmount: number
  discountAmount: number
  finalAmount: number
  paymentMethod: "cash" | "card" | "online"
  createdAt: string
}

export interface AuthSession {
  userId: string
  email: string
  name: string
}

export interface RestaurantSettings {
  name: string
  address: string
  contactNumber: string
}
