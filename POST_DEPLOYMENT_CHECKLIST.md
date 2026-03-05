# Post-Deployment Checklist - After Setting Environment Variables

## ✅ Step 1: Verify Environment Variables in Vercel

Go to your Vercel Dashboard and verify these variables are set:

### Required Variables:
- [ ] `NEXT_PUBLIC_APP_URL` = `https://bonusfoodsellmanager.com`
- [ ] `FRONTEND_URL` = `https://bonusfoodsellmanager.com`
- [ ] `GOOGLE_CLIENT_ID` = (your Google client ID)
- [ ] `GOOGLE_CLIENT_SECRET` = (your Google client secret)
- [ ] `GOOGLE_REDIRECT_URI` = `https://bonusfoodsellmanager.com/api/auth/google/callback`

### Database Variables:
- [ ] `DB_HOST` = `foodsell.cluster-ctu4682g825l.eu-north-1.rds.amazonaws.com`
- [ ] `DB_PORT` = `3306`
- [ ] `DB_NAME` = `foodsell_manager`
- [ ] `DB_USER` = `bfsmanager`
- [ ] `DB_PASSWORD` = (your password)
- [ ] `DB_SSL` = `true`

### Important:
- Make sure variables are set for **Production**, **Preview**, and **Development** environments
- Click **Save** after adding variables

## 🚀 Step 2: Redeploy Application

After setting environment variables, you MUST redeploy:

1. Go to **Vercel Dashboard** → Your Project
2. Click on **Deployments** tab
3. Find the latest deployment
4. Click the **⋯** (three dots) menu
5. Click **Redeploy**
6. Wait for deployment to complete (usually 2-5 minutes)

**Why redeploy?**
- Environment variables are only loaded when the application starts
- Existing deployments don't have the new variables
- Redeploy loads the new environment variables

## 🗄️ Step 3: Initialize Database Schema

After redeploy, initialize the database:

**Option A: Via Browser**
Visit: `https://bonusfoodsellmanager.com/api/db/init`

**Option B: Via curl**
```bash
curl -X POST https://bonusfoodsellmanager.com/api/db/init
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Database schema initialized successfully",
  "database": "foodsell_manager"
}
```

This will:
- Create/verify database exists
- Add `google_id` and `avatar` columns to users table
- Create all necessary tables

## 🧪 Step 4: Test Authentication Flows

### Test 1: Email/Password Login
1. Visit: `https://bonusfoodsellmanager.com`
2. Click "Sign in"
3. Enter email and password
4. Click "Sign in"
5. **Verify:** Redirects to `https://bonusfoodsellmanager.com/dashboard` ✅
6. **Check:** URL should NOT be `http://localhost:3000/dashboard` ❌

### Test 2: Email/Password Signup
1. Visit: `https://bonusfoodsellmanager.com`
2. Click "Create account" or "Sign up"
3. Fill in name, email, password
4. Click "Create account"
5. **Verify:** Redirects to `https://bonusfoodsellmanager.com/dashboard` ✅
6. **Check:** URL should NOT be `http://localhost:3000/dashboard` ❌

### Test 3: Google OAuth Login
1. Visit: `https://bonusfoodsellmanager.com`
2. Click "Sign in" or "Create account"
3. Click "Continue with Google"
4. Complete Google authentication
5. **Verify:** Redirects to `https://bonusfoodsellmanager.com/dashboard` ✅
6. **Check:** URL should NOT be `http://localhost:3000/dashboard` ❌

## 🔍 Step 5: Verify Database Connection

Test database connection:

**Via Browser:**
Visit: `https://bonusfoodsellmanager.com/api/db/test`

**Expected Response:**
```json
{
  "success": true,
  "message": "Database connection successful"
}
```

## ✅ Step 6: Final Verification

Check these URLs in your browser:

1. **Homepage:** `https://bonusfoodsellmanager.com`
   - Should load correctly
   - Login/Signup buttons visible

2. **Google OAuth Init:** `https://bonusfoodsellmanager.com/api/auth/google`
   - Should redirect to Google login
   - Should NOT show errors

3. **Dashboard:** `https://bonusfoodsellmanager.com/dashboard`
   - Should require authentication
   - Should redirect to home if not logged in

## 🐛 Troubleshooting

### Issue: Still redirecting to localhost

**Solution:**
1. Clear browser cache and cookies
2. Try incognito/private browsing mode
3. Verify `NEXT_PUBLIC_APP_URL` is set correctly in Vercel
4. Check Vercel deployment logs for errors
5. Ensure you redeployed after setting variables

### Issue: Database connection failed

**Solution:**
1. Verify database credentials in Vercel
2. Check RDS security group allows connections
3. Verify database exists: `foodsell_manager`
4. Run `/api/db/init` to initialize schema

### Issue: Google OAuth not working

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
2. Check Google Console redirect URI matches:
   `https://bonusfoodsellmanager.com/api/auth/google/callback`
3. Verify `GOOGLE_REDIRECT_URI` in Vercel matches above
4. Check Vercel function logs for OAuth errors

### Issue: Environment variables not loading

**Solution:**
1. Ensure variables are set for correct environment (Production)
2. Redeploy application (variables load on startup)
3. Check variable names match exactly (case-sensitive)
4. Verify no typos in variable values

## 📝 Quick Reference

### Environment Variables Checklist:
```env
# Frontend
NEXT_PUBLIC_APP_URL=https://bonusfoodsellmanager.com
FRONTEND_URL=https://bonusfoodsellmanager.com

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://bonusfoodsellmanager.com/api/auth/google/callback

# Database
DB_HOST=foodsell.cluster-ctu4682g825l.eu-north-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=foodsell_manager
DB_USER=bfsmanager
DB_PASSWORD=your-password
DB_SSL=true
```

### Important URLs:
- **Homepage:** `https://bonusfoodsellmanager.com`
- **Dashboard:** `https://bonusfoodsellmanager.com/dashboard`
- **Google OAuth:** `https://bonusfoodsellmanager.com/api/auth/google`
- **OAuth Callback:** `https://bonusfoodsellmanager.com/api/auth/google/callback`
- **Init Database:** `https://bonusfoodsellmanager.com/api/db/init`
- **Test DB:** `https://bonusfoodsellmanager.com/api/db/test`

## 🎉 Success Criteria

You'll know everything is working when:

1. ✅ All environment variables are set in Vercel
2. ✅ Application redeployed successfully
3. ✅ Database schema initialized
4. ✅ Login redirects to production dashboard (not localhost)
5. ✅ Signup redirects to production dashboard (not localhost)
6. ✅ Google login redirects to production dashboard (not localhost)
7. ✅ No errors in browser console
8. ✅ No errors in Vercel function logs

## 🚀 You're Ready!

Once all steps are complete, your application will:
- ✅ Always redirect to production URL
- ✅ Never use localhost in production
- ✅ Work correctly for all authentication methods
- ✅ Be ready for users!
