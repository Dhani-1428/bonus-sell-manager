/**
 * Centralized redirect utility
 * Ensures production always uses production URL, never localhost
 */

/**
 * Get the production app URL
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'https://bonusfoodsellmanager.com';
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return (
      process.env.NODE_ENV === 'production' ||
      hostname.includes('bonusfoodsellmanager.com') ||
      (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))
    );
  }
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if current hostname is localhost
 */
export function isLocalhost(): boolean {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname.includes('localhost') || hostname.includes('127.0.0.1');
  }
  return false;
}

/**
 * Get dashboard URL - always production URL in production
 */
export function getDashboardUrl(): string {
  const appUrl = getAppUrl();
  return `${appUrl}/dashboard`;
}

/**
 * Get login URL - always production URL in production
 */
export function getLoginUrl(): string {
  const appUrl = getAppUrl();
  return `${appUrl}/auth/login`;
}

/**
 * Redirect to dashboard based on user role
 * Uses production URL in production, relative path in development
 * Super admins go to /admin/dashboard, regular users go to /dashboard
 */
export function redirectToDashboard(session?: { role?: string } | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Always use relative path for client-side redirects - more reliable
  // The browser will use the current origin automatically
  const isSuperAdmin = session?.role === 'super_admin';
  const dashboardPath = isSuperAdmin ? '/admin/dashboard' : '/dashboard';
  
  console.log('🔄 Redirecting to dashboard:', dashboardPath, 'role:', session?.role || 'user');
  
  // Use window.location.href with relative path - this is the most reliable
  // The browser will automatically use the correct origin
  window.location.href = dashboardPath;
}

/**
 * Redirect to login
 * Uses production URL in production, relative path in development
 */
export function redirectToLogin(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const appUrl = getAppUrl();
  const production = isProduction();
  const localhost = isLocalhost();

  if (production && !localhost) {
    // Production: use full URL
    window.location.href = getLoginUrl();
  } else {
    // Development: use relative path
    window.location.href = '/auth/login';
  }
}

/**
 * Get redirect URL for server-side redirects
 * Always uses production URL, never localhost
 */
export function getServerRedirectUrl(path: string = '/dashboard'): string {
  const appUrl = getAppUrl();
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Never use localhost in production
  const url = `${appUrl}${cleanPath}`;
  
  // Safety check - prevent localhost URLs
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return getDashboardUrl();
  }
  
  return url;
}

/**
 * Clean redirect path - extract pathname from full URL if needed
 * Prevents localhost URLs from being used
 */
export function cleanRedirectPath(redirectPath: string | null | undefined): string {
  if (!redirectPath) {
    return '/dashboard';
  }

  // If it's a full URL, extract pathname
  if (redirectPath.startsWith('http')) {
    try {
      const url = new URL(redirectPath);
      // Never use localhost URLs
      if (url.hostname.includes('localhost') || url.hostname.includes('127.0.0.1')) {
        return '/dashboard';
      }
      return url.pathname;
    } catch (e) {
      return '/dashboard';
    }
  }

  // Ensure it starts with /
  return redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
}
