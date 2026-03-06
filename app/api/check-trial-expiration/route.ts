import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendTrialExpirationEmail } from "@/lib/email"

const TRIAL_DAYS = 15
const WARNING_DAYS = 3 // Send email when 3 days left

/**
 * POST /api/check-trial-expiration
 * Check for users with trials expiring in 3 days and send emails
 * This can be called daily via cron job or on user login
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization here if needed
    // For now, allow anyone to call this endpoint (can be secured later)
    
    const now = new Date()
    const warningDate = new Date(now)
    warningDate.setDate(warningDate.getDate() + WARNING_DAYS)
    
    // Find users on trial who haven't received expiration email yet
    // and whose trial ends in approximately 3 days
    const [users] = await query(`
      SELECT id, name, email, trial_start_date, trial_expiration_email_sent
      FROM users
      WHERE subscription_status = 'trial'
        AND trial_start_date IS NOT NULL
        AND (trial_expiration_email_sent IS NULL OR trial_expiration_email_sent = FALSE)
    `) as any[]
    
    let emailsSent = 0
    let errors = 0
    
    for (const user of users) {
      try {
        const trialStart = new Date(user.trial_start_date)
        const trialEnd = new Date(trialStart)
        trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)
        
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        // Send email if exactly 3 days remaining (or between 2.5 and 3.5 days)
        if (daysRemaining >= 2 && daysRemaining <= 3) {
          await sendTrialExpirationEmail(user.email, user.name, daysRemaining)
          
          // Mark email as sent
          await query(
            `UPDATE users SET trial_expiration_email_sent = TRUE WHERE id = ?`,
            [user.id]
          )
          
          emailsSent++
          console.log(`✅ Sent trial expiration email to ${user.email} (${daysRemaining} days remaining)`)
        }
      } catch (error: any) {
        console.error(`❌ Error processing user ${user.id}:`, error)
        errors++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Checked ${users.length} users on trial`,
      emailsSent,
      errors,
    })
  } catch (error: any) {
    console.error("❌ Error checking trial expiration:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check trial expiration" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/check-trial-expiration
 * Same as POST, but allows calling via browser/cron
 */
export async function GET(request: NextRequest) {
  return POST(request)
}
