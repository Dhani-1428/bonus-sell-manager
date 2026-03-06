import nodemailer from 'nodemailer';

/**
 * Email configuration
 */
function getEmailConfig() {
  return {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'bonusfoodsellmanager@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD || 'ktzj nnif igtt lsre', // Gmail App Password
    },
  };
}

/**
 * Create email transporter
 */
function createTransporter() {
  const config = getEmailConfig();
  const emailPassword = config.auth.pass.replace(/\s/g, ''); // Remove spaces from app password
  
  console.log('📧 Creating email transporter:', {
    host: config.host,
    port: config.port,
    user: config.auth.user,
    passwordLength: emailPassword.length,
    hasPassword: !!emailPassword,
  });
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: emailPassword,
    },
    // Add timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
}

/**
 * Send welcome/login email to user
 */
export async function sendLoginEmail(userEmail: string, userName: string): Promise<void> {
  // Validate inputs
  if (!userEmail || !userName) {
    console.error('❌ Cannot send login email: missing email or name', { userEmail, userName });
    return;
  }

  // Check environment variables
  const emailUser = process.env.EMAIL_USER || 'bonusfoodsellmanager@gmail.com';
  const emailPassword = process.env.EMAIL_APP_PASSWORD || 'ktzjnnifigttlsre';
  
  if (!emailPassword || emailPassword === 'ktzjnnifigttlsre') {
    console.warn('⚠️ Using default email password - make sure EMAIL_APP_PASSWORD is set in Vercel');
  }

  try {
    console.log('📧 Attempting to send login email to:', userEmail);
    console.log('📧 Email config:', {
      from: emailUser,
      hasPassword: !!emailPassword,
      passwordLength: emailPassword?.length || 0,
    });
    
    const transporter = createTransporter();
    const fromEmail = emailUser;
    
    // Verify transporter is configured
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }
    
    const mailOptions = {
      from: `"Bonus Food Sell Manager" <${fromEmail}>`,
      to: userEmail,
      subject: 'Welcome Back! You\'ve Successfully Logged In',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome Back</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome Back, ${userName}!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              You have successfully logged into your <strong>Bonus Food Sell Manager</strong> admin panel.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Login Details:</strong><br>
                Email: ${userEmail}<br>
                Time: ${new Date().toLocaleString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </p>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">
              If you did not log in to your account, please secure your account immediately by changing your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              This is an automated email from Bonus Food Sell Manager.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome Back, ${userName}!

You have successfully logged into your Bonus Food Sell Manager admin panel.

Login Details:
Email: ${userEmail}
Time: ${new Date().toLocaleString()}

If you did not log in to your account, please secure your account immediately by changing your password.

Visit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/dashboard

---
This is an automated email from Bonus Food Sell Manager.
Please do not reply to this email.
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Login email sent successfully:', {
      messageId: info.messageId,
      to: userEmail,
      from: fromEmail,
      response: info.response,
    });
  } catch (error: any) {
    console.error('❌ Failed to send login email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      to: userEmail,
      fromEmail: process.env.EMAIL_USER || 'bonusfoodsellmanager@gmail.com',
      hasAppPassword: !!process.env.EMAIL_APP_PASSWORD,
      stack: error.stack,
    });
    // Don't throw error - email failure shouldn't block login
    // Just log it for monitoring
  }
}

