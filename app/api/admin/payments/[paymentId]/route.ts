import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin-auth"

/**
 * PUT /api/admin/payments/[paymentId]
 * Update payment status (approve/reject) - super admin only
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("admin_session")?.value

    if (!sessionId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Verify super admin
    const isAdmin = await isSuperAdmin(sessionId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, notes } = body

    if (!status || !['approved', 'rejected', 'pending', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: pending, approved, rejected, or completed" },
        { status: 400 }
      )
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()

      // Get payment details
      const [payments] = await connection.execute(
        `SELECT user_id, plan, amount FROM payments WHERE id = ?`,
        [params.paymentId]
      ) as any[]

      if (payments.length === 0) {
        await connection.rollback()
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        )
      }

      const payment = payments[0]

      // Update payment status
      await connection.execute(
        `UPDATE payments 
         SET status = ?, 
             approved_by = ?,
             notes = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [status, sessionId, notes || null, params.paymentId]
      )

      // If payment is approved, activate subscription
      if (status === 'approved' || status === 'completed') {
        const durationDays = payment.plan === 'monthly' ? 180 : 365
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + durationDays)

        await connection.execute(
          `UPDATE users 
           SET subscription_status = 'active',
               subscription_end_date = ?,
               subscription_plan = ?
           WHERE id = ?`,
          [endDate.toISOString().slice(0, 19).replace('T', ' '), payment.plan, payment.user_id]
        )

        // Send subscription confirmation email
        try {
          const [users] = await connection.execute(
            `SELECT name, email FROM users WHERE id = ?`,
            [payment.user_id]
          ) as any[]

          if (users.length > 0) {
            const { sendSubscriptionConfirmationEmail, sendMbwayDecisionEmail } = await import('@/lib/email')

            // Subscription confirmation (existing behaviour)
            await sendSubscriptionConfirmationEmail(
              users[0].email,
              users[0].name,
              payment.plan,
              endDate.toISOString()
            )

            // MB WAY specific decision email (approved)
            await sendMbwayDecisionEmail(
              users[0].email,
              users[0].name,
              payment.plan,
              payment.amount,
              'approved'
            )
          }
        } catch (emailError: any) {
          console.error('Failed to send subscription confirmation email:', emailError)
          // Don't fail the payment approval if email fails
        }
      } else if (status === 'rejected') {
        // Send MB WAY rejection email (does not change subscription)
        try {
          const [users] = await connection.execute(
            `SELECT name, email FROM users WHERE id = ?`,
            [payment.user_id]
          ) as any[]

          if (users.length > 0) {
            const { sendMbwayDecisionEmail } = await import('@/lib/email')
            await sendMbwayDecisionEmail(
              users[0].email,
              users[0].name,
              payment.plan,
              payment.amount,
              'rejected'
            )
          }
        } catch (emailError: any) {
          console.error('Failed to send MB WAY rejection email:', emailError)
          // Don't fail the payment update if email fails
        }
      }

      await connection.commit()

      // Get updated payment
      const [updatedPayments] = await connection.execute(
        `SELECT 
          p.id,
          p.user_id,
          p.amount,
          p.currency,
          p.plan,
          p.status,
          p.created_at,
          p.updated_at,
          p.approved_by,
          p.notes,
          u.name as user_name,
          u.email as user_email
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = ?`,
        [params.paymentId]
      ) as any[]

      return NextResponse.json({
        success: true,
        payment: updatedPayments[0],
      })
    } catch (error: any) {
      await connection.rollback()
      console.error("Error updating payment:", error)
      return NextResponse.json(
        { error: error.message || "Failed to update payment" },
        { status: 500 }
      )
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error updating payment:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update payment" },
      { status: 500 }
    )
  }
}
