# Complete Database Storage Guide

All user data is now stored in MySQL database instead of localStorage. This guide explains how everything works.

## ✅ What's Stored in Database

### 1. **Users** (via Clerk Webhook & Sync)
- **New Users**: Automatically stored via `/api/webhooks/clerk` when they sign up
- **Existing Users**: Synced via `/api/clerk/sync-users` endpoint
- **Data Stored**:
  - User ID (from Clerk)
  - Name
  - Email
  - Created date
  - Subscription status
  - Trial start date

### 2. **Menu Items** (via API Routes)
- **Storage**: `/api/users/[userId]/menu-items`
- **When Created**: When user adds menu items through the UI
- **Data Stored**:
  - Menu item ID
  - Name, price, category
  - Extras/add-ons (JSON)
  - Created date

### 3. **Orders** (via API Routes)
- **Storage**: `/api/users/[userId]/orders`
- **When Created**: When user creates orders through the UI
- **Data Stored**:
  - Order ID
  - Order number
  - Date
  - Items (JSON)
  - Total, discount, final amount
  - Payment method
  - Created date

### 4. **Restaurant Settings** (via API Routes)
- **Storage**: `/api/users/[userId]/settings`
- **When Created**: Initialized when user is created, updated via UI
- **Data Stored**:
  - Restaurant name
  - Address
  - Contact number

## 🔄 How It Works

### For New Users (Clerk Webhook)

1. User signs up via Clerk
2. Clerk sends webhook to `/api/webhooks/clerk`
3. Webhook handler:
   - ✅ Stores user in `users` table
   - ✅ Initializes `restaurant_settings` table
   - ✅ Sets subscription status to "trial"
4. When user uses the app:
   - Menu items → Stored via `/api/users/[userId]/menu-items`
   - Orders → Stored via `/api/users/[userId]/orders`
   - Settings → Updated via `/api/users/[userId]/settings`

### For Existing Users (Sync Endpoint)

1. Call `/api/clerk/sync-users` endpoint
2. Endpoint:
   - ✅ Fetches all users from Clerk API
   - ✅ Stores/updates users in `users` table
   - ✅ Initializes `restaurant_settings` for each user
3. All user data is now in database

## 📡 API Endpoints

### Menu Items
```
GET    /api/users/[userId]/menu-items          - Get all menu items
POST   /api/users/[userId]/menu-items          - Add new menu item
PUT    /api/users/[userId]/menu-items          - Save all menu items (bulk)
PATCH  /api/users/[userId]/menu-items/[itemId] - Update menu item
DELETE /api/users/[userId]/menu-items/[itemId] - Delete menu item
```

### Orders
```
GET    /api/users/[userId]/orders          - Get all orders
POST   /api/users/[userId]/orders          - Add new order
PUT    /api/users/[userId]/orders          - Save all orders (bulk)
PATCH  /api/users/[userId]/orders/[orderId] - Update order
DELETE /api/users/[userId]/orders/[orderId] - Delete order
```

### Restaurant Settings
```
GET /api/users/[userId]/settings - Get restaurant settings
PUT /api/users/[userId]/settings - Update restaurant settings
```

## 💻 Using in Components

### Option 1: Use API Store Functions (Recommended)

Import from `lib/api-store.ts`:

```typescript
import { 
  getMenuItems, 
  addMenuItem, 
  getOrders, 
  addOrder,
  getRestaurantSettings 
} from "@/lib/api-store"

// Get menu items
const items = await getMenuItems(userId)

// Add menu item
const newItem = await addMenuItem(userId, {
  name: "Pizza",
  price: 10.99,
  category: "Main"
})

// Get orders
const orders = await getOrders(userId)

// Add order
const newOrder = await addOrder(userId, {
  date: new Date().toISOString(),
  items: [...],
  totalAmount: 50,
  discountAmount: 0,
  finalAmount: 50,
  paymentMethod: "cash"
})
```

### Option 2: Call API Routes Directly

```typescript
// Get menu items
const response = await fetch(`/api/users/${userId}/menu-items`)
const { items } = await response.json()

// Add menu item
await fetch(`/api/users/${userId}/menu-items`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Pizza",
    price: 10.99,
    category: "Main"
  })
})
```

## 🚀 Setup Steps

### 1. Initialize Database Schema
```
POST https://bonusfoodsellmanager.com/api/db/init
```

### 2. Sync Existing Clerk Users
```
POST https://bonusfoodsellmanager.com/api/clerk/sync-users
```

### 3. Verify Setup
```
GET https://bonusfoodsellmanager.com/api/webhooks/clerk/test
```

## 🔐 Security

- All API routes verify user authentication via Clerk
- Users can only access their own data
- Database uses prepared statements (SQL injection protection)
- Transactions ensure data consistency

## 📊 Database Schema

### users
- `id` (VARCHAR) - Primary key, Clerk user ID
- `name`, `email`, `password`
- `created_at`, `trial_start_date`
- `subscription_status`, `subscription_end_date`, `subscription_plan`

### menu_items
- `id` (VARCHAR) - Primary key
- `user_id` (VARCHAR) - Foreign key to users
- `name`, `price`, `category`
- `extras` (JSON)
- `created_at`

### orders
- `id` (VARCHAR) - Primary key
- `user_id` (VARCHAR) - Foreign key to users
- `order_number`, `date`
- `items` (JSON)
- `total_amount`, `discount_amount`, `final_amount`
- `payment_method`, `created_at`

### restaurant_settings
- `user_id` (VARCHAR) - Primary key, Foreign key to users
- `name`, `address`, `contact_number`
- `updated_at`

## ✅ Migration Checklist

- [x] Database schema created
- [x] Webhook stores users automatically
- [x] Sync endpoint for existing users
- [x] API routes for menu items
- [x] API routes for orders
- [x] API routes for restaurant settings
- [x] Client-side API functions
- [ ] Update components to use `lib/api-store.ts` instead of `lib/store.ts`

## 🎯 Next Steps

To fully migrate to database storage:

1. **Update Components**: Replace `lib/store.ts` imports with `lib/api-store.ts`
2. **Update Hooks**: Make data fetching async where needed
3. **Test**: Verify all CRUD operations work correctly
4. **Remove localStorage**: Once migration is complete, remove localStorage code

## 📝 Notes

- Menu items and orders are created on-demand when users interact with the app
- Restaurant settings are initialized when user is created
- All data is automatically stored in database via API routes
- No localStorage needed - everything is in MySQL database
