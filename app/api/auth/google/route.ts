import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 * Redirects user to Google login page
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/api/auth/google/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured. Missing GOOGLE_CLIENT_ID.' },
        { status: 500 }
      );
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(7),
      })
    ).toString('base64');

    // Store state in cookie for verification
    const response = NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `state=${encodeURIComponent(state)}&` +
      `access_type=offline&` +
      `prompt=consent`
    );

    // Set state cookie (httpOnly, secure in production)
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google login' },
      { status: 500 }
    );
  }
}
