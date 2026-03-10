import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
import { getPool } from "@/lib/db"
import { addMenuItem, addOrder } from "@/lib/db-store"

/**
 * POST /api/debug/verify-data-saving
 * Comprehensive test to verify data saving works end-to-end
 * Creates test data and verifies it appears in database
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
        timestamp: new Date().toISOString(),
        tests: {},
        verification: {},
      }

      // Step 1: Verify user exists in database
      results.tests.userExists = { status: "checking" }
      const [users] = await connection.query(
        `SELECT id, name, email FROM users WHERE id = ?`,
        [session.userId]
      ) as any[]

      if (users.length === 0) {
        results.tests.userExists = {
          status: "failed",
          error: "User not found in database",
          message: "Your user ID doesn't exist in the users table. This will prevent data from being saved due to foreign key constraints.",
        }
        return NextResponse.json({
          success: false,
          error: "User not found in database",
          results,
        }, { status: 400 })
      }

      results.tests.userExists = {
        status: "success",
        user: users[0],
      }

      // Step 2: Test saving a menu item via db-store function
      results.tests.menuItemSave = { status: "testing" }
      try {
        const testMenuItem = await addMenuItem(session.userId, {
          name: `Test Menu Item ${Date.now()}`,
          price: 12.99,
          category: "Main",
        })

        // Verify it was saved
        const [savedItems] = await connection.query(
          `SELECT * FROM menu_items WHERE id = ? AND user_id = ?`,
          [testMenuItem.id, session.userId]
        ) as any[]

        if (savedItems.length > 0) {
          results.tests.menuItemSave = {
            status: "success",
            itemId: testMenuItem.id,
            saved: true,
            item: savedItems[0],
          }
          
          // Clean up test item
          await connection.execute(
            `DELETE FROM menu_items WHERE id = ?`,
            [testMenuItem.id]
          )
        } else {
          results.tests.menuItemSave = {
            status: "failed",
            error: "Item was created but not found in database",
            itemId: testMenuItem.id,
          }
        }
      } catch (error: any) {
        results.tests.menuItemSave = {
          status: "failed",
          error: error.message,
          code: error.code,
          sqlState: error.sqlState,
        }
      }

      // Step 3: Test saving an order via db-store function
      results.tests.orderSave = { status: "testing" }
      try {
        const testOrder = await addOrder(session.userId, {
          date: new Date().toISOString().split("T")[0],
          items: [
            {
              menuItemId: "test-item",
              menuItemName: "Test Item",
              quantity: 1,
              price: 12.99,
            },
          ],
          totalAmount: 12.99,
          discountAmount: 0,
          finalAmount: 12.99,
          paymentMethod: "cash",
        })

        // Verify it was saved
        const [savedOrders] = await connection.query(
          `SELECT * FROM orders WHERE id = ? AND user_id = ?`,
          [testOrder.id, session.userId]
        ) as any[]

        if (savedOrders.length > 0) {
          results.tests.orderSave = {
            status: "success",
            orderId: testOrder.id,
            saved: true,
            order: {
              id: savedOrders[0].id,
              order_number: savedOrders[0].order_number,
              user_id: savedOrders[0].user_id,
            },
          }
          
          // Clean up test order
          await connection.execute(
            `DELETE FROM orders WHERE id = ?`,
            [testOrder.id]
          )
        } else {
          results.tests.orderSave = {
            status: "failed",
            error: "Order was created but not found in database",
            orderId: testOrder.id,
          }
        }
      } catch (error: any) {
        results.tests.orderSave = {
          status: "failed",
          error: error.message,
          code: error.code,
          sqlState: error.sqlState,
        }
      }

      // Step 4: Check current data counts
      const [menuItemsCount] = await connection.query(
        `SELECT COUNT(*) as count FROM menu_items WHERE user_id = ?`,
        [session.userId]
      ) as any[]

      const [ordersCount] = await connection.query(
        `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`,
        [session.userId]
      ) as any[]

      results.verification = {
        menuItemsInDb: menuItemsCount[0]?.count || 0,
        ordersInDb: ordersCount[0]?.count || 0,
      }

      // Step 5: Check if API routes are accessible
      results.tests.apiRoutes = { status: "checking" }
      try {
        const menuItemsResponse = await fetch(
          `${request.nextUrl.origin}/api/users/${session.userId}/menu-items`,
          {
            headers: {
              Cookie: request.headers.get("cookie") || "",
            },
          }
        )
        const menuItemsData = await menuItemsResponse.json()
        
        results.tests.apiRoutes = {
          status: "success",
          menuItemsApi: {
            accessible: menuItemsResponse.ok,
            itemCount: menuItemsData.items?.length || 0,
          },
        }
      } catch (error: any) {
        results.tests.apiRoutes = {
          status: "failed",
          error: error.message,
        }
      }

      const allTestsPassed = 
        results.tests.userExists.status === "success" &&
        results.tests.menuItemSave.status === "success" &&
        results.tests.orderSave.status === "success"

      return NextResponse.json({
        success: allTestsPassed,
        message: allTestsPassed
          ? "✅ All tests passed! Data saving is working correctly."
          : "⚠️ Some tests failed. Check the results below.",
        results,
      })
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error("Error verifying data saving:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
