import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/auth-server"
import { query } from "@/lib/db"
import { sendTrialExpirationEmail } from "@/lib/email"

/**
 * GET /api/auth/session
 * Get current user session
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ user: null })
    }

    const user = await getUserById(sessionId)

    if (!user) {
      // Clear invalid session
      cookieStore.delete("session")
      return NextResponse.json({ user: null })
    }

    // Check trial expiration and send email if 3 days left (only once)
    if (user.subscription_status === 'trial' && user.trial_start_date && !user.trial_expiration_email_sent) {
      try {
        const trialStart = new Date(user.trial_start_date)
        const trialEnd = new Date(trialStart)
        trialEnd.setDate(trialEnd.getDate() + 15) // 15 day trial
        const now = new Date()
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        // Send email if 3 days or less remaining
        if (daysRemaining >= 2 && daysRemaining <= 3) {
          await sendTrialExpirationEmail(user.email, user.name, daysRemaining)
          
          // Mark email as sent
          await query(
            `UPDATE users SET trial_expiration_email_sent = TRUE WHERE id = ?`,
            [user.id]
          )
          
          console.log(`✅ Sent trial expiration email to ${user.email} (${daysRemaining} days remaining)`)
        }
      } catch (error: any) {
        console.error("❌ Error checking trial expiration:", error)
        // Don't fail session check if email fails
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
      },
    })
  } catch (error: any) {
    console.error("Session error:", error)
    return NextResponse.json({ user: null })
  }
}