/**
 * Send welcome email for new signups
 */
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
  try {
    const transporter = createTransporter();
    const fromEmail = process.env.EMAIL_USER || 'bonusfoodsellmanager@gmail.com';
    
    const mailOptions = {
      from: `"Bonus Food Sell Manager" <${fromEmail}>`,
      to: userEmail,
      subject: 'Welcome to Bonus Food Sell Manager!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome, ${userName}!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for joining <strong>Bonus Food Sell Manager</strong>! We're excited to have you on board.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Your account has been successfully created and you're all set to start managing your restaurant.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Account Details:</strong><br>
                Name: ${userName}<br>
                Email: ${userEmail}<br>
                Account Created: ${new Date().toLocaleString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Get Started
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              This is an automated email from Bonus Food Sell Manager.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome, ${userName}!

Thank you for joining Bonus Food Sell Manager! We're excited to have you on board.

Your account has been successfully created and you're all set to start managing your restaurant.

Account Details:
Name: ${userName}
Email: ${userEmail}
Account Created: ${new Date().toLocaleString()}

Get started: ${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/dashboard

---
This is an automated email from Bonus Food Sell Manager.
Please do not reply to this email.
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully:', info.messageId);
  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error);
    // Don't throw error - email failure shouldn't block signup
  }
}

/**
 * Send trial expiration warning email (3 days left)
 */
export async function sendTrialExpirationEmail(userEmail: string, userName: string, daysRemaining: number): Promise<void> {
  // Validate inputs
  if (!userEmail || !userName) {
    console.error('❌ Cannot send trial expiration email: missing email or name', { userEmail, userName });
    return;
  }

  const emailUser = process.env.EMAIL_USER || 'bonusfoodsellmanager@gmail.com';
  const emailPassword = process.env.EMAIL_APP_PASSWORD || 'ktzjnnifigttlsre';

  try {
    console.log('📧 Attempting to send trial expiration email to:', userEmail);
    const transporter = createTransporter();
    const fromEmail = emailUser;
    
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }
    
    const mailOptions = {
      from: `"Bonus Food Sell Manager" <${fromEmail}>`,
      to: userEmail,
      subject: `⚠️ Your Free Trial Ends in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trial Expiring Soon</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Trial Expiring Soon!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${userName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Your <strong>free trial</strong> is ending soon! You have <strong style="color: #f59e0b; font-size: 18px;">${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong> remaining to enjoy full access to your admin panel.
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>⚠️ Important:</strong> After your trial expires, you'll lose access to your dashboard. Subscribe now to continue managing your restaurant seamlessly!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/subscription#subscribe" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Subscribe Now
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Choose Your Plan:</strong><br>
                • <strong>6 Months:</strong> €120 - Perfect for getting started<br>
                • <strong>12 Months:</strong> €199 - Best value with exclusive features
              </p>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">
              Don't miss out on managing your restaurant efficiently. Subscribe today and continue enjoying all the features!
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              This is an automated email from Bonus Food Sell Manager.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
⚠️ Trial Expiring Soon!

Hi ${userName},

Your free trial is ending soon! You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining to enjoy full access to your admin panel.

⚠️ Important: After your trial expires, you'll lose access to your dashboard. Subscribe now to continue managing your restaurant seamlessly!

Subscribe Now: ${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/subscription

Choose Your Plan:
• 6 Months: €120 - Perfect for getting started
• 12 Months: €199 - Best value with exclusive features

Don't miss out on managing your restaurant efficiently. Subscribe today and continue enjoying all the features!

---
This is an automated email from Bonus Food Sell Manager.
Please do not reply to this email.
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Trial expiration email sent successfully:', {
      messageId: info.messageId,
      to: userEmail,
      daysRemaining,
    });
  } catch (error: any) {
    console.error('❌ Failed to send trial expiration email:', {
      error: error.message,
      code: error.code,
      to: userEmail,
      daysRemaining,
    });
  }
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail(
  userEmail: string,
  userName: string,
  plan: "monthly" | "yearly",
  endDate: string
): Promise<void> {
  // Validate inputs
  if (!userEmail || !userName) {
    console.error('❌ Cannot send subscription confirmation email: missing email or name', { userEmail, userName });
    return;
  }

  const emailUser = process.env.EMAIL_USER || 'bonusfoodsellmanager@gmail.com';
  const emailPassword = process.env.EMAIL_APP_PASSWORD || 'ktzjnnifigttlsre';
  const planName = plan === "monthly" ? "6 Months" : "12 Months";
  const planPrice = plan === "monthly" ? "€120" : "€199";

  try {
    console.log('📧 Attempting to send subscription confirmation email to:', userEmail);
    const transporter = createTransporter();
    const fromEmail = emailUser;
    
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }
    
    const endDateFormatted = new Date(endDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const mailOptions = {
      from: `"Bonus Food Sell Manager" <${fromEmail}>`,
      to: userEmail,
      subject: '🎉 Subscription Activated Successfully!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Subscription Confirmed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Subscription Activated!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${userName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for subscribing to <strong>Bonus Food Sell Manager</strong>! Your subscription has been successfully activated.
            </p>
            
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #166534;">
                <strong>✅ Subscription Details:</strong><br>
                Plan: ${planName} Plan<br>
                Amount: ${planPrice}<br>
                Valid Until: ${endDateFormatted}<br>
                Status: Active
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              You now have full access to all premium features including:
            </p>
            
            <ul style="font-size: 14px; color: #666; margin: 20px 0; padding-left: 20px;">
              <li>Unlimited orders & menu items</li>
              <li>Full dashboard & reports</li>
              <li>CSV export functionality</li>
              ${plan === "yearly" ? '<li>Unlimited user accounts</li><li>Priority support</li><li>Advanced analytics</li>' : ''}
              <li>All future updates</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              This is an automated email from Bonus Food Sell Manager.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
🎉 Subscription Activated!

Hi ${userName},

Thank you for subscribing to Bonus Food Sell Manager! Your subscription has been successfully activated.

✅ Subscription Details:
Plan: ${planName} Plan
Amount: ${planPrice}
Valid Until: ${endDateFormatted}
Status: Active

You now have full access to all premium features including:
• Unlimited orders & menu items
• Full dashboard & reports
• CSV export functionality
${plan === "yearly" ? "• Unlimited user accounts\n• Priority support\n• Advanced analytics\n" : ""}• All future updates

Go to Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://bonusfoodsellmanager.com'}/dashboard

If you have any questions or need assistance, please don't hesitate to contact our support team.

---
This is an automated email from Bonus Food Sell Manager.
Please do not reply to this email.
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Subscription confirmation email sent successfully:', {
      messageId: info.messageId,
      to: userEmail,
      plan,
    });
  } catch (error: any) {
    console.error('❌ Failed to send subscription confirmation email:', {
      error: error.message,
      code: error.code,
      to: userEmail,
      plan,
    });
  }
}
