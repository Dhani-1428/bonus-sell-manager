# Production Database Setup

## Critical: Initialize Production Database Schema

Your production database on AWS RDS needs to have the schema initialized before Clerk webhooks can work.

### Option 1: Use the API Endpoint (Recommended)

After deploying to Vercel, call this endpoint once:

```bash
curl -X POST https://bonusfoodsellmanager.com/api/db/init
```

Or visit in browser:
```
https://bonusfoodsellmanager.com/api/db/init
```

This will create all necessary tables in your production database.

### Option 2: Run Script Locally Against Production Database

Make sure your `.env` file has production database credentials, then run:

```bash
pnpm tsx scripts/init-schema.ts
```

### Option 3: Manual SQL Execution

Connect to your RDS database and run the SQL from `lib/db-schema.ts`:

```sql
USE foodsell_manager;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  trial_start_date DATETIME,
  subscription_status ENUM('trial', 'active', 'expired', 'cancelled') DEFAULT 'trial',
  subscription_end_date DATETIME,
  subscription_plan ENUM('monthly', 'yearly'),
  INDEX idx_email (email),
  INDEX idx_subscription_status (subscription_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  extras JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  date DATETIME NOT NULL,
  items JSON NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_order_number (order_number),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS restaurant_settings (
  user_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact_number VARCHAR(50),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Verify Setup

### 1. Check Webhook Configuration

Visit: `https://bonusfoodsellmanager.com/api/webhooks/clerk/test`

This will show:
- Environment variables status
- Database connection status
- Table existence

### 2. Check Database Users

After a user signs up via Clerk, check if they're in the database:

```bash
pnpm tsx scripts/check-users.ts
```

### 3. Check Clerk Webhook Logs

1. Go to Clerk Dashboard → Webhooks → Your Endpoint
2. Check the Logs tab for recent webhook attempts
3. Look for successful (200) or failed (400/500) responses

### 4. Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Functions
2. Navigate to `/api/webhooks/clerk`
3. Check recent invocations and logs for errors

## Troubleshooting

### Webhook returns 500 error

**Likely cause**: Database tables don't exist

**Solution**: Initialize schema using Option 1 above

### Webhook returns 400 "no svix headers"

**Likely cause**: Webhook not configured in Clerk Dashboard

**Solution**: 
1. Go to Clerk Dashboard → Webhooks → Add Endpoint
2. URL: `https://bonusfoodsellmanager.com/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`

### Webhook returns 400 "verification failed"

**Likely cause**: Wrong webhook secret

**Solution**: 
1. Check Clerk Dashboard → Webhooks → Your Endpoint → Signing Secret
2. Update `CLERK_WEBHOOK_SECRET` in Vercel environment variables

### Database connection timeout

**Likely cause**: RDS security group not allowing Vercel IPs

**Solution**: 
1. Go to AWS RDS → Your Instance → Security Groups
2. Add inbound rule: Port 3306, Source: 0.0.0.0/0 (or Vercel IP ranges)
