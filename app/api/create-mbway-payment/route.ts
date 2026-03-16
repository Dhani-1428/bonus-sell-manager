import { NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { sendMbwayPendingEmail } from "@/lib/email"

const MBWAY_PHONE = "+351920306889"

/**
 * POST /api/create-mbway-payment
 * Create a pending MB WAY payment request for manual approval
 */
export async function POST(request: NextRequest) {
  try {
    const { plan, userId } = await request.json()

    if (!plan || !userId) {
      return NextResponse.json(
        { error: "Missing plan or userId" },
        { status: 400 }
      )
    }

    if (plan !== "monthly" && plan !== "yearly") {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'monthly' or 'yearly'" },
        { status: 400 }
      )
    }

    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      // Load user info for emails
      const [users] = await connection.execute(
        `SELECT name, email FROM users WHERE id = ?`,
        [userId]
      ) as any[]

      if (!users || users.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }

      const user = users[0]
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const amount = plan === "monthly" ? 120.0 : 199.0

      // Create pending payment record
      await connection.execute(
        `INSERT INTO payments (
          id,
          user_id,
          amount,
          currency,
          plan,
          status,
          notes,
          created_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
        [
          paymentId,
          userId,
          amount,
          "EUR",
          plan,
          `MB WAY payment requested to ${MBWAY_PHONE}`,
        ]
      )

      // Send pending payment email with MB WAY instructions
      try {
        await sendMbwayPendingEmail(
          user.email,
          user.name,
          plan,
          amount,
          MBWAY_PHONE
        )
      } catch (emailError: any) {
        console.error("Failed to send MB WAY pending payment email:", emailError)
        // Do not fail main request because of email issues
      }

      return NextResponse.json({
        success: true,
        paymentId,
        message:
          "MB WAY payment request created. Please follow the instructions sent to your email.",
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error creating MB WAY payment:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create MB WAY payment" },
      { status: 500 }
    )
  }
}

