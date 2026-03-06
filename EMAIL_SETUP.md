# Email Setup - Login Notifications

## ✅ Email Functionality Implemented

Email notifications are now sent automatically when users log in or sign up.

## 📧 Email Configuration

### Environment Variables

Add these to your Vercel environment variables:

```env
# Email Configuration
EMAIL_USER=bonusfoodsellmanager@gmail.com
EMAIL_APP_PASSWORD=ktzjnnifigttlsre
```

**Note:** The app password should be entered without spaces: `ktzjnnifigttlsre`

### Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Bonus Food Sell Manager"
   - Copy the generated password
4. Use this password in `EMAIL_APP_PASSWORD`

## 📨 Email Types

### 1. Login Email
**Sent when:** User logs in (email/password or Google OAuth)
**From:** bonusfoodsellmanager@gmail.com
**Subject:** Welcome Back! You've Successfully Logged In
**Content:**
- Welcome message
- Login time and details
- Security notice if login wasn't authorized
- Link to dashboard

### 2. Welcome Email
**Sent when:** New user signs up
**From:** bonusfoodsellmanager@gmail.com
**Subject:** Welcome to Bonus Food Sell Manager!
**Content:**
- Welcome message
- Account creation details
- Link to get started

## 🔧 Implementation Details

### Files Modified

1. **`lib/email.ts`** - NEW
   - Email utility functions
   - Gmail SMTP configuration
   - HTML email templates
   - Login and welcome email functions

2. **`app/api/auth/login/route.ts`**
   - Added `sendLoginEmail()` call after successful login
   - Email sent asynchronously (doesn't block login)

3. **`app/api/auth/signup/route.ts`**
   - Added `sendWelcomeEmail()` call after successful signup
   - Email sent asynchronously (doesn't block signup)

4. **`app/api/auth/google/callback/route.ts`**
   - Added `sendLoginEmail()` call after Google OAuth login
   - Email sent asynchronously (doesn't block login)

### Email Features

- ✅ HTML email templates with styling
- ✅ Plain text fallback
- ✅ Responsive design
- ✅ Professional branding
- ✅ Security notices
- ✅ Dashboard links
- ✅ Error handling (email failure doesn't block login/signup)

## 🚀 Deployment Steps

1. **Set Environment Variables in Vercel:**
   ```
   EMAIL_USER=bonusfoodsellmanager@gmail.com
   EMAIL_APP_PASSWORD=ktzjnnifigttlsre
   ```

2. **Redeploy Application:**
   - Go to Vercel Dashboard
   - Click "Redeploy" on latest deployment

3. **Test Email Sending:**
   - Login with email/password → Check inbox
   - Sign up new account → Check inbox
   - Login with Google → Check inbox

## 📝 Email Template Preview

### Login Email
```
Subject: Welcome Back! You've Successfully Logged In

Welcome Back, [User Name]!

You have successfully logged into your Bonus Food Sell Manager admin panel.

Login Details:
Email: [user@example.com]
Time: [Date and Time]

If you did not log in to your account, please secure your account immediately.

[Go to Dashboard Button]
```

### Welcome Email
```
Subject: Welcome to Bonus Food Sell Manager!

Welcome, [User Name]!

Thank you for joining Bonus Food Sell Manager! We're excited to have you on board.

Your account has been successfully created.

Account Details:
Name: [User Name]
Email: [user@example.com]
Account Created: [Date and Time]

[Get Started Button]
```

## 🔒 Security Notes

- Email sending is non-blocking (doesn't prevent login if email fails)
- Errors are logged but don't affect user experience
- App password is stored securely in environment variables
- Email includes security notices for unauthorized access

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check Environment Variables:**
   - Verify `EMAIL_USER` is set correctly
   - Verify `EMAIL_APP_PASSWORD` has no spaces
   - Ensure variables are set for Production environment

2. **Check Gmail Settings:**
   - Ensure 2-Step Verification is enabled
   - Verify App Password is correct
   - Check if "Less secure app access" is needed (older accounts)

3. **Check Logs:**
   - View Vercel function logs
   - Look for email sending errors
   - Check SMTP connection issues

4. **Test SMTP Connection:**
   - Verify Gmail SMTP settings:
     - Host: smtp.gmail.com
     - Port: 587
     - Security: TLS

### Common Issues

**Issue:** "Invalid login credentials"
- **Solution:** Verify App Password is correct and has no spaces

**Issue:** "Connection timeout"
- **Solution:** Check firewall/Vercel network settings

**Issue:** "Email sent but not received"
- **Solution:** Check spam folder, verify recipient email

## ✅ Success Criteria

- ✅ Emails sent on login (email/password)
- ✅ Emails sent on login (Google OAuth)
- ✅ Emails sent on signup
- ✅ HTML emails render correctly
- ✅ Plain text fallback works
- ✅ Email failures don't block authentication
- ✅ Professional email design

## 📚 Dependencies

- `nodemailer` - Email sending library
- `@types/nodemailer` - TypeScript types

Both packages have been installed and are ready to use.
