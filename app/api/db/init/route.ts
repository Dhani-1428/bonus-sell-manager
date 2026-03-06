import { NextResponse } from "next/server"
import { initializeSchema } from "@/lib/db-schema"

/**
 * Initialize database schema endpoint
 * POST /api/db/init
 * 
 * This endpoint initializes the database schema (creates tables if they don't exist)
 * Should be called once after deployment or when setting up the database
 */
export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  try {
    console.log("Initializing database schema...")
    console.log(`Database: ${process.env.DB_NAME || 'foodsell_manager'}`)
    await initializeSchema()
    
    // Also ensure trial_expiration_email_sent column exists (for existing databases)
    try {
      const { query } = await import('@/lib/db')
      const [columns] = await query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'trial_expiration_email_sent'
      `) as any[]
      
      if (columns.length === 0) {
        await query(`
          ALTER TABLE users 
          ADD COLUMN trial_expiration_email_sent BOOLEAN DEFAULT FALSE
        `)
        console.log('✅ Added trial_expiration_email_sent column')
      } else {
        console.log('✅ trial_expiration_email_sent column already exists')
      }
    } catch (migrationError: any) {
      if (!migrationError.message.includes('Duplicate column name')) {
        console.warn('⚠️ Could not add trial_expiration_email_sent column:', migrationError.message)
        // Don't fail the init if migration fails
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Database schema initialized successfully",
      database: process.env.DB_NAME || 'foodsell_manager',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error initializing schema:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        database: process.env.DB_NAME || 'foodsell_manager',
      },
      { status: 500 }
    )
  }
}
