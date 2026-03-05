# Google OAuth Setup - Complete Guide

This guide will help you complete the Google OAuth setup for your application.

## ✅ What's Already Done

1. ✅ Database schema updated with `google_id` and `avatar` fields
2. ✅ Google OAuth API routes created (`/api/auth/google` and `/api/auth/google/callback`)
3. ✅ Google sign-in button added to login and signup forms
4. ✅ User authentication and session management implemented
5. ✅ Protected profile route created
6. ✅ Error handling and logging improved
7. ✅ Production URL handling fixed

## 🚀 Quick Setup Steps

### Step 1: Run Database Setup Script

Run the setup script to initialize everything:

```bash
npx tsx scripts/setup-google-auth.ts
```

This will:
- Test database connection
- Initialize/update database schema
- Add `google_id` and `avatar` columns if needed
- Verify environment variables
- Provide next steps

### Step 2: Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://bonusfoodsellmanager.com/api/auth/google/callback
NEXT_PUBLIC_APP_URL=https://bonusfoodsellmanager.com
```

Make sure to select **Production**, **Preview**, and **Development** environments.

### Step 3: Initialize Production Database Schema

After deploying to Vercel, initialize the database schema:

**Option A: Via API Endpoint (Recommended)**
```bash
curl -X POST https://bonusfoodsellmanager.com/api/db/init
```

Or visit in browser:
```
https://bonusfoodsellmanager.com/api/db/init
```

**Option B: Run Setup Script Locally**
```bash
npx tsx scripts/setup-google-auth.ts
```

Make sure your `.env` file has production database credentials.

### Step 4: Redeploy on Vercel

After setting environment variables:
1. Go to Vercel Dashboard → Deployments
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**

### Step 5: Test Google Login

1. Visit: `https://bonusfoodsellmanager.com`
2. Click "Sign in" or "Create account"
3. Click "Continue with Google"
4. Complete Google OAuth flow
5. You should be redirected to `/dashboard` (admin panel)

## 🔍 Verification Checklist

- [ ] Database connection works
- [ ] Database schema initialized
- [ ] `google_id` and `avatar` columns exist in `users` table
- [ ] Environment variables set in Vercel
- [ ] Application redeployed
- [ ] Google OAuth credentials configured in Google Console
- [ ] Redirect URI matches: `https://bonusfoodsellmanager.com/api/auth/google/callback`
- [ ] Google login button appears on login/signup pages
- [ ] Successful login redirects to `/dashboard`

## 🐛 Troubleshooting

### Error: "Database schema not updated"
**Solution:** Run the setup script or call `/api/db/init` endpoint

### Error: "Google OAuth not configured"
**Solution:** Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Vercel

### Error: "Invalid redirect URI"
**Solution:** Ensure `GOOGLE_REDIRECT_URI` in Google Console matches:
```
https://bonusfoodsellmanager.com/api/auth/google/callback
```

### Error: "localhost refused connection"
**Solution:** This is fixed! The code now always uses production URLs. Redeploy if you still see this.

### Users not being created
**Solution:** 
1. Check database connection
2. Verify schema is initialized
3. Check Vercel function logs for errors
4. Ensure `google_id` and `avatar` columns exist

## 📚 Additional Resources

- [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md)
- [Database Setup Guide](./DATABASE_SETUP.md)
- [Express + MongoDB Reference](./EXPRESS_MONGODB_GOOGLE_AUTH.md)

## 🎉 Success!

Once everything is set up, users can:
- Sign in with Google
- Sign up with Google
- Automatically have accounts created
- Be redirected to admin panel after login
- Have their Google profile picture saved

All authentication is handled securely with:
- CSRF protection via state parameter
- HTTP-only session cookies
- Secure cookies in production
- Proper error handling
