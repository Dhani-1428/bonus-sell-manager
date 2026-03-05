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

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/auth/login?error=${encodeURIComponent(error)}`
      );
    }

    // Verify state parameter (CSRF protection)
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    if (!state || !storedState || state !== storedState) {
      console.error('Invalid OAuth state parameter');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/auth/login?error=invalid_state`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/auth/login?error=no_code`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/auth/login?error=config_error`
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
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/auth/login?error=token_exchange_failed`
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
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/auth/login?error=user_info_failed`
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

    // Redirect to dashboard
    const redirectUrl = searchParams.get('redirect') || '/dashboard';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}${redirectUrl}`
    );
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/auth/login?error=server_error`
    );
  }
}
