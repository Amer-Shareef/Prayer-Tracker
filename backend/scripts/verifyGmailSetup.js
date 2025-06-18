require('dotenv').config();
const nodemailer = require('nodemailer');

async function verifyGmailSetup() {
  console.log('🔧 Verifying Gmail SMTP Setup');
  console.log('=============================');
  
  try {
    console.log('📋 Current Configuration:');
    console.log(`   EMAIL_SERVICE: ${process.env.EMAIL_SERVICE}`);
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`   EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? 'SET (' + process.env.EMAIL_APP_PASSWORD.length + ' chars)' : 'NOT SET'}`);
    console.log('');
    
    // Check if all required variables are set
    if (!process.env.EMAIL_SERVICE || process.env.EMAIL_SERVICE !== 'gmail') {
      console.log('❌ EMAIL_SERVICE is not set to "gmail"');
      return false;
    }
    
    if (!process.env.EMAIL_USER) {
      console.log('❌ EMAIL_USER is not set');
      return false;
    }
    
    if (!process.env.EMAIL_APP_PASSWORD) {
      console.log('❌ EMAIL_APP_PASSWORD is not set');
      return false;
    }
    
    if (process.env.EMAIL_APP_PASSWORD.length !== 16) {
      console.log(`❌ EMAIL_APP_PASSWORD should be 16 characters, got ${process.env.EMAIL_APP_PASSWORD.length}`);
      console.log('   Make sure to remove spaces from the App Password');
      return false;
    }
    
    console.log('✅ All environment variables are properly set');
    console.log('✅ System configured for 4-digit OTP codes');
    console.log('');
    
    // Test Gmail SMTP connection
    console.log('🔧 Testing Gmail SMTP connection...');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    await transporter.verify();
    console.log('✅ Gmail SMTP connection successful!');
    
    console.log('');
    console.log('🎉 Gmail setup is correct! You can now send real OTP emails.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Run: npm run test-gmail-otp');
    console.log('2. Check inshaf4online@gmail.com for the 4-digit OTP test email');
    console.log('3. If successful, test login with abdullah/abc123');
    
    return true;
    
  } catch (error) {
    console.error('❌ Gmail setup verification failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.log('');
      console.log('🔧 AUTHENTICATION ERROR - Follow these steps:');
      console.log('');
      console.log('1. Go to https://myaccount.google.com/security');
      console.log('2. Make sure 2-Step Verification is ON');
      console.log('3. Go to https://myaccount.google.com/apppasswords');
      console.log('4. Select "Mail" and generate a new App Password');
      console.log('5. Copy the 16-character password (remove spaces)');
      console.log('6. Update .env file with:');
      console.log('   EMAIL_APP_PASSWORD=your16charapppassword');
      console.log('7. Make sure you use your Gmail email:');
      console.log('   EMAIL_USER=inshaf4online@gmail.com');
    }
    
    return false;
  }
}

verifyGmailSetup();
