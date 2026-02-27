export interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}

export interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  createdAt: string
}

export interface OrderItem {
  menuItemId: string
  menuItemName: string
  quantity: number
  price: number
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
