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
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass.replace(/\s/g, ''), // Remove spaces from app password
    },
  });
}

/**
 * Send welcome/login email to user
 */
export async function sendLoginEmail(userEmail: string, userName: string): Promise<void> {
  try {
    const transporter = createTransporter();
    const fromEmail = process.env.EMAIL_USER || 'bonusfoodsellmanager@gmail.com';
    
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
    console.log('✅ Login email sent successfully:', info.messageId);
  } catch (error: any) {
    console.error('❌ Failed to send login email:', error);
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
