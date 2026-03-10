# Database Tables - Complete Schema

All required database tables are defined in `lib/db-schema.ts` and will be created automatically when you run the initialization endpoint.

## 📊 Required Tables

### 1. **users** Table
Stores all user accounts and authentication information.

**Columns:**
- `id` (VARCHAR(255)) - Primary key, unique user identifier
- `name` (VARCHAR(255)) - User's full name
- `email` (VARCHAR(255)) - Unique email address
- `password` (VARCHAR(255)) - Hashed password (nullable for OAuth users)
- `google_id` (VARCHAR(255)) - Google OAuth ID (nullable, unique)
- `avatar` (VARCHAR(500)) - Avatar URL (nullable)
- `created_at` (DATETIME) - Account creation timestamp
- `trial_start_date` (DATETIME) - Trial period start date
- `subscription_status` (ENUM) - 'trial', 'active', 'expired', 'cancelled' (default: 'trial')
- `subscription_end_date` (DATETIME) - Subscription expiration date
- `subscription_plan` (ENUM) - 'monthly' or 'yearly' (nullable)
- `trial_expiration_email_sent` (BOOLEAN) - Whether expiration email was sent (default: false)
- `role` (ENUM) - 'user', 'admin', 'super_admin' (default: 'user')

**Indexes:**
- `idx_email` - On email column
- `idx_google_id` - On google_id column
- `idx_subscription_status` - On subscription_status column
- `idx_role` - On role column

---

### 2. **menu_items** Table
Stores menu items for each user's restaurant.

**Columns:**
- `id` (VARCHAR(255)) - Primary key, unique menu item identifier
- `user_id` (VARCHAR(255)) - Foreign key to users.id
- `name` (VARCHAR(255)) - Menu item name
- `price` (DECIMAL(10, 2)) - Item price
- `category` (VARCHAR(100)) - Item category
- `extras` (JSON) - Additional options/add-ons as JSON
- `created_at` (DATETIME) - Creation timestamp

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

**Indexes:**
- `idx_user_id` - On user_id column
- `idx_category` - On category column

---

### 3. **orders** Table
Stores order records for each user.

**Columns:**
- `id` (VARCHAR(255)) - Primary key, unique order identifier
- `user_id` (VARCHAR(255)) - Foreign key to users.id
- `order_number` (VARCHAR(50)) - Human-readable order number
- `date` (DATETIME) - Order date/time
- `items` (JSON) - Order items as JSON array
- `total_amount` (DECIMAL(10, 2)) - Total order amount
- `discount_amount` (DECIMAL(10, 2)) - Discount applied (default: 0)
- `final_amount` (DECIMAL(10, 2)) - Final amount after discount
- `payment_method` (VARCHAR(50)) - Payment method used
- `created_at` (DATETIME) - Creation timestamp

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

**Indexes:**
- `idx_user_id` - On user_id column
- `idx_order_number` - On order_number column
- `idx_date` - On date column

---

### 4. **restaurant_settings** Table
Stores restaurant information for each user.

**Columns:**
- `user_id` (VARCHAR(255)) - Primary key, foreign key to users.id
- `name` (VARCHAR(255)) - Restaurant name
- `address` (TEXT) - Restaurant address (nullable)
- `contact_number` (VARCHAR(50)) - Contact phone number (nullable)
- `updated_at` (DATETIME) - Last update timestamp (auto-updated)

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

---

### 5. **payments** Table
Stores payment records for subscription payments and approval workflow.

**Columns:**
- `id` (VARCHAR(255)) - Primary key, unique payment identifier
- `user_id` (VARCHAR(255)) - Foreign key to users.id
- `amount` (DECIMAL(10, 2)) - Payment amount
- `currency` (VARCHAR(10)) - Currency code (default: 'EUR')
- `plan` (ENUM) - 'monthly' or 'yearly'
- `status` (ENUM) - 'pending', 'approved', 'rejected', 'completed' (default: 'pending')
- `stripe_session_id` (VARCHAR(255)) - Stripe session ID (nullable)
- `stripe_payment_intent_id` (VARCHAR(255)) - Stripe payment intent ID (nullable)
- `created_at` (DATETIME) - Creation timestamp
- `updated_at` (DATETIME) - Last update timestamp (auto-updated)
- `approved_by` (VARCHAR(255)) - Admin user ID who approved (nullable)
- `notes` (TEXT) - Admin notes (nullable)

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

**Indexes:**
- `idx_user_id` - On user_id column
- `idx_status` - On status column
- `idx_created_at` - On created_at column

---

## 🚀 Initialization

### Method 1: Via API Endpoint (Recommended)
```bash
curl -X POST https://bonusfoodsellmanager.com/api/db/init
```

Or visit in browser:
```
https://bonusfoodsellmanager.com/api/db/init
```

### Method 2: Via Script
```bash
pnpm tsx scripts/init-schema.ts
```

### Method 3: Manual SQL
Connect to your database and run the SQL from `lib/db-schema.ts`.

---

## ✅ What Gets Created

When you run the initialization:

1. ✅ Database `foodsell_manager` is created (if it doesn't exist)
2. ✅ All 5 tables are created with proper structure
3. ✅ All indexes are created for performance
4. ✅ All foreign keys are set up with CASCADE delete
5. ✅ Missing columns are added to existing tables (for migrations)
6. ✅ Default values are set for all columns

---

## 🔧 Migration Endpoints

### Add Role Column
If the `role` column is missing:
```bash
curl -X POST https://bonusfoodsellmanager.com/api/db/migrate-role
```

---

## 📝 Notes

- All tables use `InnoDB` engine for transaction support
- All tables use `utf8mb4` charset for full Unicode support
- Foreign keys use `ON DELETE CASCADE` to maintain referential integrity
- All timestamps use `DATETIME` type
- JSON columns store structured data (extras, items)
- All tables have proper indexes for query performance

---

## 🔍 Verification

After initialization, verify tables exist:
```sql
SHOW TABLES;
```

Check table structure:
```sql
DESCRIBE users;
DESCRIBE menu_items;
DESCRIBE orders;
DESCRIBE restaurant_settings;
DESCRIBE payments;
```

---

## ✨ Status

✅ **All tables are defined and ready to be created**
✅ **Schema initialization is complete**
✅ **Migration endpoints are available**
✅ **All foreign keys and indexes are properly configured**
