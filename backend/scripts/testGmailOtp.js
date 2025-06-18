require('dotenv').config();
const { sendOtpEmail } = require('../services/emailService');

async function testGmailOtp() {
  console.log('📧 Testing Real Gmail OTP Sending');
  console.log('=================================');
  
  try {
    console.log('🔧 Configuration:');
    console.log(`   Email Service: ${process.env.EMAIL_SERVICE}`);
    console.log(`   Gmail User: ${process.env.EMAIL_USER}`);
    console.log(`   Has App Password: ${!!process.env.EMAIL_APP_PASSWORD}`);
    console.log('');
    
    if (process.env.EMAIL_SERVICE !== 'gmail') {
      console.log('❌ EMAIL_SERVICE is not set to "gmail"');
      console.log('   Please update your .env file:');
      console.log('   EMAIL_SERVICE=gmail');
      return;
    }
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.log('❌ Gmail credentials missing');
      console.log('   Please add to your .env file:');
      console.log('   EMAIL_USER=inshaf4online@gmail.com');
      console.log('   EMAIL_APP_PASSWORD=your-16-character-app-password');
      console.log('');
      console.log('💡 To get Gmail App Password:');
      console.log('   1. Go to https://myaccount.google.com/security');
      console.log('   2. Enable 2-Factor Authentication');
      console.log('   3. Go to https://myaccount.google.com/apppasswords');
      console.log('   4. Generate password for "Mail"');
      console.log('   5. Use that 16-character password (not your regular password)');
      return;
    }
    
    console.log('📧 Sending test OTP to inshaf4online@gmail.com...');
    
    // Test OTP generation with 4-digit codes
    const testOtp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`🔢 Generated 4-digit OTP: ${testOtp}`);
    // Uses same 4-digit generation logic
    
    const result = await sendOtpEmail('inshaf4online@gmail.com', 'abdullah', testOtp);
    
    if (result.success && result.realEmail) {
      console.log('');
      console.log('🎉 SUCCESS! Real Gmail OTP sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📬 Sent to: ${result.sentTo}`);
      console.log(`⏰ Sent at: ${result.sentAt}`);
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Check inshaf4online@gmail.com inbox');
      console.log('2. Look for email from Prayer Tracker');
      console.log('3. If not in inbox, check spam/promotions folder');
      console.log(`4. The OTP in the email should be: ${testOtp}`);
      console.log(`5. The 4-digit OTP in the email should be: ${testOtp}`);
      console.log('');
      console.log('🚀 Now test with application:');
      console.log('1. npm start');
      console.log('2. Login: abdullah / abc123');
      console.log('3. Check Gmail for OTP');
      console.log('4. Enter OTP to complete login');
      
    } else if (result.fallbackMode) {
      console.log('');
      console.log('❌ Gmail SMTP failed, but OTP generated for fallback');
      console.log(`Error: ${result.error}`);
      console.log(`OTP: ${result.otpCode}`);
      
      if (result.errorCode === 'EAUTH') {
        console.log('');
        console.log('🔧 Authentication Error - Check these:');
        console.log('1. Make sure EMAIL_SERVICE=gmail in .env');
        console.log('2. Use correct Gmail address: inshaf4online@gmail.com');
        console.log('3. Use App Password, not regular password');
        console.log('4. Make sure 2FA is enabled on Gmail account');
      }
    } else {
      console.log('❌ Failed to send OTP');
      console.log(`Error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGmailOtp();
