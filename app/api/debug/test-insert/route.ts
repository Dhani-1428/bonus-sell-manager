import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
import { getPool } from "@/lib/db"

/**
 * POST /api/debug/test-insert
 * Test inserting data directly to see if foreign key constraints are working
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }

    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      const results: any = {
        userId: session.userId,
        tests: {},
      }

      // Test 1: Check if user exists
      const [users] = await connection.query(
        `SELECT id, name, email FROM users WHERE id = ?`,
        [session.userId]
      ) as any[]
      
      results.tests.userExists = {
        found: users.length > 0,
        user: users[0] || null,
      }

      if (users.length === 0) {
        return NextResponse.json({
          error: "User not found in database. Cannot test inserts.",
          results,
        }, { status: 400 })
      }

      // Test 2: Try inserting a menu item
      const testMenuItemId = `test_menu_${Date.now()}`
      try {
        await connection.execute(
          `INSERT INTO menu_items (id, user_id, name, price, category, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [testMenuItemId, session.userId, "Test Item", 9.99, "Main", new Date()]
        )
        
        // Verify it was inserted
        const [inserted] = await connection.query(
          `SELECT * FROM menu_items WHERE id = ?`,
          [testMenuItemId]
        ) as any[]
        
        results.tests.menuItemInsert = {
          success: true,
          inserted: inserted[0] || null,
        }
        
        // Clean up
        await connection.execute(
          `DELETE FROM menu_items WHERE id = ?`,
          [testMenuItemId]
        )
      } catch (error: any) {
        results.tests.menuItemInsert = {
          success: false,
          error: error.message,
          code: error.code,
        }
      }

      // Test 3: Try inserting an order
      const testOrderId = `test_order_${Date.now()}`
      try {
        await connection.execute(
          `INSERT INTO orders (
            id, user_id, order_number, date, items, total_amount, 
            discount_amount, final_amount, payment_method, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            testOrderId,
            session.userId,
            "0001",
            new Date(),
            JSON.stringify([{ menuItemId: "test", menuItemName: "Test", quantity: 1, price: 9.99 }]),
            9.99,
            0,
            9.99,
            "cash",
            new Date(),
          ]
        )
        
        // Verify it was inserted
        const [inserted] = await connection.query(
          `SELECT * FROM orders WHERE id = ?`,
          [testOrderId]
        ) as any[]
        
        results.tests.orderInsert = {
          success: true,
          inserted: inserted[0] ? {
            id: inserted[0].id,
            user_id: inserted[0].user_id,
            order_number: inserted[0].order_number,
          } : null,
        }
        
        // Clean up
        await connection.execute(
          `DELETE FROM orders WHERE id = ?`,
          [testOrderId]
        )
      } catch (error: any) {
        results.tests.orderInsert = {
          success: false,
          error: error.message,
          code: error.code,
        }
      }

      return NextResponse.json({
        message: "Insert tests completed. Check results below.",
        results,
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error testing inserts:", error)
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
