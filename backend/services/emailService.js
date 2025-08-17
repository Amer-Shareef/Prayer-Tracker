const nodemailer = require('nodemailer');

// ENHANCED GMAIL CONFIGURATION with better error handling
const createTransporter = () => {
  console.log('📧 Setting up Gmail SMTP for real email delivery...');
  console.log('Email service:', process.env.EMAIL_SERVICE);
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.log('⚠️  Gmail credentials not configured. Check .env file.');
      console.log('Required: EMAIL_USER and EMAIL_APP_PASSWORD');
      throw new Error('Gmail credentials missing');
    }
    
    console.log('📧 Using Gmail SMTP service');
    console.log('📧 From address:', process.env.EMAIL_USER);
    console.log('📧 App password length:', process.env.EMAIL_APP_PASSWORD?.length);
    
    // Enhanced Gmail configuration
    return nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Fallback to test mode if not Gmail
    console.log('📧 Fallback to test mode - no real emails will be sent');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'verysecret'
      }
    });
  }
};

// WHATSAPP OTP SERVICE
const sendOtpWhatsApp = async (phoneNumber, otpCode) => {
  try {
    console.log(`📱 Sending OTP via WhatsApp to: ${phoneNumber}`);
    console.log(`🔢 OTP Code: ${otpCode}`);
    
    // Validate WhatsApp configuration
    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
      console.log('⚠️  WhatsApp access token not configured. Check .env file.');
      throw new Error('WhatsApp access token missing');
    }
    
    // Format phone number (remove any + or spaces)
    const formattedPhone = phoneNumber.replace(/[\+\s\-]/g, '');
    console.log(`📱 Formatted phone: ${formattedPhone}`);
    
    const whatsappPayload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: "fajr_council_otp",
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: otpCode }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              { type: "text", text: otpCode }
            ]
          }
        ]
      }
    };
    
    console.log('📤 Sending WhatsApp message...');
    const response = await fetch('https://graph.facebook.com/v22.0/781012455095743/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(whatsappPayload)
    });
    
    const result = await response.json();
    
    if (response.ok && result.messages && result.messages[0]) {
      console.log('🎉 WHATSAPP OTP SENT SUCCESSFULLY!');
      console.log(`📱 Message ID: ${result.messages[0].id}`);
      console.log(`📬 WhatsApp sent to: ${formattedPhone}`);
      
      return {
        success: true,
        messageId: result.messages[0].id,
        sentTo: formattedPhone,
        sentAt: new Date().toISOString(),
        whatsappMessage: true
      };
    } else {
      console.error('❌ WhatsApp API error:', result);
      throw new Error(result.error?.message || 'WhatsApp API error');
    }
    
  } catch (error) {
    console.error('❌ Failed to send WhatsApp OTP:', error);
    
    // Log OTP for fallback
    console.log('='.repeat(60));
    console.log(`📱 WHATSAPP FAILED BUT OTP GENERATED FOR: ${phoneNumber}`);
    console.log(`🔐 OTP CODE: ${otpCode}`);
    console.log(`⏰ EXPIRES: 10 minutes`);
    console.log(`❌ ERROR: ${error.message}`);
    console.log('='.repeat(60));
    
    return {
      success: false,
      error: error.message,
      otpCode: otpCode,
      fallbackMode: true,
      whatsappFailed: true
    };
  }
};

