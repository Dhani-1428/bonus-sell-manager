import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findOrCreateGoogleUser } from '@/lib/google-auth';

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback
 * Authenticates user and redirects to dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Get base URL from request origin (works in both dev and production)
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin || 'https://bonusfoodsellmanager.com';
    
    // Ensure we use production URL in production
    const appUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com')
      : baseUrl;

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${appUrl}/auth/login?error=${encodeURIComponent(error)}`
      );
    }

    // Verify state parameter (CSRF protection)
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    if (!state || !storedState || state !== storedState) {
      console.error('Invalid OAuth state parameter');
      return NextResponse.redirect(
        `${appUrl}/auth/login?error=invalid_state`
      );
    }

    // Extract redirect from state if present
    let redirectFromState: string | null = null;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      redirectFromState = stateData.redirect || null;
    } catch (e) {
      // State doesn't contain redirect, that's okay
    }

    if (!code) {
      return NextResponse.redirect(
        `${appUrl}/auth/login?error=no_code`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${appUrl}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(
        `${appUrl}/auth/login?error=config_error`
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${appUrl}/auth/login?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info from Google');
      return NextResponse.redirect(
        `${appUrl}/auth/login?error=user_info_failed`
      );
    }

    const googleUser = await userInfoResponse.json();

    // Find or create user in database
    const user = await findOrCreateGoogleUser(
      googleUser.id,
      googleUser.email,
      googleUser.name,
      googleUser.picture
    );

    // Create session cookie
    cookieStore.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Clear OAuth state cookie
    cookieStore.delete('oauth_state');

    // Redirect to dashboard or previous route
    // Priority: 1. redirect from state, 2. redirect query param, 3. referer, 4. default dashboard
    const redirectParam = searchParams.get('redirect');
    const referer = request.headers.get('referer');
    
    let redirectPath = '/dashboard';
    
    if (redirectFromState) {
      // Use redirect from state (most reliable)
      redirectPath = redirectFromState.startsWith('/') ? redirectFromState : `/${redirectFromState}`;
    } else if (redirectParam) {
      // Use redirect parameter if provided
      redirectPath = redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`;
    } else if (referer) {
      // Try to extract path from referer
      try {
        const refererUrl = new URL(referer);
        const refererPath = refererUrl.pathname;
        // Only use referer if it's a valid app route (not external or auth routes)
        if (refererPath && 
            refererPath !== '/api/auth/google' && 
            !refererPath.startsWith('/api/auth/') &&
            refererPath.startsWith('/')) {
          redirectPath = refererPath;
        }
      } catch (e) {
        // Invalid referer URL, use default
      }
    }
    
    return NextResponse.redirect(`${appUrl}${redirectPath}`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    const appUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com')
      : (request.headers.get('origin') || request.nextUrl.origin || 'https://bonusfoodsellmanager.com');
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=server_error`
    );
  }
}
