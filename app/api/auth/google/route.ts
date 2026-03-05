import { NextRequest, NextResponse } from 'next/server';
import { getAppUrl } from '@/lib/redirect';

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 * Redirects user to Google login page
 */
export async function GET(request: NextRequest) {
  try {
    // Always use production URL, never localhost
    const appUrl = getAppUrl();
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${appUrl}/api/auth/google/callback`;
    
    // Preserve redirect parameter if provided
    const searchParams = request.nextUrl.searchParams;
    const redirectParam = searchParams.get('redirect');
    
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

    // Build Google OAuth URL with redirect parameter if provided
    const googleAuthParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
      access_type: 'offline',
      prompt: 'consent',
    });
    
    // Add redirect parameter to state if provided (will be passed back in callback)
    if (redirectParam) {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      stateData.redirect = redirectParam;
      const updatedState = Buffer.from(JSON.stringify(stateData)).toString('base64');
      googleAuthParams.set('state', updatedState);
      
      // Update cookie with new state
      const response = NextResponse.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?${googleAuthParams.toString()}`
      );
      response.cookies.set('oauth_state', updatedState, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
      });
      return response;
    }
    
    // Store state in cookie for verification
    const response = NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${googleAuthParams.toString()}`
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
