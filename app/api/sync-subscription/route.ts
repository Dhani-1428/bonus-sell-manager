import { NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
import { query } from "@/lib/db"
import { sendSubscriptionConfirmationEmail } from "@/lib/email"

const STORAGE_PATH = join(process.cwd(), ".subscription-updates.json")

// In-memory cache for serverless environments
let subscriptionCache: Record<string, { plan: string; endDate: string }> = {}

function loadUpdates(): Record<string, { plan: string; endDate: string }> {
  try {
    if (existsSync(STORAGE_PATH)) {
      return JSON.parse(readFileSync(STORAGE_PATH, "utf8"))
    }
  } catch (error) {
    console.error("Error loading subscription updates:", error)
  }
  return subscriptionCache
}

function saveUpdates(updates: Record<string, { plan: string; endDate: string }>): void {
  try {
    writeFileSync(STORAGE_PATH, JSON.stringify(updates, null, 2))
    subscriptionCache = updates
  } catch (error) {
    console.error("Error saving subscription updates:", error)
    subscriptionCache = updates
  }
}

export async function GET(request: NextRequest) {
  const updates = loadUpdates()
  return NextResponse.json(updates)
}

export async function POST(request: NextRequest) {
  try {
    const { userId, plan, endDate } = await request.json()
    
    if (!userId || !plan || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    // Update database
    try {
      await query(
        `UPDATE users 
         SET subscription_status = 'active', 
             subscription_end_date = ?, 
             subscription_plan = ?,
             trial_expiration_email_sent = FALSE
         WHERE id = ?`,
        [endDate, plan, userId]
      )
      console.log(`✅ Updated subscription in database for user ${userId}`)
    } catch (dbError: any) {
      console.error("❌ Database update error:", dbError)
      // Continue anyway - file storage will still work
    }
    
    // Send subscription confirmation email
    try {
      const [users] = await query(
        `SELECT name, email FROM users WHERE id = ?`,
        [userId]
      ) as any[]
      
      if (users.length > 0) {
        const user = users[0]
        await sendSubscriptionConfirmationEmail(user.email, user.name, plan, endDate)
        console.log(`✅ Sent subscription confirmation email to ${user.email}`)
      }
    } catch (emailError: any) {
      console.error("❌ Failed to send subscription confirmation email:", emailError)
      // Don't fail the request if email fails
    }
    
    // Also update file storage (for backward compatibility)
    const updates = loadUpdates()
    updates[userId] = { plan, endDate }
    saveUpdates(updates)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
