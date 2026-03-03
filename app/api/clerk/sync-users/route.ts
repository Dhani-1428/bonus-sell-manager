import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { clerkClient } from "@clerk/nextjs/server"

/**
 * Sync all Clerk users to database
 * POST /api/clerk/sync-users
 * 
 * This endpoint fetches all users from Clerk and syncs them to the database
 * Useful for migrating existing users or ensuring all users are in the database
 */
export async function POST(request: Request) {
  try {
    console.log("🔄 Starting Clerk users sync...")

    // Get Clerk client
    const client = await clerkClient()
    
    // Fetch all users from Clerk
    const clerkUsers = await client.users.getUserList({
      limit: 500, // Adjust if you have more users
    })

    console.log(`📊 Found ${clerkUsers.data.length} users in Clerk`)

    const pool = getPool()
    const connection = await pool.getConnection()
    const results = {
      total: clerkUsers.data.length,
      created: 0,
      updated: 0,
      errors: [] as any[],
    }

    try {
      await connection.beginTransaction()

      for (const clerkUser of clerkUsers.data) {
        try {
          // Extract user information
          const userId = clerkUser.id
          const emailAddresses = clerkUser.emailAddresses || []
          const primaryEmail = emailAddresses.find(
            (email) => email.id === clerkUser.primaryEmailAddressId
          )
          const email = primaryEmail?.emailAddress || emailAddresses[0]?.emailAddress || ""

          // Get user name
          const firstName = clerkUser.firstName || ""
          const lastName = clerkUser.lastName || ""
          const fullName =
            clerkUser.username ||
            `${firstName} ${lastName}`.trim() ||
            email.split("@")[0] ||
            "User"

          // Get creation timestamp (Clerk uses Unix timestamp in seconds)
          const createdAt = clerkUser.createdAt
            ? new Date(clerkUser.createdAt).toISOString().slice(0, 19).replace("T", " ")
            : new Date().toISOString().slice(0, 19).replace("T", " ")

          // Check if user exists
          const [existing] = await connection.execute(
            "SELECT id FROM users WHERE id = ?",
            [userId]
          ) as any[]

          if (existing.length === 0) {
            // Insert new user
            await connection.execute(
              `INSERT INTO users (
                id, 
                name, 
                email, 
                password, 
                created_at, 
                trial_start_date, 
                subscription_status
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                userId,
                fullName,
                email.toLowerCase(),
                null, // No password for Clerk users
                createdAt,
                createdAt, // Trial starts at creation
                "trial", // Default to trial status
              ]
            )

            // Initialize restaurant settings
            await connection.execute(
              `INSERT INTO restaurant_settings (user_id, name)
               VALUES (?, ?)
               ON DUPLICATE KEY UPDATE name = VALUES(name)`,
              [userId, fullName]
            )

            results.created++
            console.log(`✅ Created user: ${userId} (${email})`)
          } else {
            // Update existing user
            await connection.execute(
              `UPDATE users 
               SET name = ?, email = ?
               WHERE id = ?`,
              [fullName, email.toLowerCase(), userId]
            )

            // Update restaurant settings
            await connection.execute(
              `UPDATE restaurant_settings 
               SET name = ?
               WHERE user_id = ?`,
              [fullName, userId]
            )

            results.updated++
            console.log(`🔄 Updated user: ${userId} (${email})`)
          }
        } catch (error: any) {
          console.error(`❌ Error syncing user ${clerkUser.id}:`, error.message)
          results.errors.push({
            userId: clerkUser.id,
            error: error.message,
          })
        }
      }

      await connection.commit()
      console.log(`✅ Sync completed: ${results.created} created, ${results.updated} updated`)

      return NextResponse.json({
        success: true,
        message: "Users synced successfully",
        results,
      })
    } catch (error: any) {
      await connection.rollback()
      console.error("❌ Transaction error:", error)
      throw error
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("❌ Sync error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
