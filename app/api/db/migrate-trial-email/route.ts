import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * POST /api/db/migrate-trial-email
 * Add trial_expiration_email_sent column to users table
 * This endpoint can be called to ensure the column exists
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting migration: Add trial_expiration_email_sent column...')
    
    // Check if column exists
    const [columns] = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'trial_expiration_email_sent'
    `) as any[]
    
    if (columns.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Column trial_expiration_email_sent already exists',
        alreadyExists: true,
      })
    }
    
    // Add column
    await query(`
      ALTER TABLE users 
      ADD COLUMN trial_expiration_email_sent BOOLEAN DEFAULT FALSE
    `)
    
    console.log('✅ Successfully added trial_expiration_email_sent column')
    
    return NextResponse.json({
      success: true,
      message: 'Successfully added trial_expiration_email_sent column',
      alreadyExists: false,
    })
  } catch (error: any) {
    if (error.message.includes('Duplicate column name')) {
      return NextResponse.json({
        success: true,
        message: 'Column already exists',
        alreadyExists: true,
      })
    }
    
    console.error('❌ Migration error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add column' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/db/migrate-trial-email
 * Same as POST, allows calling via browser
 */
export async function GET(request: NextRequest) {
  return POST(request)
}
