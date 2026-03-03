# Clerk Authentication Setup

This application uses Clerk for authentication. Follow these steps to set up Clerk:

## 1. Environment Variables

You need to add the following environment variables to your Vercel project:

### Required Environment Variables:

1. **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**
   - Value: `pk_test_c291bmQtc3R1cmdlb24tNzcuY2xlcmsuYWNjb3VudHMuZGV2JA`
   - This is a public key that can be exposed in the browser

2. **CLERK_SECRET_KEY**
   - Value: `sk_test_CEErk9XWdRoBNmMN2d9kJouJI7YCJGDjEGzFf5hZNb`
   - This is a secret key that should only be used server-side

## 2. Adding Environment Variables to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `bonus-sell-manager`
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_c291bmQtc3R1cmdlb24tNzcuY2xlcmsuYWNjb3VudHMuZGV2JA
   CLERK_SECRET_KEY = sk_test_CEErk9XWdRoBNmMN2d9kJouJI7YCJGDjEGzFf5hZNb
   ```

5. Make sure to select **Production**, **Preview**, and **Development** environments
6. Click **Save**

## 3. Redeploy

After adding the environment variables:

1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. The build should now succeed

## 4. Local Development

For local development, the environment variables are already configured in `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c291bmQtc3R1cmdlb24tNzcuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_CEErk9XWdRoBNmMN2d9kJouJI7YCJGDjEGzFf5hZNb
```

Make sure `.env.local` exists in your project root (it's already in `.gitignore`).

## 5. How It Works

1. Users sign up/sign in using Clerk's authentication UI
2. Clerk manages user sessions and authentication
3. The app maps Clerk user data to the existing subscription system
4. User data is initialized in localStorage for compatibility with existing features

## 6. Testing

After deployment:
1. Visit your deployed site
2. Click "Sign Up" or "Sign In"
3. Create an account or sign in with existing credentials
4. You should be redirected to the dashboard after authentication

## Troubleshooting

If you see "Missing publishableKey" error:
- Verify that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in Vercel environment variables
- Make sure you've redeployed after adding the variables
- Check that the variable name is exactly `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (case-sensitive)
