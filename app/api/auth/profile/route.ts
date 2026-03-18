import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/auth-server';
import { getPool } from '@/lib/db';

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

/**
 * PUT /api/auth/profile
 * Update the current user's profile (name, email).
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const user = await getUserById(sessionId);
    if (!user) {
      cookieStore.delete('session');
      return NextResponse.json(
        { error: 'User not found. Please log in again.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Ensure email isn't taken by another user
      const [rows] = await connection.execute(
        'SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1',
        [email, user.id]
      ) as any[];

      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 409 }
        );
      }

      await connection.execute(
        'UPDATE users SET name = ?, email = ? WHERE id = ?',
        [name, email, user.id]
      );

      return NextResponse.json({
        success: true,
        user: { id: user.id, name, email },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
