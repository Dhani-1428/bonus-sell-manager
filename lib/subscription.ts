import type { User } from "./types"

const TRIAL_DAYS = 15

export interface SubscriptionStatus {
  hasAccess: boolean
  status: "trial" | "active" | "expired" | "cancelled"
  daysRemaining: number
  trialStartDate?: string
  subscriptionEndDate?: string
  plan?: "monthly" | "yearly"
  message: string
}

/**
 * Calculate subscription status for a user
 */
export function getSubscriptionStatus(user: User): SubscriptionStatus {
  const now = new Date()
  
  // Migration: If user doesn't have subscription status, initialize trial
  if (!user.subscriptionStatus && !user.trialStartDate) {
    user.trialStartDate = user.createdAt // Use account creation date as trial start
    user.subscriptionStatus = "trial"
    // Save the updated user
    const users = getUsers()
    const userIndex = users.findIndex((u) => u.id === user.id)
    if (userIndex !== -1) {
      users[userIndex] = user
      saveUsers(users)
    }
  }
  
  // If user is on trial
  if (user.subscriptionStatus === "trial" && user.trialStartDate) {
    const trialStart = new Date(user.trialStartDate)
    const trialEnd = new Date(trialStart)
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)
    
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysRemaining > 0) {
      return {
        hasAccess: true,
        status: "trial",
        daysRemaining,
        trialStartDate: user.trialStartDate,
        message: `Trial expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`,
      }
    } else {
      // Trial expired, update user status
      return {
        hasAccess: false,
        status: "expired",
        daysRemaining: 0,
        trialStartDate: user.trialStartDate,
        message: "Your trial has expired. Please subscribe to continue using the admin panel.",
      }
    }
  }
  
  // If user has active subscription
  if (user.subscriptionStatus === "active" && user.subscriptionEndDate) {
    const subscriptionEnd = new Date(user.subscriptionEndDate)
    const daysRemaining = Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysRemaining > 0) {
      return {
        hasAccess: true,
        status: "active",
        daysRemaining,
        subscriptionEndDate: user.subscriptionEndDate,
        plan: user.subscriptionPlan,
        message: `Subscription active. ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`,
      }
    } else {
      // Subscription expired
      return {
        hasAccess: false,
        status: "expired",
        daysRemaining: 0,
        subscriptionEndDate: user.subscriptionEndDate,
        plan: user.subscriptionPlan,
        message: "Your subscription has expired. Please renew to continue using the admin panel.",
      }
    }
  }
  
  // Cancelled or expired
  return {
    hasAccess: false,
    status: user.subscriptionStatus || "expired",
    daysRemaining: 0,
    message: "Please subscribe to access the admin panel.",
  }
}

/**
 * Initialize trial for a new user
 */
export function initializeTrial(userId: string): void {
  if (typeof window === "undefined") return
  
  const users = getUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) return
  
  user.trialStartDate = new Date().toISOString()
  user.subscriptionStatus = "trial"
  
  saveUsers(users)
}

/**
 * Activate subscription for a user
 */
export function activateSubscription(
  userId: string,
  plan: "monthly" | "yearly",
  durationDays: number
): boolean {
  if (typeof window === "undefined") return false
  
  const users = getUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) return false
  
  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + durationDays)
  
  user.subscriptionStatus = "active"
  user.subscriptionEndDate = endDate.toISOString()
  user.subscriptionPlan = plan
  
  saveUsers(users)
  return true
}

/**
 * Cancel subscription for a user
 */
export function cancelSubscription(userId: string): boolean {
  if (typeof window === "undefined") return false
  
  const users = getUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) return false
  
  user.subscriptionStatus = "cancelled"
  
  saveUsers(users)
  return true
}

// Helper functions to access users (same as in auth.ts)
function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("restaurant_users")
  return data ? JSON.parse(data) : []
}

function saveUsers(users: User[]): void {
  localStorage.setItem("restaurant_users", JSON.stringify(users))
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): User | null {
  if (typeof window === "undefined") return null
  const users = getUsers()
  return users.find((u) => u.id === userId) || null
}
