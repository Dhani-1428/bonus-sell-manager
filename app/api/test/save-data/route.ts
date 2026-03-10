import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-middleware"
import { addMenuItem, addOrder, saveRestaurantSettings } from "@/lib/db-store"

/**
 * POST /api/test/save-data
 * Test endpoint to save sample data to database
 * This helps verify that data saving is working correctly
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

    const results: any = {
      userId: session.userId,
      tests: {},
    }

    // Test 1: Save a menu item
    try {
      const testMenuItem = await addMenuItem(session.userId, {
        name: "Test Menu Item",
        price: 9.99,
        category: "Main",
      })
      results.tests.menuItem = {
        success: true,
        item: testMenuItem,
      }
    } catch (error: any) {
      results.tests.menuItem = {
        success: false,
        error: error.message,
      }
    }

    // Test 2: Save an order
    try {
      const testOrder = await addOrder(session.userId, {
        date: new Date().toISOString().split("T")[0],
        items: [
          {
            menuItemId: "test-item",
            menuItemName: "Test Item",
            quantity: 1,
            price: 9.99,
          },
        ],
        totalAmount: 9.99,
        discountAmount: 0,
        finalAmount: 9.99,
        paymentMethod: "cash",
      })
      results.tests.order = {
        success: true,
        order: testOrder,
      }
    } catch (error: any) {
      results.tests.order = {
        success: false,
        error: error.message,
      }
    }

    // Test 3: Save restaurant settings
    try {
      await saveRestaurantSettings(session.userId, {
        name: "Test Restaurant",
        address: "123 Test St",
        contactNumber: "123-456-7890",
      })
      results.tests.settings = {
        success: true,
        message: "Settings saved",
      }
    } catch (error: any) {
      results.tests.settings = {
        success: false,
        error: error.message,
      }
    }

    return NextResponse.json({
      message: "Test data saved. Check /api/debug/db-data to verify.",
      results,
    })
  } catch (error: any) {
    console.error("Error saving test data:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
