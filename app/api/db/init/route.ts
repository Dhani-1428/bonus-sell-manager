import { NextResponse } from "next/server"
import { initializeSchema } from "@/lib/db-schema"

/**
 * Initialize database schema endpoint
 * POST /api/db/init
 * 
 * This endpoint initializes the database schema (creates tables if they don't exist)
 * Should be called once after deployment or when setting up the database
 */
export async function POST(request: Request) {
  try {
    console.log("Initializing database schema...")
    await initializeSchema()
    
    return NextResponse.json({
      success: true,
      message: "Database schema initialized successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error initializing schema:", error)
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