// ENHANCED OTP EMAIL with detailed error logging
const sendOtpEmail = async (email, username, otpCode) => {
  try {
    console.log(`📧 Sending REAL OTP email to: ${email}`);
    console.log(`🔢 OTP Code: ${otpCode}`);
    
    const transporter = createTransporter();
    
    // Enhanced verification with detailed logging
    console.log('🔧 Verifying Gmail SMTP configuration...');
    try {
      await transporter.verify();
      console.log('✅ Gmail SMTP configuration verified successfully');
    } catch (verifyError) {
      console.error('❌ Gmail SMTP verification failed:', verifyError.message);
      console.error('Full error:', verifyError);
      
      // Provide specific error guidance
      if (verifyError.code === 'EAUTH') {
        console.log('');
        console.log('🔧 AUTHENTICATION ERROR TROUBLESHOOTING:');
        console.log('1. Make sure 2FA is enabled on your Gmail account');
        console.log('2. Use App Password, NOT your regular Gmail password');
        console.log('3. App Password should be 16 characters without spaces');
        console.log('4. Generate a new App Password if current one fails');
        console.log('5. Check if "Less secure app access" is disabled (should be)');
        console.log('');
        console.log('📧 Your current config:');
        console.log(`   EMAIL_USER: ${process.env.EMAIL_USER}`);
        console.log(`   EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? `${process.env.EMAIL_APP_PASSWORD.substring(0, 4)}****` : 'NOT SET'}`);
      }
      
      throw verifyError;
    }
    
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;
    const fromName = process.env.EMAIL_FROM_NAME || 'Prayer Tracker';
    
    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: email,
      subject: `Prayer Tracker Login OTP: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #16a085; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🕌 Prayer Tracker</h1>
            <p style="color: #e8f8f5; margin: 10px 0 0 0; font-size: 16px;">Your Login Verification Code</p>
          </div>
          
          <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">Hello ${username}!</h2>
            
            <p style="font-size: 16px; color: #444; line-height: 1.6; text-align: center;">
              Someone is trying to login to your Prayer Tracker account. If this was you, please use the verification code below:
            </p>
            
            <div style="background: linear-gradient(135deg, #16a085, #27ae60); padding: 30px; margin: 30px 0; text-align: center; border-radius: 10px; box-shadow: 0 4px 15px rgba(22, 160, 133, 0.3);">
              <div style="background-color: white; padding: 20px; border-radius: 8px; display: inline-block;">
                <h1 style="color: #16a085; font-size: 48px; margin: 0; letter-spacing: 12px; font-family: 'Courier New', monospace; font-weight: bold;">${otpCode}</h1>
              </div>
              <p style="color: white; margin: 15px 0 0 0; font-size: 14px; font-weight: bold;">Enter this 4-digit code in your login screen</p>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⏰ Important:</strong> This code will expire in <strong>10 minutes</strong>
              </p>
            </div>
            
            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #721c24; font-size: 14px; margin-bottom: 10px;">
                <strong>🔒 Security Notice:</strong> If you didn't request this login:
              </p>
              <ul style="color: #721c24; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>Ignore this email</li>
                <li>Change your password immediately</li>
                <li>Contact support if you suspect unauthorized access</li>
              </ul>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message from Prayer Tracker. Please do not reply to this email.<br>
              © ${new Date().getFullYear()} Prayer Tracker. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
Prayer Tracker - Login Verification Code

Hello ${username},

Someone is trying to login to your Prayer Tracker account. If this was you, please use the verification code below:

VERIFICATION CODE: ${otpCode}

This 4-digit code will expire in 10 minutes.

SECURITY NOTICE: If you didn't request this login, please:
- Ignore this email
- Change your password immediately
- Contact support if you suspect unauthorized access

This is an automated message from Prayer Tracker.
© ${new Date().getFullYear()} Prayer Tracker. All rights reserved.
      `
    };

    console.log('📤 Sending real email via Gmail SMTP...');
    const result = await transporter.sendMail(mailOptions);
    
    console.log('🎉 REAL OTP EMAIL SENT SUCCESSFULLY!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📬 Email sent to: ${email}`);
    console.log(`📨 From: ${fromAddress}`);
    
    return { 
      success: true, 
      messageId: result.messageId,
      sentTo: email,
      sentAt: new Date().toISOString(),
      realEmail: true
    };
    
  } catch (error) {
    console.error('❌ Failed to send real OTP email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    
    // Enhanced error messages
    let errorMessage = error.message;
    let troubleshooting = [];
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed';
      troubleshooting = [
        '1. Enable 2-Factor Authentication on Gmail',
        '2. Generate a new App Password (not regular password)',
        '3. Use the 16-character App Password in EMAIL_APP_PASSWORD',
        '4. Make sure EMAIL_USER is correct',
        '5. Remove any spaces from the App Password'
      ];
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Gmail SMTP server not found';
      troubleshooting = [
        '1. Check your internet connection',
        '2. Verify Gmail SMTP settings',
        '3. Try again in a few minutes'
      ];
    }
    
    // Log OTP for fallback
    console.log('='.repeat(60));
    console.log(`📧 EMAIL FAILED BUT OTP GENERATED FOR: ${email}`);
    console.log(`👤 USERNAME: ${username}`);
    console.log(`🔐 OTP CODE: ${otpCode}`);
    console.log(`⏰ EXPIRES: 10 minutes`);
    console.log(`❌ ERROR: ${errorMessage}`);
    if (troubleshooting.length > 0) {
      console.log(`🔧 TROUBLESHOOTING:`);
      troubleshooting.forEach(tip => console.log(`   ${tip}`));
    }
    console.log('='.repeat(60));
    
    return { 
      success: false, 
      error: errorMessage,
      errorCode: error.code,
      otpCode: otpCode, // Include for fallback
      fallbackMode: true,
      troubleshooting: troubleshooting
    };
  }
};

