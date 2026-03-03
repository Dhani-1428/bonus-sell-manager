# Database Migration Guide

This guide explains how to migrate all user data from localStorage to MySQL database and sync existing Clerk users.

## Overview

The application now stores all user data in MySQL database instead of localStorage:
- **Users** - User accounts and subscription info
- **Menu Items** - Restaurant menu items
- **Orders** - Order history
- **Restaurant Settings** - Restaurant information

## Step 1: Initialize Production Database Schema

First, ensure your production database has the schema initialized:

```bash
# Visit this URL after deployment:
https://bonusfoodsellmanager.com/api/db/init
```

Or use curl:
```bash
curl -X POST https://bonusfoodsellmanager.com/api/db/init
```

## Step 2: Sync All Clerk Users to Database

Sync all existing Clerk users to the database:

```bash
# Visit this URL:
https://bonusfoodsellmanager.com/api/clerk/sync-users
```

Or use curl:
```bash
curl -X POST https://bonusfoodsellmanager.com/api/clerk/sync-users
```

This will:
- Fetch all users from Clerk
- Create users in database if they don't exist
- Update existing users with latest info from Clerk
- Initialize restaurant settings for each user

## Step 3: Verify Users in Database

Check if users are in the database:

```bash
# Run locally:
pnpm tsx scripts/check-users.ts
```

Or visit the test endpoint:
```
https://bonusfoodsellmanager.com/api/webhooks/clerk/test
```

## Step 4: Migrate Existing localStorage Data (Optional)

If you have existing users with data in localStorage, you'll need to:

1. **For each user**, create an API endpoint or script to migrate:
   - Menu items from localStorage → database
   - Orders from localStorage → database
   - Restaurant settings from localStorage → database

2. **Update your application code** to use database functions instead of localStorage:
   - Replace `lib/store.ts` imports with `lib/db-store.ts`
   - Update components to use async database functions

## Database Functions

New database functions are available in `lib/db-store.ts`:

### Menu Items
- `getMenuItems(userId)` - Get all menu items for a user
- `saveMenuItems(userId, items)` - Save all menu items
- `addMenuItem(userId, item)` - Add a new menu item
- `updateMenuItem(userId, id, data)` - Update a menu item
- `deleteMenuItem(userId, id)` - Delete a menu item

### Orders
- `getOrders(userId)` - Get all orders for a user
- `saveOrders(userId, orders)` - Save all orders
- `addOrder(userId, order)` - Add a new order
- `updateOrder(userId, id, data)` - Update an order
- `deleteOrder(userId, id)` - Delete an order

### Restaurant Settings
- `getRestaurantSettings(userId)` - Get restaurant settings
- `saveRestaurantSettings(userId, settings)` - Save restaurant settings
- `initializeRestaurantSettings(userId, name)` - Initialize default settings

## API Endpoints

### Initialize Database Schema
```
POST /api/db/init
```
Creates all necessary tables in the database.

### Sync Clerk Users
```
POST /api/clerk/sync-users
```
Fetches all users from Clerk and syncs them to the database.

### Test Webhook Setup
```
GET /api/webhooks/clerk/test
```
Checks environment variables, database connection, and table existence.

## Future Webhook Events

Going forward, all new users created via Clerk will automatically be stored in the database through the webhook endpoint:
- `POST /api/webhooks/clerk` - Handles `user.created`, `user.updated`, `user.deleted` events

## Troubleshooting

### Users not syncing
1. Check Clerk API key is set in environment variables
2. Verify database connection is working
3. Check Vercel function logs for errors
4. Ensure database schema is initialized

### Data not appearing
1. Verify user exists in database: `pnpm tsx scripts/check-users.ts`
2. Check database connection from production
3. Verify environment variables are set in Vercel
4. Check function logs for database errors

### Migration issues
1. Ensure database schema is up to date
2. Check foreign key constraints
3. Verify user IDs match between Clerk and database
4. Check transaction logs for rollbacks
