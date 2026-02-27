import type { User, AuthSession } from "./types"
import { generateId } from "./seed-data"
import { saveMenuItems, saveOrders, initializeRestaurantSettings } from "./store"
import { initializeTrial } from "./subscription"

const USERS_KEY = "restaurant_users"
const SESSION_KEY = "restaurant_session"

function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(USERS_KEY)
  return data ? JSON.parse(data) : []
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export function signup(name: string, email: string, password: string): { success: boolean; error?: string } {
  const users = getUsers()
  const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (existingUser) {
    return { success: false, error: "An account with this email already exists." }
  }

  const newUser: User = {
    id: generateId(),
    name,
    email: email.toLowerCase(),
    password: simpleHash(password),
    createdAt: new Date().toISOString(),
    subscriptionStatus: "trial",
    trialStartDate: new Date().toISOString(),
  }

  users.push(newUser)
  saveUsers(users)

  // New accounts start with empty data - no seed data
  // Initialize empty arrays for menu items and orders
  saveMenuItems(newUser.id, [])
  saveOrders(newUser.id, [])
  
  // Initialize restaurant settings with the restaurant name
  initializeRestaurantSettings(newUser.id, name)

  // Initialize 15-day free trial
  initializeTrial(newUser.id)

  // Set session
  const session: AuthSession = { userId: newUser.id, email: newUser.email, name: newUser.name }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))

  return { success: true }
}

export function login(email: string, password: string): { success: boolean; error?: string } {
  const users = getUsers()
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) {
    return { success: false, error: "No account found with this email." }
  }
  if (user.password !== simpleHash(password)) {
    return { success: false, error: "Incorrect password." }
  }

  const session: AuthSession = { userId: user.id, email: user.email, name: user.name }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))

  return { success: true }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function getCurrentSession(): AuthSession | null {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem(SESSION_KEY)
  return data ? JSON.parse(data) : null
}
