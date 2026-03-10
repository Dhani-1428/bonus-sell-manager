# Troubleshooting: Can't See Data in Database

If you can't see data in the database, follow these steps to diagnose and fix the issue.

## 🔍 Step 1: Check Database Connection

First, verify your database connection is working:

1. **Check Environment Variables**
   - Make sure `.env` file has correct database credentials:
     ```
     DB_HOST=your-host
     DB_PORT=3306
     DB_USER=your-user
     DB_PASSWORD=your-password
     DB_NAME=foodsell_manager
     ```

2. **Test Database Connection**
   - Visit: `https://your-domain.com/api/db/init`
   - This will create tables if they don't exist
   - Check browser console for any errors

## 🔍 Step 2: Check What's in Database

Use the debug endpoint to see what data exists:

1. **View All Database Data**
   - Visit: `https://your-domain.com/api/debug/db-data`
   - This shows:
     - All tables and their row counts
     - Sample data from each table
     - Your user's specific data counts
   - **You must be logged in** to access this endpoint

2. **Check Your User's Data**
   - The endpoint shows:
     - `userData.menuItems` - Count of your menu items
     - `userData.orders` - Count of your orders
     - `userData.restaurantSettings` - Your restaurant settings
     - `userData.payments` - Count of your payments

## 🔍 Step 3: Test Data Saving

Test if data saving is working:

1. **Save Test Data**
   - Visit: `https://your-domain.com/api/test/save-data` (POST request)
   - Or use curl:
     ```bash
     curl -X POST https://your-domain.com/api/test/save-data \
       -H "Cookie: session=your-session-cookie"
     ```
   - This creates test menu item, order, and settings

2. **Verify Test Data Was Saved**
   - Visit: `https://your-domain.com/api/debug/db-data` again
   - Check if counts increased

## 🔍 Step 4: Check Migration Status

If you had localStorage data, check if migration ran:

1. **Open Browser Console** (F12)
2. **Look for migration logs**:
   - `"Found localStorage data, migrating to database..."`
   - `"✅ Migration successful: { menuItems: X, orders: Y, settings: true }"`
   - `"⚠️ Migration had errors: [...]"`

3. **Manual Migration** (if needed):
   - Open browser console
   - Run:
     ```javascript
     // Replace USER_ID with your actual user ID
     const { migrateLocalStorageToDatabase } = await import('/lib/migrate-localStorage-to-db')
     const result = await migrateLocalStorageToDatabase('USER_ID')
     console.log(result)
     ```

## 🔍 Step 5: Verify Data is Being Saved

When you create menu items or orders in the UI:

1. **Check Browser Console** for errors
2. **Check Network Tab** (F12 → Network):
   - Look for API calls to `/api/users/[userId]/menu-items` or `/api/users/[userId]/orders`
   - Check if they return 200 OK or have errors
   - Check the response to see if data was saved

3. **Check Server Logs** (if available):
   - Look for database errors
   - Look for "Error saving menu items" or "Error saving orders"

## 🔍 Step 6: Common Issues and Fixes

### Issue 1: Tables Don't Exist
**Symptoms**: Errors about tables not existing
**Fix**: 
- Visit `/api/db/init` to create tables
- Check database manually: `SHOW TABLES;`

### Issue 2: Wrong Database Name
**Symptoms**: Data saved but can't find it
**Fix**:
- Check `.env` file: `DB_NAME=foodsell_manager`
- Verify you're querying the correct database
- Check debug endpoint shows correct database name

### Issue 3: User ID Mismatch
**Symptoms**: Data exists but not showing for your user
**Fix**:
- Check your user ID in `/api/debug/db-data`
- Verify `user_id` column matches your user ID
- Check if you're logged in with the correct account

### Issue 4: Data Not Migrating from localStorage
**Symptoms**: Old data still in localStorage, not in database
**Fix**:
- Check browser console for migration logs
- Manually trigger migration (see Step 4)
- Check if localStorage has data: `localStorage.getItem('restaurant_YOUR_USER_ID_menuItems')`

### Issue 5: API Routes Not Working
**Symptoms**: 401/403 errors when saving data
**Fix**:
- Make sure you're logged in
- Check session cookie exists
- Verify API routes are accessible

## 🔍 Step 7: Direct Database Query

If you have direct database access, run these queries:

```sql
-- Check if tables exist
SHOW TABLES;

-- Check menu items for your user (replace USER_ID)
SELECT COUNT(*) FROM menu_items WHERE user_id = 'USER_ID';
SELECT * FROM menu_items WHERE user_id = 'USER_ID' LIMIT 5;

-- Check orders for your user
SELECT COUNT(*) FROM orders WHERE user_id = 'USER_ID';
SELECT * FROM orders WHERE user_id = 'USER_ID' LIMIT 5;

-- Check restaurant settings
SELECT * FROM restaurant_settings WHERE user_id = 'USER_ID';

-- Check all users
SELECT id, name, email FROM users LIMIT 10;
```

## ✅ Verification Checklist

- [ ] Database connection is working (`/api/db/init` succeeds)
- [ ] Tables exist (check `/api/debug/db-data`)
- [ ] You're logged in (check `/api/debug/db-data` shows your user)
- [ ] Test data saves successfully (`/api/test/save-data`)
- [ ] Browser console shows no errors when creating data
- [ ] Network tab shows successful API calls (200 OK)
- [ ] Migration ran (check console logs)
- [ ] Direct database query shows data (if you have DB access)

## 🆘 Still Not Working?

If data still isn't showing:

1. **Check Database Permissions**
   - User must have INSERT, SELECT, UPDATE, DELETE permissions
   - Check database user permissions

2. **Check Database Connection Pool**
   - Too many connections might cause issues
   - Check connection limits

3. **Check for Transaction Issues**
   - Data might be rolled back if errors occur
   - Check server logs for rollback messages

4. **Verify Environment Variables**
   - Make sure production has correct env vars
   - Check if `.env` file is being loaded

5. **Contact Support**
   - Share debug endpoint output
   - Share browser console errors
   - Share server logs (if available)
