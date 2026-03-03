import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

/**
 * Test database connection endpoint
 * GET /api/db/test
 */
export async function GET() {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection error',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
