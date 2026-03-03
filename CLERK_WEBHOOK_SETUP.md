# Clerk Webhook Setup

This application uses Clerk webhooks to automatically sync user data to the database when users sign up.

## 1. Webhook Configuration

### Endpoint URL
```
https://bonusfoodsellmanager.com/api/webhooks/clerk
```

### Signing Secret
```
whsec_vuiQ3aVbelwtrdlfXK5hkdczgPRT47jm
```

## 2. Environment Variable

Add the following to your `.env.local` file:

```env
CLERK_WEBHOOK_SECRET=whsec_vuiQ3aVbelwtrdlfXK5hkdczgPRT47jm
```

## 3. Clerk Dashboard Setup

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Webhooks**
3. Click **Add Endpoint**
4. Enter the endpoint URL: `https://bonusfoodsellmanager.com/api/webhooks/clerk`
5. Select the following events to listen for:
   - `user.created` - When a new user signs up
   - `user.updated` - When user information is updated
   - `user.deleted` - When a user is deleted
6. Copy the **Signing Secret** (starts with `whsec_`)
7. Update `CLERK_WEBHOOK_SECRET` in your environment variables

## 4. How It Works

### User Created Event (`user.created`)
When a new user signs up through Clerk:

1. Clerk sends a webhook to `/api/webhooks/clerk`
2. The webhook is verified using the signing secret
3. User data is extracted from the webhook payload:
   - User ID (from Clerk)
   - Email address
   - Name (first name, last name, or username)
   - Creation timestamp
4. User is inserted into the `users` table with:
   - Default subscription status: `trial`
   - Trial start date: Current date
   - Password: `null` (Clerk handles authentication)
5. Restaurant settings are initialized for the user
6. Response is sent back to Clerk

### User Updated Event (`user.updated`)
When user information is updated in Clerk:

1. Webhook is received and verified
2. User data in the database is updated:
   - Name
   - Email address
3. Restaurant settings name is also updated

### User Deleted Event (`user.deleted`)
When a user is deleted from Clerk:

1. Webhook is received and verified
2. User is deleted from the `users` table
3. Related records (menu_items, orders, restaurant_settings) are automatically deleted due to foreign key constraints with `ON DELETE CASCADE`

## 5. Database Schema

The webhook stores user data in the `users` table:

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,                    -- Clerk user ID
  name VARCHAR(255) NOT NULL,                     -- User's full name
  email VARCHAR(255) NOT NULL UNIQUE,             -- User's email
  password VARCHAR(255),                          -- NULL for Clerk users
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Account creation date
  trial_start_date DATETIME,                      -- Trial start date
  subscription_status ENUM('trial', 'active', 'expired', 'cancelled') DEFAULT 'trial',
  subscription_end_date DATETIME,
  subscription_plan ENUM('monthly', 'yearly')
);
```

## 6. Testing

### Test Webhook Locally

1. Use [ngrok](https://ngrok.com/) or similar tool to expose your local server:
   ```bash
   ngrok http 3000
   ```

2. Update the webhook URL in Clerk Dashboard to your ngrok URL:
   ```
   https://your-ngrok-url.ngrok.io/api/webhooks/clerk
   ```

3. Create a test user in Clerk
4. Check your server logs for webhook events
5. Verify user was created in the database

### Test Webhook in Production

1. Ensure `CLERK_WEBHOOK_SECRET` is set in your production environment
2. Create a test user through your signup form
3. Check database to verify user was created:
   ```sql
   SELECT * FROM users WHERE email = 'test@example.com';
   ```

## 7. Troubleshooting

### Webhook Not Receiving Events

- Verify webhook URL is correct in Clerk Dashboard
- Check that events are selected in Clerk Dashboard
- Verify `CLERK_WEBHOOK_SECRET` matches the secret in Clerk Dashboard
- Check server logs for webhook errors

### User Not Created in Database

- Check webhook logs for errors
- Verify database connection is working
- Check that user doesn't already exist (email must be unique)
- Verify database schema is initialized

### Signature Verification Failed

- Ensure `CLERK_WEBHOOK_SECRET` is correct
- Check that the secret matches the one in Clerk Dashboard
- Verify webhook URL is correct

## 8. Security

- Webhook signature is always verified before processing
- Only events from Clerk are processed
- User data is validated before database insertion
- SQL injection protection via parameterized queries
- Transactions ensure data consistency

## 9. Webhook Payload Example

```json
{
  "data": {
    "id": "user_2abc123def456",
    "email_addresses": [
      {
        "id": "idn_2abc123",
        "email_address": "user@example.com"
      }
    ],
    "primary_email_address_id": "idn_2abc123",
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "created_at": 1234567890
  },
  "type": "user.created"
}
```
