import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/auth-server';

/**
 * GET /api/auth/profile
 * Get current user profile
 * Protected route - requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await getUserById(sessionId);

    if (!user) {
      // Clear invalid session
      cookieStore.delete('session');
      return NextResponse.json(
        { error: 'User not found. Please log in again.' },
        { status: 401 }
      );
    }

    // Return user profile (without password)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      subscription_status: user.subscription_status,
      trial_start_date: user.trial_start_date,
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
