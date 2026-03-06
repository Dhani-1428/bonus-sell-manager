# Google OAuth Email Debugging Guide

## Issue: Emails Not Sending for Google OAuth Login

### ✅ Improvements Made

1. **Added Email Validation**
   - Checks if email and name are provided before sending
   - Logs error if validation fails

2. **Added SMTP Connection Verification**
   - Verifies email server connection before sending
   - Logs connection status

3. **Enhanced Error Logging**
   - Detailed error information including:
     - Error message and code
     - Email recipient and sender
     - Environment variable status
     - Stack traces

4. **Better Error Handling**
   - Email failures don't block login
   - Errors are logged for debugging

## 🔍 How to Debug

### Step 1: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click on "Functions" tab
3. Find the Google OAuth callback function
4. Check logs for email-related messages

Look for:
- `📧 Attempting to send login email to: [email]`
- `✅ Email server connection verified`
- `✅ Login email sent successfully`
- `❌ Failed to send login email`

### Step 2: Verify Environment Variables

Check that these are set in Vercel:

```env
EMAIL_USER=bonusfoodsellmanager@gmail.com
EMAIL_APP_PASSWORD=ktzjnnifigttlsre
```

**Important:** 
- App password should have NO spaces
- Variables must be set for Production environment
- Redeploy after setting variables

### Step 3: Check Email Credentials

1. Verify Gmail App Password is correct
2. Ensure 2-Step Verification is enabled
3. Check if App Password hasn't been revoked
4. Verify email account isn't locked

### Step 4: Test Email Sending

After deployment, test Google OAuth login and check:

1. **Vercel Logs:**
   - Look for email sending attempts
   - Check for any error messages
   - Verify email credentials are detected

2. **Email Inbox:**
   - Check spam folder
   - Verify email address is correct
   - Check if emails are being filtered

## 🐛 Common Issues

### Issue 1: "Invalid login credentials"
**Cause:** Wrong app password or spaces in password
**Solution:** 
- Verify app password in Vercel (no spaces)
- Regenerate app password if needed

### Issue 2: "Connection timeout"
**Cause:** Network/firewall blocking SMTP
**Solution:**
- Check Vercel network settings
- Verify SMTP port 587 is accessible

### Issue 3: "Email sent but not received"
**Cause:** Email filtering or wrong address
**Solution:**
- Check spam folder
- Verify recipient email is correct
- Check email provider filters

### Issue 4: "Function terminates before email sends"
**Cause:** Serverless function ends before async completes
**Solution:**
- Email is sent asynchronously (fire-and-forget)
- Should still send even if function ends
- Check logs to verify email was attempted

## 📋 Debug Checklist

- [ ] Environment variables set in Vercel
- [ ] App password has no spaces
- [ ] Variables set for Production environment
- [ ] Application redeployed after setting variables
- [ ] Vercel logs show email sending attempts
- [ ] No errors in function logs
- [ ] Email inbox checked (including spam)
- [ ] Gmail App Password is valid
- [ ] 2-Step Verification enabled

## 🔧 Next Steps

1. **Check Vercel Logs:**
   - After Google OAuth login, check function logs
   - Look for email-related messages
   - Note any errors

2. **Verify Configuration:**
   - Double-check environment variables
   - Ensure app password is correct
   - Verify email account settings

3. **Test Again:**
   - Try Google OAuth login
   - Check logs immediately after
   - Verify email was attempted

4. **If Still Not Working:**
   - Check Vercel logs for specific error
   - Verify Gmail account settings
   - Consider using a different email service (SendGrid, Mailgun, etc.)

## 📝 Log Messages to Look For

**Success:**
```
📧 Attempting to send login email to: user@example.com
✅ Email server connection verified
✅ Login email sent successfully: <message-id>
```

**Failure:**
```
❌ Failed to send login email: [error details]
Error details: { email, name, errorMessage, errorCode, ... }
```

## 🎯 Expected Behavior

1. User logs in with Google OAuth
2. Function logs: `📧 Attempting to send login email to: [email]`
3. Function logs: `✅ Email server connection verified`
4. Function logs: `✅ Login email sent successfully: [message-id]`
5. User receives email in inbox

If any step fails, check the logs for the specific error message.
