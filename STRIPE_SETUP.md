# Stripe Payment Integration Setup

This application uses Stripe for processing subscription payments. Follow these steps to set up Stripe payments:

## 1. Environment Variables

The following environment variables are already configured in `.env.local`:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (public)
- `STRIPE_SECRET_KEY` - Your Stripe secret key (server-side only)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret

## 2. Stripe Webhook Setup

For production, you need to configure Stripe webhooks to receive payment events:

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/webhook`
4. Select the following events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret and update `STRIPE_WEBHOOK_SECRET` in your `.env.local`

## 3. Local Development

For local development, use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

This will give you a webhook signing secret starting with `whsec_`. Update `STRIPE_WEBHOOK_SECRET` in `.env.local` with this value.

## 4. Subscription Plans

- **Monthly Plan**: $29/month (recurring subscription)
- **Yearly Plan**: $290/year (one-time payment, renewed via webhook)

## 5. How It Works

1. User clicks "Subscribe" on the subscription page
2. A Stripe Checkout session is created via `/api/create-checkout-session`
3. User is redirected to Stripe Checkout to complete payment
4. After successful payment, Stripe sends a webhook to `/api/webhook`
5. The webhook activates the user's subscription
6. User is redirected back to the subscription page with `success=true`
7. The subscription status is synced and displayed

## 6. Testing

Use Stripe test cards for testing:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

Make sure to use test mode keys when testing locally.
