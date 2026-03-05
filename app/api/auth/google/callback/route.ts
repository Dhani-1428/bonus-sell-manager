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

    // Get the actual host from request headers
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    const protocol = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    
    // Determine app URL - prioritize production URL, fallback to request host
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com';
    
    // Only use request host if it's NOT localhost and we're in development
    if (process.env.NODE_ENV !== 'production' && host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      appUrl = `${protocol}://${host}`;
    }
    
    // Always use production URL in production, never localhost
    if (process.env.NODE_ENV === 'production' || host?.includes('bonusfoodsellmanager.com')) {
      appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com';
    }

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
    let user;
    try {
      user = await findOrCreateGoogleUser(
        googleUser.id,
        googleUser.email,
        googleUser.name,
        googleUser.picture
      );
      console.log('✅ User created/found successfully:', user.id);
    } catch (dbError: any) {
      console.error('❌ Database error creating/finding user:', dbError);
      // If database error, still try to proceed but log it
      // This allows the user to login even if there's a temporary DB issue
      throw new Error(`Database error: ${dbError.message || 'Failed to create user'}`);
    }

    // Create session cookie
    try {
      cookieStore.set('session', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      console.log('✅ Session cookie set for user:', user.id);
    } catch (cookieError: any) {
      console.error('❌ Error setting session cookie:', cookieError);
      throw new Error(`Session error: ${cookieError.message || 'Failed to set session'}`);
    }

    // Clear OAuth state cookie
    cookieStore.delete('oauth_state');

    // Always redirect to dashboard/admin panel on successful login
    // Priority: 1. redirect from state, 2. redirect query param, 3. default dashboard
    const redirectParam = searchParams.get('redirect');
    
    let redirectPath = '/dashboard'; // Default to admin panel
    
    if (redirectFromState) {
      // Use redirect from state (most reliable)
      // Ensure it's a relative path, not a full URL
      const cleanRedirect = redirectFromState.startsWith('http') 
        ? new URL(redirectFromState).pathname 
        : (redirectFromState.startsWith('/') ? redirectFromState : `/${redirectFromState}`);
      // Only use if it's a valid dashboard route, otherwise use dashboard
      if (cleanRedirect.startsWith('/dashboard') || cleanRedirect.startsWith('/admin')) {
        redirectPath = cleanRedirect;
      }
    } else if (redirectParam) {
      // Use redirect parameter if provided
      // Ensure it's a relative path, not a full URL
      const cleanRedirect = redirectParam.startsWith('http')
        ? new URL(redirectParam).pathname
        : (redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`);
      // Only use if it's a valid dashboard route, otherwise use dashboard
      if (cleanRedirect.startsWith('/dashboard') || cleanRedirect.startsWith('/admin')) {
        redirectPath = cleanRedirect;
      }
    }
    
    // Final safety check - ensure we never redirect to localhost in production
    const finalUrl = `${appUrl}${redirectPath}`;
    if (finalUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
      console.log('⚠️  Prevented localhost redirect, using dashboard');
      return NextResponse.redirect(`${appUrl}/dashboard`);
    }
    
    console.log('✅ Redirecting to:', finalUrl);
    return NextResponse.redirect(finalUrl);
  } catch (error: any) {
    console.error('❌ Google OAuth callback error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    // Always use production URL for error redirects, never localhost
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com';
    
    // Log the error details for debugging
    const errorMessage = error.message || 'server_error';
    console.error('Redirecting to error page with message:', errorMessage);
    
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
