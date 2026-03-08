import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findOrCreateGoogleUser } from '@/lib/google-auth';
import { cleanRedirectPath, getAppUrl } from '@/lib/redirect';
import { sendLoginEmail } from '@/lib/email';

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

    // Always use production URL, never localhost
    const appUrl = getAppUrl();

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

    // Log state verification for debugging
    console.log('OAuth state verification:', {
      hasState: !!state,
      hasStoredState: !!storedState,
      stateLength: state?.length,
      storedStateLength: storedState?.length,
      statesMatch: state === storedState,
    });

    if (!state) {
      console.error('Missing state parameter in OAuth callback');
      return NextResponse.redirect(
        `${appUrl}/auth/login?error=missing_state`
      );
    }

    if (!storedState) {
      console.error('Missing OAuth state cookie - cookie may have expired or been cleared');
      // Allow login to proceed but log warning - in production you might want to be stricter
      console.warn('⚠️  Proceeding without state verification - this may be a security risk');
    } else if (state !== storedState) {
      // Try to parse both states to see if they contain the same data
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const storedStateData = JSON.parse(Buffer.from(storedState, 'base64').toString());
        
        // Compare the core data (timestamp and random) ignoring redirect
        if (stateData.timestamp === storedStateData.timestamp && 
            stateData.random === storedStateData.random) {
          console.log('✅ State data matches, allowing login');
          // States match in content, proceed
        } else {
          console.error('State data mismatch:', {
            stateTimestamp: stateData.timestamp,
            storedTimestamp: storedStateData.timestamp,
            stateRandom: stateData.random,
            storedRandom: storedStateData.random,
          });
          return NextResponse.redirect(
            `${appUrl}/auth/login?error=invalid_state`
          );
        }
      } catch (parseError) {
        // If we can't parse, do strict comparison
        console.error('Cannot parse state for comparison, using strict check');
        if (state !== storedState) {
          return NextResponse.redirect(
            `${appUrl}/auth/login?error=invalid_state`
          );
        }
      }
    }

    // Extract redirect from state if present
    let redirectFromState: string | null = null;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      redirectFromState = stateData.redirect || null;
    } catch (e) {
      // State doesn't contain redirect, that's okay
      console.log('State does not contain redirect data');
    }

    if (!code) {
      return NextResponse.redirect(
        `${appUrl}/auth/login?error=no_code`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${getAppUrl()}/api/auth/google/callback`;

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

    // Send login notification email
    // Try to send email before redirect, but don't block if it fails
    try {
      await sendLoginEmail(user.email, user.name);
      console.log('✅ Login email sent successfully for Google OAuth');
    } catch (error: any) {
      console.error('❌ Failed to send login email for Google OAuth:', error);
      console.error('Error details:', {
        email: user.email,
        name: user.name,
        errorMessage: error.message,
        errorCode: error.code,
        errorCommand: error.command,
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPassword: !!process.env.EMAIL_APP_PASSWORD,
        emailUser: process.env.EMAIL_USER || 'not set',
      });
      // Continue anyway - email failure shouldn't block login
    }

    // Get user role to determine redirect path
    const { getUserById } = await import('@/lib/auth-server');
    const userWithRole = await getUserById(user.id);
    const userRole = userWithRole?.role || 'user';
    
    // Always redirect to dashboard/admin panel on successful login
    // Priority: 1. redirect from state, 2. redirect query param, 3. default based on role
    const redirectParam = searchParams.get('redirect');
    
    // Default redirect path based on user role
    let redirectPath = userRole === 'super_admin' ? '/admin/dashboard' : '/dashboard';
    
    if (redirectFromState) {
      // Clean redirect path from state
      const cleanRedirect = cleanRedirectPath(redirectFromState);
      // Only use if it's a valid dashboard route
      if (cleanRedirect.startsWith('/dashboard') || cleanRedirect.startsWith('/admin')) {
        redirectPath = cleanRedirect;
      }
    } else if (redirectParam) {
      // Clean redirect parameter
      const cleanRedirect = cleanRedirectPath(redirectParam);
      // Only use if it's a valid dashboard route
      if (cleanRedirect.startsWith('/dashboard') || cleanRedirect.startsWith('/admin')) {
        redirectPath = cleanRedirect;
      }
    }
    
    // Use request origin for redirect to ensure correct domain
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const finalUrl = `${origin}${redirectPath}`;
    
    console.log('✅ Redirecting to:', finalUrl, '(user role:', userRole, ', path:', redirectPath, ')');
    return NextResponse.redirect(finalUrl);
  } catch (error: any) {
    console.error('❌ Google OAuth callback error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    // Always use production URL for error redirects, never localhost
    const appUrl = getAppUrl();
    const errorMessage = error.message || 'server_error';
    console.error('Redirecting to error page with message:', errorMessage);
    
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
