import { NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

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
    
    const updates = loadUpdates()
    updates[userId] = { plan, endDate }
    saveUpdates(updates)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
