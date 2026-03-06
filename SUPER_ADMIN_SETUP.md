# Super Admin Panel - Complete Setup Guide

## ✅ Features Implemented

### 1. Super Admin Authentication
- Separate login system for super admins
- Session management with secure cookies
- Role-based access control

### 2. User Management
- View all users with pagination and search
- View detailed user information
- Edit user details (name, email)
- Edit subscriptions (status, plan, end date, trial start)
- Change user roles (user, admin)
- View user statistics (orders, menu items)
- View user payment history

### 3. Payment Management
- View all payments with pagination
- Filter payments by status
- Approve pending payments
- Reject payments
- View payment details
- Automatic subscription activation on approval

### 4. Dashboard Statistics
- Total users count
- Active subscriptions count
- Total revenue
- Pending payments count

### 5. Full Access Control
- Super admin has full rights over all users
- Can edit any user's subscription
- Can approve/reject payments
- Can change user roles
- Protected routes with authentication

## 🗄️ Database Schema

### New Tables:
1. **payments** - Payment records for approval workflow
   - id, user_id, amount, currency, plan
   - status (pending, approved, rejected, completed)
   - stripe_session_id, stripe_payment_intent_id
   - approved_by, notes, timestamps

### Updated Tables:
1. **users** - Added `role` column
   - role: ENUM('user', 'admin', 'super_admin')
   - Default: 'user'

## 🚀 Setup Instructions

### Step 1: Initialize Database Schema

Run database initialization to create tables and columns:

```bash
# Via API (after deployment)
curl -X POST https://bonusfoodsellmanager.com/api/db/init

# Or visit in browser
https://bonusfoodsellmanager.com/api/db/init
```

This will:
- Add `role` column to users table
- Create `payments` table
- Add all necessary indexes

### Step 2: Create First Super Admin

**Option A: Via API (Recommended)**
```bash
curl -X POST https://bonusfoodsellmanager.com/api/admin/create-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@bonusfoodsellmanager.com",
    "password": "YourSecurePassword123!"
  }'
```

**Option B: Via Script (Local)**
```bash
# Set environment variables
export SUPER_ADMIN_EMAIL=admin@bonusfoodsellmanager.com
export SUPER_ADMIN_PASSWORD=YourSecurePassword123!
export SUPER_ADMIN_NAME="Super Admin"

# Run script
pnpm tsx scripts/create-super-admin.ts
```

**Option C: Via Browser**
Visit: `https://bonusfoodsellmanager.com/api/admin/create-super-admin`
(You'll need to use a tool like Postman or curl)

### Step 3: Access Super Admin Panel

1. Go to: `https://bonusfoodsellmanager.com/admin/login`
2. Login with super admin credentials
3. You'll be redirected to the dashboard

## 📋 Super Admin Panel Features

### Dashboard (`/admin/dashboard`)
- **Stats Overview:**
  - Total Users
  - Active Subscriptions
  - Total Revenue
  - Pending Payments

- **Users Tab:**
  - List all users
  - Search functionality
  - Filter by subscription status
  - View user details
  - Edit user information

- **Payments Tab:**
  - List all payments
  - Filter by status
  - Approve/reject payments
  - View payment details

### User Details (`/admin/users/[userId]`)
- **User Information:**
  - Edit name and email
  - Change subscription status
  - Update subscription plan
  - Modify subscription end date
  - Change trial start date
  - Change user role

- **User Statistics:**
  - Orders count
  - Menu items count
  - Account creation date

- **Payment History:**
  - Recent payments
  - Payment status
  - Payment amounts

## 🔐 Security Features

1. **Separate Authentication:**
   - Super admin uses separate session cookie (`admin_session`)
   - Different from regular user sessions

2. **Role Verification:**
   - All admin routes verify `role = 'super_admin'`
   - Unauthorized access returns 403

3. **Protected Routes:**
   - Admin layout checks session
   - Redirects to login if not authenticated

4. **Password Security:**
   - Passwords hashed with SHA-256
   - Minimum 8 characters required

## 📡 API Endpoints

### Authentication
- `POST /api/admin/login` - Super admin login
- `GET /api/admin/session` - Get current session
- `POST /api/admin/logout` - Logout

### User Management
- `GET /api/admin/users` - List all users (with pagination, search, filters)
- `GET /api/admin/users/[userId]` - Get user details
- `PUT /api/admin/users/[userId]` - Update user

### Payment Management
- `GET /api/admin/payments` - List all payments (with pagination, filters)
- `PUT /api/admin/payments/[paymentId]` - Approve/reject payment

### Admin Creation
- `POST /api/admin/create-super-admin` - Create super admin (one-time setup)

## 🎯 Usage Examples

### Approve a Payment
```bash
curl -X PUT https://bonusfoodsellmanager.com/api/admin/payments/payment_123 \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=your_session_id" \
  -d '{"status": "approved"}'
```

### Update User Subscription
```bash
curl -X PUT https://bonusfoodsellmanager.com/api/admin/users/user_123 \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=your_session_id" \
  -d '{
    "subscription_status": "active",
    "subscription_plan": "yearly",
    "subscription_end_date": "2025-12-31T00:00:00.000Z"
  }'
```

## 🔧 Configuration

### Environment Variables
No additional environment variables needed. Uses existing:
- Database credentials
- Email settings (for subscription confirmations)

### Default Super Admin Credentials
After running the create script:
- Email: `admin@bonusfoodsellmanager.com` (or as specified)
- Password: As set in script/environment

**⚠️ IMPORTANT:** Change the default password after first login!

## 📊 Payment Workflow

1. **User Subscribes:**
   - Payment created via Stripe webhook
   - Status: `completed` (auto-approved for Stripe)
   - Subscription activated automatically

2. **Manual Payment (if needed):**
   - Super admin can create payment record
   - Status: `pending`
   - Super admin approves → Subscription activated
   - Super admin rejects → Payment rejected

3. **On Approval:**
   - Subscription activated
   - End date calculated based on plan
   - Confirmation email sent to user

## ✅ Testing Checklist

- [ ] Create super admin account
- [ ] Login to admin panel
- [ ] View all users
- [ ] Search users
- [ ] View user details
- [ ] Edit user subscription
- [ ] View all payments
- [ ] Approve payment
- [ ] Reject payment
- [ ] Verify subscription activation after approval
- [ ] Check dashboard statistics

## 🎉 Result

Super admin now has:
- ✅ Full access to all user information
- ✅ Ability to edit any user's subscription
- ✅ Payment approval/rejection system
- ✅ Complete control over all users' admin panels
- ✅ Dashboard with statistics
- ✅ User management interface
- ✅ Payment management interface

All features are implemented and ready to use!
