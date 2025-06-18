require("dotenv").config();
const { sendPasswordResetEmail } = require("../services/emailService");

async function testPasswordResetEmail() {
  console.log("📧 Testing Real Gmail Password Reset Email");
  console.log("==========================================");

  try {
    console.log("🔧 Configuration:");
    console.log(`   Email Service: ${process.env.EMAIL_SERVICE}`);
    console.log(`   Gmail User: ${process.env.EMAIL_USER}`);
    console.log(`   Has App Password: ${!!process.env.EMAIL_APP_PASSWORD}`);
    console.log("");

    if (process.env.EMAIL_SERVICE !== "gmail") {
      console.log('❌ EMAIL_SERVICE is not set to "gmail"');
      return;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.log("❌ Gmail credentials missing");
      return;
    }

    console.log(
      "📧 Sending test password reset email to inshaf4online@gmail.com..."
    );

    const testResetLink =
      "http://13.60.193.171:3000/reset-password?token=test-token-12345";
    console.log(`🔗 Reset Link: ${testResetLink}`);

    const result = await sendPasswordResetEmail(
      "inshaf4online@gmail.com",
      "abdullah",
      testResetLink
    );

    if (result.success && result.realEmail) {
      console.log("");
      console.log("🎉 SUCCESS! Real Gmail password reset email sent!");
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📬 Sent to: ${result.sentTo}`);
      console.log(`⏰ Sent at: ${result.sentAt}`);
      console.log("");
      console.log("📋 Next steps:");
      console.log("1. Check inshaf4online@gmail.com inbox");
      console.log(
        '2. Look for "Prayer Tracker - Password Reset Request" email'
      );
      console.log("3. Click the reset button in the email");
      console.log("4. Should redirect to reset password page");
      console.log("");
      console.log("🚀 Test the full flow:");
      console.log("1. Go to http://localhost:3000/forgot-password");
      console.log("2. Enter: inshaf4online@gmail.com");
      console.log("3. Check Gmail for reset email");
      console.log("4. Click reset link to test the flow");
    } else if (result.fallbackMode) {
      console.log("");
      console.log("❌ Gmail SMTP failed, but reset link generated");
      console.log(`Error: ${result.error}`);
      console.log(`Reset Link: ${result.resetLink}`);
    } else {
      console.log("❌ Failed to send password reset email");
      console.log(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testPasswordResetEmail();
