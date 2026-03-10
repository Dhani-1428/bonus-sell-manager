import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"

/**
 * POST /api/db/create-payments-table
 * Create the payments table if it doesn't exist
 */
export async function POST(request: Request) {
  try {
    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      const dbName = process.env.DB_NAME || 'foodsell_manager'
      
      // Check if payments table exists
      const [tables] = await connection.query(
        `SELECT TABLE_NAME 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'payments'`,
        [dbName]
      ) as any[]

      if (tables.length > 0) {
        return NextResponse.json({
          success: true,
          message: "Payments table already exists",
        })
      }

      // Create payments table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'EUR',
          plan ENUM('monthly', 'yearly') NOT NULL,
          status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
          stripe_session_id VARCHAR(255),
          stripe_payment_intent_id VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          approved_by VARCHAR(255),
          notes TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      return NextResponse.json({
        success: true,
        message: "Payments table created successfully",
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error creating payments table:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: 500 }
    )
  }
}
