# Google OAuth Setup Guide

Complete guide for setting up Google OAuth authentication in your Next.js application.

## ✅ What's Been Implemented

1. ✅ Database schema updated with `google_id` and `avatar` fields
2. ✅ Google OAuth API routes created
3. ✅ User authentication and session management
4. ✅ Protected profile route

## 📋 Prerequisites

- Google OAuth credentials (Client ID and Secret)
- Database initialized with updated schema
- Environment variables configured

## 🔧 Step 1: Environment Variables

Add these to your `.env.local` file (and Vercel environment variables):

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth Callback URL (optional - defaults to production URL)
GOOGLE_REDIRECT_URI=https://bonusfoodsellmanager.com/api/auth/google/callback

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=https://bonusfoodsellmanager.com
```

## 🗄️ Step 2: Update Database Schema

Run the migration script to add `google_id` and `avatar` columns:

```bash
npx tsx scripts/migrate-add-google-fields.ts
```

Or initialize/update the schema:

```bash
# Via API endpoint
curl -X POST https://bonusfoodsellmanager.com/api/db/init
```

The schema will automatically add the required columns.

## 🚀 Step 3: API Routes Created

### 1. Initiate Google Login
```
GET /api/auth/google
```
Redirects user to Google OAuth consent screen.

### 2. OAuth Callback Handler
```
GET /api/auth/google/callback
```
Handles Google OAuth callback, creates/updates user, and sets session cookie.

### 3. Get User Profile (Protected)
```
GET /api/auth/profile
```
Returns current authenticated user's profile.

## 📝 Step 4: Usage Examples

### Frontend: Add Google Login Button

```tsx
// components/google-login-button.tsx
'use client';

export function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Sign in with Google
    </button>
  );
}
```

### Check Authentication Status

```tsx
// hooks/use-auth.ts
'use client';

import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
```

### Protected Route Example

```tsx
// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      {user?.avatar && (
        <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full" />
      )}
    </div>
  );
}
```

## 🔐 Step 5: How It Works

1. **User clicks "Sign in with Google"**
   - Frontend redirects to `/api/auth/google`
   - Server generates CSRF state token and stores in cookie
   - User redirected to Google OAuth consent screen

2. **User authorizes on Google**
   - Google redirects to `/api/auth/google/callback` with authorization code
   - Server verifies CSRF state token
   - Server exchanges code for access token
   - Server fetches user info from Google API

3. **User Creation/Login**
   - Server checks if user exists by `googleId` or `email`
   - Creates new user or updates existing user
   - Sets session cookie with user ID
   - Redirects to dashboard

4. **Session Management**
   - Session stored in HTTP-only cookie
   - Protected routes check session cookie
   - User profile fetched from database using session ID

## 🧪 Testing

### Test Google OAuth Flow

1. **Initiate login:**
   ```bash
   curl -I http://localhost:3000/api/auth/google
   ```

2. **Test callback (after Google redirect):**
   - Complete OAuth flow in browser
   - Check browser cookies for `session` cookie
   - Verify redirect to dashboard

3. **Test profile endpoint:**
   ```bash
   curl http://localhost:3000/api/auth/profile \
     -H "Cookie: session=your_session_id"
   ```

## 🐛 Troubleshooting

### Error: "Google OAuth not configured"
- Check that `GOOGLE_CLIENT_ID` is set in environment variables
- Restart your development server after adding env vars

### Error: "Invalid OAuth state parameter"
- CSRF protection failed
- Clear cookies and try again
- Check that cookies are enabled

### Error: "User not found"
- Database schema may not be updated
- Run migration script: `npx tsx scripts/migrate-add-google-fields.ts`

### Redirect not working
- Verify `GOOGLE_REDIRECT_URI` matches Google Console settings
- Check that `NEXT_PUBLIC_APP_URL` is set correctly

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## 🔒 Security Best Practices

1. ✅ **CSRF Protection:** State parameter prevents CSRF attacks
2. ✅ **HTTP-Only Cookies:** Session cookies cannot be accessed via JavaScript
3. ✅ **Secure Cookies:** Cookies only sent over HTTPS in production
4. ✅ **Input Validation:** All user inputs are validated
5. ✅ **Error Handling:** Errors don't expose sensitive information

## 📝 Notes

- Users can sign in with Google even if they previously signed up with email
- Google account will be linked to existing email account if email matches
- Avatar is automatically updated from Google profile picture
- Session expires after 30 days of inactivity
