import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { getPool } from "@/lib/db"

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "whsec_vuiQ3aVbelwtrdlfXK5hkdczgPRT47jm"

/**
 * Clerk webhook endpoint
 * Handles user creation events and stores user data in database
 * 
 * Webhook URL: https://bonusfoodsellmanager.com/api/webhooks/clerk
 * Signing Secret: whsec_vuiQ3aVbelwtrdlfXK5hkdczgPRT47jm
 */
export async function POST(request: NextRequest) {
  console.log("🔔 Webhook endpoint called at:", new Date().toISOString())
  
  try {
    // Get the headers from the request
    const svixId = request.headers.get("svix-id")
    const svixTimestamp = request.headers.get("svix-timestamp")
    const svixSignature = request.headers.get("svix-signature")
    
    console.log("📋 Webhook headers:", {
      hasSvixId: !!svixId,
      hasSvixTimestamp: !!svixTimestamp,
      hasSvixSignature: !!svixSignature,
    })

    // If there are no headers, error out
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("❌ Missing svix headers - webhook may not be from Clerk")
      return NextResponse.json(
        { 
          error: "Error occurred -- no svix headers",
          receivedHeaders: {
            svixId: !!svixId,
            svixTimestamp: !!svixTimestamp,
            svixSignature: !!svixSignature,
          }
        },
        { status: 400 }
      )
    }

    // Get the body
    const body = await request.text()

    // Create a new Svix instance with your secret
    const wh = new Webhook(webhookSecret)
    console.log("🔐 Webhook secret configured:", webhookSecret ? "✅ Yes" : "❌ No")

    let evt: any

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as any
    } catch (err: any) {
      console.error("Webhook verification failed:", err.message)
      return NextResponse.json(
        { error: `Webhook verification failed: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the webhook
    const eventType = evt.type

    console.log(`Received Clerk webhook event: ${eventType}`)

    if (eventType === "user.created") {
      const userData = evt.data

      // Extract user information
      const userId = userData.id
      const emailAddresses = userData.email_addresses || []
      const primaryEmail = emailAddresses.find((email: any) => email.id === userData.primary_email_address_id)
      const email = primaryEmail?.email_address || emailAddresses[0]?.email_address || ""
      
      // Get user name
      const firstName = userData.first_name || ""
      const lastName = userData.last_name || ""
      const fullName = userData.username || `${firstName} ${lastName}`.trim() || "User"
      
      // Get creation timestamp (Clerk sends Unix timestamp in seconds)
      const createdAt = userData.created_at 
        ? new Date(userData.created_at * 1000).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' ')
      
      // Initialize trial start date (15-day free trial)
      const trialStartDate = new Date().toISOString().slice(0, 19).replace('T', ' ')

      console.log(`Creating user in database:`, {
        id: userId,
        email,
        name: fullName,
        createdAt,
      })

      // Store user in database
      console.log("🔌 Connecting to database...")
      const pool = getPool()
      const connection = await pool.getConnection()

      try {
        await connection.beginTransaction()
        console.log("✅ Database transaction started")

        // Insert or update user
        await connection.execute(
          `INSERT INTO users (
            id, 
            name, 
            email, 
            password, 
            created_at, 
            trial_start_date, 
            subscription_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            email = VALUES(email),
            created_at = VALUES(created_at)`,
          [
            userId,
            fullName,
            email.toLowerCase(),
            null, // No password for Clerk users
            createdAt,
            trialStartDate,
            "trial", // Default to trial status
          ]
        )

        // Initialize restaurant settings for the user
        await connection.execute(
          `INSERT INTO restaurant_settings (user_id, name)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [userId, fullName]
        )

        // Initialize empty menu items and orders (they will be created when needed)
        // No need to insert empty records, they'll be created on first use

        await connection.commit()

        console.log(`✅ User ${userId} created successfully in database`)

        return NextResponse.json({
          success: true,
          message: "User created successfully",
          userId,
        })
      } catch (dbError: any) {
        await connection.rollback()
        console.error("Database error creating user:", {
          message: dbError.message,
          code: dbError.code,
          sqlState: dbError.sqlState,
          sqlMessage: dbError.sqlMessage,
          stack: dbError.stack,
        })
        throw dbError
      } finally {
        connection.release()
      }
    } else if (eventType === "user.updated") {
      const userData = evt.data
      const userId = userData.id
      
      const emailAddresses = userData.email_addresses || []
      const primaryEmail = emailAddresses.find((email: any) => email.id === userData.primary_email_address_id)
      const email = primaryEmail?.email_address || emailAddresses[0]?.email_address || ""
      
      const firstName = userData.first_name || ""
      const lastName = userData.last_name || ""
      const fullName = userData.username || `${firstName} ${lastName}`.trim() || "User"

      console.log(`Updating user in database:`, { userId, email, name: fullName })

      const pool = getPool()
      const connection = await pool.getConnection()

      try {
        await connection.execute(
          `UPDATE users 
           SET name = ?, email = ?
           WHERE id = ?`,
          [fullName, email.toLowerCase(), userId]
        )

        // Update restaurant settings name if it exists
        await connection.execute(
          `UPDATE restaurant_settings 
           SET name = ?
           WHERE user_id = ?`,
          [fullName, userId]
        )

        console.log(`✅ User ${userId} updated successfully in database`)

        return NextResponse.json({
          success: true,
          message: "User updated successfully",
          userId,
        })
      } catch (dbError: any) {
        console.error("Database error updating user:", dbError)
        throw dbError
      } finally {
        connection.release()
      }
    } else if (eventType === "user.deleted") {
      const userData = evt.data
      const userId = userData.id

      console.log(`Deleting user from database:`, { userId })

      const pool = getPool()
      const connection = await pool.getConnection()

      try {
        // Note: Foreign key constraints with ON DELETE CASCADE will handle related records
        await connection.execute(`DELETE FROM users WHERE id = ?`, [userId])

        console.log(`✅ User ${userId} deleted successfully from database`)

        return NextResponse.json({
          success: true,
          message: "User deleted successfully",
          userId,
        })
      } catch (dbError: any) {
        console.error("Database error deleting user:", dbError)
        throw dbError
      } finally {
        connection.release()
      }
    } else {
      console.log(`Unhandled webhook event type: ${eventType}`)
      return NextResponse.json({
        success: true,
        message: `Event ${eventType} received but not handled`,
      })
    }
  } catch (error: any) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        message: error.message,
      },
      { status: 500 }
    )
  }
}
