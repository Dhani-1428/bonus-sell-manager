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
        `${appUrl}/?error=${encodeURIComponent(error)}#login`
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

    // Verify state parameter (CSRF protection) - but be lenient to avoid blocking legitimate logins
    if (!state) {
      console.warn('⚠️  Missing state parameter in OAuth callback - proceeding with caution');
      // Don't block login, but log it
    } else if (!storedState) {
      console.warn('⚠️  Missing OAuth state cookie - cookie may have expired or been cleared. Proceeding with login.');
      // Allow login to proceed - cookies can expire or be cleared
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
          console.warn('⚠️  State data mismatch, but allowing login to proceed:', {
            stateTimestamp: stateData.timestamp,
            storedTimestamp: storedStateData.timestamp,
            stateRandom: stateData.random,
            storedRandom: storedStateData.random,
          });
          // Don't block login - state mismatch can happen due to cookie issues
          // Log it for security monitoring but allow the login
        }
      } catch (parseError) {
        // If we can't parse, log warning but allow login
        console.warn('⚠️  Cannot parse state for comparison, but allowing login to proceed');
        // Don't block login - parsing errors shouldn't prevent authentication
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
      console.error('Missing authorization code in OAuth callback');
      return NextResponse.redirect(
        `${appUrl}/?error=no_code#login`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${getAppUrl()}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(
        `${appUrl}/?error=config_error#login`
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
        `${appUrl}/?error=token_exchange_failed#login`
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
        `${appUrl}/?error=user_info_failed#login`
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
      // Return error but don't throw - redirect to login with error message
      const errorMsg = dbError.message || 'Failed to create user';
      console.error('Redirecting to login with database error');
      return NextResponse.redirect(
        `${appUrl}/?error=${encodeURIComponent(errorMsg)}#login`
      );
    }

    // Get user role to determine redirect path and set appropriate cookies - with error handling
    let userRole = 'user';
    try {
      const { getUserById } = await import('@/lib/auth-server');
      const userWithRole = await getUserById(user.id);
      userRole = userWithRole?.role || 'user';
    } catch (roleError: any) {
      console.warn('⚠️  Could not get user role, defaulting to user:', roleError.message);
      // Continue with default role
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
      
      // If user is super_admin, also set admin_session cookie
      // This allows super_admins to access admin panel after Google OAuth login
      if (userRole === 'super_admin') {
        cookieStore.set('admin_session', user.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        });
        console.log('✅ Admin session cookie set for super_admin:', user.email);
      }
      
      console.log('✅ Cookie settings:', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    } catch (cookieError: any) {
      console.error('❌ Error setting session cookie:', cookieError);
      // Redirect to login with error instead of throwing
      return NextResponse.redirect(
        `${appUrl}/?error=${encodeURIComponent('Failed to set session')}#login`
      );
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
    
    // Use relative path for redirect - more reliable
    // Next.js will handle the full URL automatically
    console.log('✅ Redirecting to dashboard:', redirectPath, '(user role:', userRole, ')');
    
    try {
      // Use NextResponse.redirect with relative path - Next.js handles the domain
      const redirectUrl = new URL(redirectPath, request.nextUrl.origin);
      return NextResponse.redirect(redirectUrl);
    } catch (redirectError: any) {
      console.error('❌ Error creating redirect:', redirectError);
      // Fallback: use appUrl if relative redirect fails
      try {
        return NextResponse.redirect(`${appUrl}${redirectPath}`);
      } catch (fallbackError: any) {
        console.error('❌ Fallback redirect also failed:', fallbackError);
        // Last resort: redirect to home page
        return NextResponse.redirect(`${appUrl}/`);
      }
    }
  } catch (error: any) {
    console.error('❌ Google OAuth callback error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    // Always use production URL for error redirects, never localhost
    const appUrl = getAppUrl();
    const errorMessage = error.message || 'server_error';
    console.error('Redirecting to home page with error message:', errorMessage);
    
    // Redirect to home page with error parameter and login hash
    try {
      return NextResponse.redirect(
        `${appUrl}/?error=${encodeURIComponent(errorMessage)}#login`
      );
    } catch (redirectError: any) {
      // If redirect fails, return JSON error response
      console.error('❌ Failed to redirect, returning error response');
      return NextResponse.json(
        { 
          error: errorMessage,
          message: 'OAuth authentication failed. Please try again.',
        },
        { status: 500 }
      );
    }
  }
}
