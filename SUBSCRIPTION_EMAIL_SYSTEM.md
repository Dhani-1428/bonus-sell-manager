# Complete Subscription Email System

## ✅ Features Implemented

1. **Trial Expiration Email** - Sent when 3 days left
2. **Subscription Confirmation Email** - Sent after successful payment
3. **Automatic Day Counting** - Days remaining calculated automatically
4. **Subscription Cards** - Visible on subscription page
5. **Scroll to Subscription** - When clicking subscribe from email

## 📧 Email Types

### 1. Trial Expiration Warning Email

**When:** Sent when user has 3 days (or less) remaining on free trial
**Trigger:** 
- Automatically checked on login (session route)
- Can be triggered manually via `/api/check-trial-expiration`
- Sent only once per user (tracked in database)

**Email Content:**
- Warning message about trial ending
- Days remaining prominently displayed
- "Subscribe Now" button linking to subscription page
- Plan details (6 Months: €120, 12 Months: €199)
- Professional HTML design

**Subject:** `⚠️ Your Free Trial Ends in X Day(s)`

### 2. Subscription Confirmation Email

**When:** Sent after successful Stripe payment
**Trigger:** 
- Stripe webhook (`checkout.session.completed`)
- Subscription sync API (`/api/sync-subscription`)

**Email Content:**
- Success message
- Subscription details (plan, amount, valid until date)
- List of features included
- Link to dashboard
- Professional HTML design

**Subject:** `🎉 Subscription Activated Successfully!`

## 🔧 Implementation Details

### Database Schema Updates

Added new column to `users` table:
```sql
trial_expiration_email_sent BOOLEAN DEFAULT FALSE
```

This prevents sending duplicate trial expiration emails.

### API Routes

#### 1. `/api/check-trial-expiration` (GET/POST)
- Checks all users on trial
- Finds users with 2-3 days remaining
- Sends trial expiration emails
- Marks emails as sent in database
- Can be called daily via cron job

**Response:**
```json
{
  "success": true,
  "message": "Checked X users on trial",
  "emailsSent": 5,
  "errors": 0
}
```

#### 2. `/api/sync-subscription` (POST)
- Updates subscription in database
- Sends subscription confirmation email
- Updates file storage (backward compatibility)

**Request:**
```json
{
  "userId": "user_123",
  "plan": "monthly",
  "endDate": "2024-12-31T00:00:00.000Z"
}
```

#### 3. `/api/auth/session` (GET)
- Checks trial expiration on every login
- Sends email if 3 days left and not already sent
- Updates `trial_expiration_email_sent` flag

### Automatic Day Counting

Days are automatically calculated in:
- `lib/subscription.ts` - `getSubscriptionStatus()` function
- Calculates days remaining from `trial_start_date` or `subscription_end_date`
- Updates every time subscription status is checked
- Refreshes every minute on subscription page

**Trial Days:** 15 days
**Subscription Days:** 
- Monthly (6 months): 180 days
- Yearly (12 months): 365 days

## 📋 Setup Instructions

### Step 1: Update Database Schema

Run database initialization to add new column:

```bash
# Via API
curl -X POST https://bonusfoodsellmanager.com/api/db/init

# Or visit in browser
https://bonusfoodsellmanager.com/api/db/init
```

This will add the `trial_expiration_email_sent` column.

### Step 2: Set Up Daily Cron Job (Optional)

To check trial expiration daily, set up a cron job:

**Option A: Vercel Cron Jobs**
1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Add new cron job:
   - **Path:** `/api/check-trial-expiration`
   - **Schedule:** `0 9 * * *` (9 AM daily)
   - **Method:** GET

**Option B: External Cron Service**
Use services like:
- cron-job.org
- EasyCron
- GitHub Actions

Set to call: `https://bonusfoodsellmanager.com/api/check-trial-expiration`

**Option C: Manual Check**
The system also checks on login, so emails will be sent when users log in.

### Step 3: Verify Environment Variables

Make sure these are set in Vercel:
```env
EMAIL_USER=bonusfoodsellmanager@gmail.com
EMAIL_APP_PASSWORD=ktzjnnifigttlsre
NEXT_PUBLIC_APP_URL=https://bonusfoodsellmanager.com
```

## 🎯 How It Works

### Trial Expiration Flow

1. **User signs up** → Trial starts (15 days)
2. **Days counted automatically** → Every time subscription status is checked
3. **3 days remaining** → Email sent automatically (on login or via cron)
4. **Email includes** → "Subscribe Now" button
5. **User clicks button** → Redirects to `/subscription#subscribe`
6. **Page scrolls** → To subscription cards automatically
7. **User subscribes** → Payment processed via Stripe
8. **Subscription activated** → Confirmation email sent

### Subscription Confirmation Flow

1. **User completes payment** → Stripe webhook received
2. **Subscription updated** → Database updated
3. **Confirmation email sent** → With subscription details
4. **User receives email** → With dashboard link

## 📱 Subscription Page Features

- **Always shows subscription cards** - Users can subscribe anytime
- **Scroll to cards** - When coming from email link (`#subscribe`)
- **Real-time status** - Updates every minute
- **Plan details** - Clear pricing and features
- **Stripe integration** - Secure payment processing

## 🔍 Testing

### Test Trial Expiration Email

1. Create a test user
2. Manually set `trial_start_date` to 12 days ago (3 days remaining)
3. Set `trial_expiration_email_sent` to FALSE
4. Login or call `/api/check-trial-expiration`
5. Check email inbox

### Test Subscription Confirmation Email

1. Complete a test subscription payment
2. Check Stripe webhook logs
3. Verify email was sent
4. Check email inbox

## 📊 Email Tracking

- **Trial expiration emails:** Tracked via `trial_expiration_email_sent` column
- **Prevents duplicates:** Email sent only once per user
- **Subscription emails:** Sent on every successful payment

## 🚀 Deployment Checklist

- [ ] Database schema updated (run `/api/db/init`)
- [ ] Environment variables set in Vercel
- [ ] Cron job configured (optional)
- [ ] Test trial expiration email
- [ ] Test subscription confirmation email
- [ ] Verify subscription cards are visible
- [ ] Test scroll-to-subscription feature

## 🎉 Result

Users will now:
- ✅ Receive email when trial is ending (3 days left)
- ✅ See subscription cards when clicking subscribe from email
- ✅ Receive confirmation email after subscribing
- ✅ Have days counted automatically
- ✅ Get reminders to subscribe before trial expires

All features are implemented and ready to use!
