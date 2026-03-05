# Redirect to localhost Issue - All Possible Reasons

## 🔍 Root Cause Analysis

After successful login/signup, the app redirects to `http://localhost:3000/dashboard` instead of the production URL. Here are **ALL possible reasons**:

## ❌ Reason 1: Client-Side Router Uses Relative Paths

**Location:** `components/login-form.tsx`, `components/signup-form.tsx`, `app/page.tsx`

**Problem:**
```typescript
router.push("/dashboard")  // This is a RELATIVE path
```

**Why it happens:**
- `router.push()` in Next.js uses relative paths
- If you're on `http://localhost:3000`, it redirects to `http://localhost:3000/dashboard`
- If you're on `https://bonusfoodsellmanager.com`, it redirects to `https://bonusfoodsellmanager.com/dashboard`
- **BUT** if the browser has cached localhost or you're testing locally, it will use localhost

**Files affected:**
- `components/login-form.tsx` line 48
- `components/signup-form.tsx` line 61
- `app/page.tsx` lines 54, 63

## ❌ Reason 2: Browser Cache/History

**Problem:**
- Browser might have cached `localhost:3000` in history
- When using `router.push()`, browser might use cached origin
- Service workers might cache localhost URLs

## ❌ Reason 3: Development vs Production Environment

**Problem:**
- If `NODE_ENV` is not set to `production` in Vercel
- Code might think it's in development mode
- Uses localhost URLs instead of production

## ❌ Reason 4: API Routes Return Relative URLs

**Problem:**
- API routes (`/api/auth/login`, `/api/auth/signup`) return JSON, not redirects
- Client-side code handles redirects
- If client is on localhost, redirect goes to localhost

## ❌ Reason 5: Environment Variables Not Set

**Problem:**
- `NEXT_PUBLIC_APP_URL` might not be set in Vercel
- Code falls back to localhost or request origin
- Production doesn't know its own URL

## ❌ Reason 6: Client-Side Code Running Locally

**Problem:**
- If you're testing production site but browser thinks it's localhost
- Browser extensions might rewrite URLs
- Proxy/VPN might redirect to localhost

## ❌ Reason 7: Next.js Router Context

**Problem:**
- Next.js router uses `window.location.origin` internally
- If `window.location.origin` is `http://localhost:3000`, redirects go there
- Even on production, if accessed via localhost proxy, it uses localhost

## ✅ Solutions

### Solution 1: Use Full URL for Redirects (Recommended)

Replace `router.push("/dashboard")` with:

```typescript
const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  : '/dashboard';

// In production, use window.location for full redirect
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL) {
  window.location.href = dashboardUrl;
} else {
  router.push('/dashboard');
}
```

### Solution 2: Server-Side Redirects

Make API routes return redirects instead of JSON:

```typescript
// In /api/auth/login/route.ts
return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
```

### Solution 3: Use window.location.href

Force full URL redirect:

```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
window.location.href = `${appUrl}/dashboard`;
```

### Solution 4: Check Current Origin

Only redirect if not on localhost:

```typescript
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  router.push('/dashboard');
} else {
  window.location.href = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
}
```

## 🎯 Recommended Fix

Use **Solution 1** - Check environment and use full URL in production:

```typescript
const redirectToDashboard = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com';
  
  // In production, always use full URL
  if (process.env.NODE_ENV === 'production' || window.location.hostname.includes('bonusfoodsellmanager.com')) {
    window.location.href = `${appUrl}/dashboard`;
  } else {
    // In development, use relative path
    router.push('/dashboard');
  }
};
```
