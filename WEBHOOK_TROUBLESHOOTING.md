# Clerk Webhook Troubleshooting Guide

If users created via Clerk are not appearing in your MySQL database, follow these steps:

## 1. Check Environment Variables in Vercel

Make sure these environment variables are set in your Vercel project:

- `CLERK_WEBHOOK_SECRET` - Your Clerk webhook signing secret (whsec_...)
- `DB_HOST` - Your RDS hostname
- `DB_PORT` - Database port (usually 3306)
- `DB_NAME` - Database name (foodsell_manager)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_SSL` - Set to "true" if SSL is required

**To set environment variables in Vercel:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable for Production, Preview, and Development environments

## 2. Verify Webhook Configuration in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** → **Endpoints**
3. Check if webhook endpoint exists:
   - **URL**: `https://bonusfoodsellmanager.com/api/webhooks/clerk`
   - **Events**: `user.created`, `user.updated`, `user.deleted`
   - **Status**: Should be "Active"

4. If webhook doesn't exist, create it:
   - Click **Add Endpoint**
   - Enter the URL above
   - Select the three events mentioned
   - Copy the signing secret and add it to Vercel as `CLERK_WEBHOOK_SECRET`

## 3. Check Webhook Logs in Clerk Dashboard

1. Go to Clerk Dashboard → Webhooks → Your Endpoint
2. Click on **Logs** tab
3. Look for recent webhook attempts
4. Check the status:
   - ✅ **200** = Success
   - ❌ **400/500** = Error (check response details)

## 4. Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Functions
2. Navigate to `/api/webhooks/clerk`
3. Check recent invocations and logs
4. Look for error messages or database connection issues

## 5. Test Database Connection

Run the test script locally:

```bash
pnpm tsx scripts/test-db.ts
```

Or check users in database:

```bash
pnpm tsx scripts/check-users.ts
```

## 6. Verify Database Schema

Make sure the database schema is initialized:

```bash
pnpm tsx scripts/init-schema.ts
```

Then verify:

```bash
pnpm tsx scripts/verify-schema.ts
```

## 7. Test Webhook Manually

You can test the webhook endpoint directly:

```bash
curl -X POST https://bonusfoodsellmanager.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test-id" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test-signature" \
  -d '{"type":"user.created","data":{"id":"test","email_addresses":[{"email_address":"test@example.com"}]}}'
```

Note: This will fail signature verification, but you can check if the endpoint is accessible.

## 8. Common Issues

### Issue: Webhook returns 400 "no svix headers"
**Solution**: Clerk is not sending the webhook properly. Check Clerk Dashboard webhook configuration.

### Issue: Webhook returns 400 "Webhook verification failed"
**Solution**: 
- Verify `CLERK_WEBHOOK_SECRET` matches the secret in Clerk Dashboard
- Make sure the secret doesn't have extra spaces or quotes

### Issue: Database connection timeout
**Solution**:
- Verify RDS instance is publicly accessible
- Check security group allows inbound connections from Vercel IPs (0.0.0.0/0 for port 3306)
- Verify database credentials are correct

### Issue: "Table doesn't exist" error
**Solution**: Run schema initialization script:
```bash
pnpm tsx scripts/init-schema.ts
```

### Issue: Users created before webhook setup
**Solution**: Existing users won't be in database. They'll be added when they update their profile (triggers `user.updated` event) or you can manually add them.

## 9. Manual User Creation (If Needed)

If you need to manually add a user to the database:

```sql
INSERT INTO users (id, name, email, password, created_at, trial_start_date, subscription_status)
VALUES ('user_clerk_id', 'User Name', 'user@example.com', NULL, NOW(), NOW(), 'trial');

INSERT INTO restaurant_settings (user_id, name)
VALUES ('user_clerk_id', 'User Name');
```

## 10. Next Steps

After fixing issues:
1. Create a new test user via Clerk signup
2. Check Clerk webhook logs for successful delivery
3. Check Vercel function logs for successful processing
4. Verify user appears in database using `check-users.ts` script
