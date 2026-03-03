import { NextResponse } from "next/server"
import { getPool, query } from "@/lib/db"

/**
 * Test endpoint to verify webhook setup and database connection
 * GET /api/webhooks/clerk/test
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
  }

  // Check environment variables
  results.checks.env = {
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET ? "✅ Set" : "❌ Missing",
    DB_HOST: process.env.DB_HOST ? "✅ Set" : "❌ Missing",
    DB_NAME: process.env.DB_NAME || "foodsell_manager",
    DB_USER: process.env.DB_USER ? "✅ Set" : "❌ Missing",
    DB_PASSWORD: process.env.DB_PASSWORD ? "✅ Set" : "❌ Missing",
  }

  // Test database connection
  try {
    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      const dbName = process.env.DB_NAME || 'foodsell_manager'
      await connection.query(`USE \`${dbName}\``)
      
      // Check if users table exists
      const [tables] = await connection.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
        [dbName]
      ) as any[]
      
      results.checks.database = {
        connected: "✅ Connected",
        usersTableExists: tables.length > 0 ? "✅ Exists" : "❌ Missing",
      }

      // Count users
      if (tables.length > 0) {
        const [userCount] = await connection.query(
          "SELECT COUNT(*) as count FROM users"
        ) as any[]
        results.checks.database.userCount = userCount[0]?.count || 0
      }
    } finally {
      connection.release()
    }
  } catch (error: any) {
    results.errors.push({
      type: "database",
      message: error.message,
      code: error.code,
    })
    results.checks.database = {
      connected: "❌ Failed",
      error: error.message,
    }
  }

  // Check webhook endpoint accessibility
  results.checks.webhook = {
    endpoint: "https://bonusfoodsellmanager.com/api/webhooks/clerk",
    note: "Verify this URL is configured in Clerk Dashboard",
  }

  return NextResponse.json(results, { status: 200 })
}
