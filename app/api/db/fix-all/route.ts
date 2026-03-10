import { NextResponse } from "next/server"
import { initializeSchema } from "@/lib/db-schema"
import { getPool } from "@/lib/db"

/**
 * POST /api/db/fix-all
 * One-click fix for all database issues:
 * - Creates missing tables (especially payments)
 * - Verifies all tables exist
 * - Checks foreign key constraints
 * - Provides detailed status report
 */
export async function POST(request: Request) {
  const results: any = {
    timestamp: new Date().toISOString(),
    steps: [],
    tables: {},
    errors: [],
  }

  try {
    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      const dbName = process.env.DB_NAME || 'foodsell_manager'
      results.database = dbName

      // Step 1: Initialize schema (creates all tables)
      results.steps.push({ step: 1, action: "Initialize database schema", status: "running" })
      try {
        await initializeSchema()
        results.steps[results.steps.length - 1].status = "success"
        results.steps[results.steps.length - 1].message = "Schema initialized"
      } catch (error: any) {
        results.steps[results.steps.length - 1].status = "error"
        results.steps[results.steps.length - 1].error = error.message
        results.errors.push(`Schema initialization: ${error.message}`)
      }

      // Step 2: Ensure payments table exists
      results.steps.push({ step: 2, action: "Create payments table", status: "running" })
      try {
        const [paymentsTables] = await connection.query(
          `SELECT TABLE_NAME 
           FROM INFORMATION_SCHEMA.TABLES 
           WHERE TABLE_SCHEMA = ? 
           AND TABLE_NAME = 'payments'`,
          [dbName]
        ) as any[]

        if (paymentsTables.length === 0) {
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
          results.steps[results.steps.length - 1].status = "success"
          results.steps[results.steps.length - 1].message = "Payments table created"
        } else {
          results.steps[results.steps.length - 1].status = "success"
          results.steps[results.steps.length - 1].message = "Payments table already exists"
        }
      } catch (error: any) {
        results.steps[results.steps.length - 1].status = "error"
        results.steps[results.steps.length - 1].error = error.message
        results.errors.push(`Payments table creation: ${error.message}`)
      }

      // Step 3: Verify all required tables exist
      results.steps.push({ step: 3, action: "Verify all tables exist", status: "running" })
      const requiredTables = ['users', 'menu_items', 'orders', 'restaurant_settings', 'payments']
      
      for (const tableName of requiredTables) {
        try {
          const [tables] = await connection.query(
            `SELECT TABLE_NAME 
             FROM INFORMATION_SCHEMA.TABLES 
             WHERE TABLE_SCHEMA = ? 
             AND TABLE_NAME = ?`,
            [dbName, tableName]
          ) as any[]

          const [countResult] = await connection.query(
            `SELECT COUNT(*) as count FROM ??`,
            [tableName]
          ) as any[]

          results.tables[tableName] = {
            exists: tables.length > 0,
            rowCount: countResult[0]?.count || 0,
          }
        } catch (error: any) {
          results.tables[tableName] = {
            exists: false,
            error: error.message,
          }
          results.errors.push(`Table ${tableName}: ${error.message}`)
        }
      }

      const allTablesExist = requiredTables.every(
        table => results.tables[table]?.exists === true
      )

      if (allTablesExist) {
        results.steps[results.steps.length - 1].status = "success"
        results.steps[results.steps.length - 1].message = "All required tables exist"
      } else {
        results.steps[results.steps.length - 1].status = "warning"
        results.steps[results.steps.length - 1].message = "Some tables are missing"
      }

      // Step 4: Check foreign key constraints
      results.steps.push({ step: 4, action: "Verify foreign key constraints", status: "running" })
      try {
        const [fkConstraints] = await connection.query(
          `SELECT 
            TABLE_NAME,
            CONSTRAINT_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
           FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
           WHERE TABLE_SCHEMA = ?
           AND REFERENCED_TABLE_NAME IS NOT NULL
           AND TABLE_NAME IN ('menu_items', 'orders', 'restaurant_settings', 'payments')`,
          [dbName]
        ) as any[]

        results.foreignKeys = fkConstraints.map((fk: any) => ({
          table: fk.TABLE_NAME,
          constraint: fk.CONSTRAINT_NAME,
          references: `${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`,
        }))

        results.steps[results.steps.length - 1].status = "success"
        results.steps[results.steps.length - 1].message = `Found ${fkConstraints.length} foreign key constraints`
      } catch (error: any) {
        results.steps[results.steps.length - 1].status = "warning"
        results.steps[results.steps.length - 1].message = `Could not check foreign keys: ${error.message}`
      }

      results.success = results.errors.length === 0
      results.message = results.success
        ? "✅ All database issues fixed! Tables are ready to use."
        : `⚠️ Fixed most issues, but ${results.errors.length} error(s) occurred.`

      return NextResponse.json(results)
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error fixing database:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        results,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}