// Send password reset email - IMPLEMENTED WITH REAL GMAIL
const sendPasswordResetEmail = async (email, username, resetLink) => {
  try {
    console.log(`📧 Sending REAL password reset email to: ${email}`);
    console.log(`🔗 Reset Link: ${resetLink}`);
    
    const transporter = createTransporter();
    
    // Verify Gmail SMTP configuration
    console.log('🔧 Verifying Gmail SMTP for password reset...');
    try {
      await transporter.verify();
      console.log('✅ Gmail SMTP configuration verified for reset email');
    } catch (verifyError) {
      console.error('❌ Gmail SMTP verification failed:', verifyError.message);
      throw verifyError;
    }
    
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;
    const fromName = process.env.EMAIL_FROM_NAME || 'Prayer Tracker';
    
    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: email,
      subject: 'Prayer Tracker - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #16a085; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🕌 Prayer Tracker</h1>
            <p style="color: #e8f8f5; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">Hello ${username}!</h2>
            
            <p style="font-size: 16px; color: #444; line-height: 1.6; text-align: center;">
              We received a request to reset your Prayer Tracker account password. If this was you, click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #16a085, #27ae60); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(22, 160, 133, 0.3);">
                🔐 Reset My Password
              </a>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⏰ Important:</strong> This link will expire in <strong>1 hour</strong> for security reasons.
              </p>
            </div>
            
            <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #0c5460; font-size: 14px; margin-bottom: 10px;">
                <strong>🔗 Can't click the button?</strong> Copy and paste this link into your browser:
              </p>
              <p style="margin: 0; color: #0c5460; font-size: 12px; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
                ${resetLink}
              </p>
            </div>
            
            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #721c24; font-size: 14px; margin-bottom: 10px;">
                <strong>🔒 Security Notice:</strong> If you didn't request this password reset:
              </p>
              <ul style="color: #721c24; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>Ignore this email - your password won't be changed</li>
                <li>Someone may have your email address</li>
                <li>Consider changing your password if you suspect unauthorized access</li>
                <li>Contact support if you have concerns</li>
              </ul>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message from Prayer Tracker. Please do not reply to this email.<br>
              © ${new Date().getFullYear()} Prayer Tracker. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
Prayer Tracker - Password Reset Request

Hello ${username},

We received a request to reset your Prayer Tracker account password. If this was you, click the link below to reset your password:

${resetLink}

IMPORTANT: This link will expire in 1 hour for security reasons.

SECURITY NOTICE: If you didn't request this password reset:
- Ignore this email - your password won't be changed
- Someone may have your email address
- Consider changing your password if you suspect unauthorized access
- Contact support if you have concerns

This is an automated message from Prayer Tracker.
© ${new Date().getFullYear()} Prayer Tracker. All rights reserved.
      `
    };

    console.log('📤 Sending password reset email via Gmail SMTP...');
    const result = await transporter.sendMail(mailOptions);
    
    console.log('🎉 REAL PASSWORD RESET EMAIL SENT SUCCESSFULLY!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📬 Email sent to: ${email}`);
    console.log(`📨 From: ${fromAddress}`);
    
    return { 
      success: true, 
      messageId: result.messageId,
      sentTo: email,
      sentAt: new Date().toISOString(),
      realEmail: true
    };
    
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    
    // Log reset link for fallback
    console.log('='.repeat(60));
    console.log(`📧 EMAIL FAILED BUT RESET LINK GENERATED FOR: ${email}`);
    console.log(`👤 USERNAME: ${username}`);
    console.log(`🔗 RESET LINK: ${resetLink}`);
    console.log(`⏰ EXPIRES: 1 hour`);
    console.log(`❌ ERROR: ${error.message}`);
    console.log('='.repeat(60));
    
    return { 
      success: false, 
      error: error.message,
      errorCode: error.code,
      resetLink: resetLink, // Include for fallback
      fallbackMode: true
    };
  }
};

module.exports = {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendOtpWhatsApp
};
