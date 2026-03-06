# Super Admin Login Fix

## 🔍 Problem
Getting "Invalid email or password" when trying to login to super admin panel.

## ✅ Solution

### Step 1: Check if Super Admin Exists

Visit this URL in your browser (or use curl):
```
https://bonusfoodsellmanager.com/api/admin/check-or-create
```

This will:
- Check if any super admin exists
- Create one if none exists
- Return credentials if created

### Step 2: Create Super Admin (If Needed)

**Option A: Via Browser**
Visit: `https://bonusfoodsellmanager.com/api/admin/check-or-create`

**Option B: Via API with Custom Credentials**
```bash
curl -X POST https://bonusfoodsellmanager.com/api/admin/check-or-create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@bonusfoodsellmanager.com",
    "password": "YourPassword123!"
  }'
```

**Option C: Via Create Endpoint**
```bash
curl -X POST https://bonusfoodsellmanager.com/api/admin/create-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@bonusfoodsellmanager.com",
    "password": "YourPassword123!"
  }'
```

### Step 3: Login

1. Go to: `https://bonusfoodsellmanager.com/admin/login`
2. Use the credentials from Step 2
3. You should now be able to login

## 🔧 Troubleshooting

### Issue: "No super admin account exists"
**Solution:** Run the check-or-create endpoint to create one

### Issue: "Invalid email or password" (but admin exists)
**Possible causes:**
1. Wrong email - Check exact email (case-insensitive)
2. Wrong password - Password must match exactly
3. Database not initialized - Run `/api/db/init`

### Issue: Database not initialized
**Solution:** 
1. Visit: `https://bonusfoodsellmanager.com/api/db/init`
2. This creates the `role` column and `payments` table
3. Then create super admin

## 📋 Quick Setup Steps

1. **Initialize Database:**
   ```
   https://bonusfoodsellmanager.com/api/db/init
   ```

2. **Create Super Admin:**
   ```
   https://bonusfoodsellmanager.com/api/admin/check-or-create
   ```
   Or with custom credentials:
   ```
   POST /api/admin/create-super-admin
   Body: { "name": "Super Admin", "email": "your@email.com", "password": "YourPassword123!" }
   ```

3. **Login:**
   ```
   https://bonusfoodsellmanager.com/admin/login
   ```

## 🎯 Default Credentials (if created via check-or-create)

- **Email:** `admin@bonusfoodsellmanager.com`
- **Password:** `Admin123!`

**⚠️ IMPORTANT:** Change password after first login!

## ✅ Verification

After creating super admin, verify:
1. Check response from `/api/admin/check-or-create` - should show admin exists
2. Try login with credentials
3. Should redirect to `/admin/dashboard`

All fixes have been pushed to git!
