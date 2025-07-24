const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto"); // Add crypto for enhanced token generation
const { pool } = require("../config/database"); // Use same config
const { authenticateToken } = require("../middleware/auth"); // Add this import
const {
  sendOtpEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");

const router = express.Router();

// Generate 4-digit OTP
const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Check if account is locked
const isAccountLocked = (user) => {
  if (user.account_locked_until) {
    return new Date() < new Date(user.account_locked_until);
  }
  return false;
};

// Lock account after failed attempts
const lockAccount = async (userId) => {
  const lockUntil = new Date();
  lockUntil.setMinutes(lockUntil.getMinutes() + 30); // Lock for 30 minutes

  await pool.execute(
    "UPDATE users SET account_locked_until = ?, login_attempts = 0 WHERE id = ?",
    [lockUntil, userId]
  );
};

// ENHANCED LOGIN ROUTE WITH OTP
router.post("/login", async (req, res) => {
  try {
    const { username, password, otpCode } = req.body;

    console.log("🔐 Login attempt:", {
      username,
      hasPassword: !!password,
      hasOtp: !!otpCode,
    });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Query user from database - ENHANCED to fetch all user information
    const [rows] = await pool.execute(
      `SELECT u.*, 
              m.name as mosque_name,
              CONCAT(UPPER(LEFT(COALESCE(u.area, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId
       FROM users u
       LEFT JOIN mosques m ON u.mosque_id = m.id
       WHERE u.username = ?`,
      [username]
    );

    if (rows.length === 0) {
      console.log("❌ User not found:", username);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = rows[0];

    // Check if account is locked
    if (isAccountLocked(user)) {
      console.log("🔒 Account locked:", username);
      return res.status(423).json({
        success: false,
        message:
          "Account is temporarily locked due to multiple failed attempts. Please try again later.",
        accountLocked: true,
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", username);

      // Increment login attempts
      const newAttempts = (user.login_attempts || 0) + 1;
      await pool.execute("UPDATE users SET login_attempts = ? WHERE id = ?", [
        newAttempts,
        user.id,
      ]);

      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        await lockAccount(user.id);
        return res.status(423).json({
          success: false,
          message:
            "Account locked due to multiple failed attempts. Please try again in 30 minutes.",
          accountLocked: true,
        });
      }

      return res.status(401).json({
        success: false,
        message: `Invalid credentials. ${5 - newAttempts} attempts remaining.`,
      });
    }

    // If OTP is provided, verify it
    if (otpCode) {
      console.log("🔐 Verifying OTP...");

      // Check if OTP is valid and not expired
      if (!user.otp_code || user.otp_code !== otpCode) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP code",
        });
      }

      if (!user.otp_expires || new Date() > new Date(user.otp_expires)) {
        return res.status(400).json({
          success: false,
          message: "OTP code has expired. Please request a new login.",
        });
      }

      // Clear OTP and reset login attempts
      await pool.execute(
        "UPDATE users SET otp_code = NULL, otp_expires = NULL, otp_verified = TRUE, login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = ?",
        [user.id]
      );

      // Generate JWT token with all user info
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      console.log("✅ Login successful with OTP for user:", username);

      // Transform snake_case fields to camelCase for frontend consistency
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        phone: user.phone,
        status: user.status,
        dateOfBirth: user.date_of_birth,
        address: user.address,
        area: user.area,
        mobility: user.mobility,
        onRent: user.living_on_rent === 1,
        zakathEligible: user.zakath_eligible === 1,
        differentlyAbled: user.differently_abled === 1,
        MuallafathilQuloob: user.muallafathil_quloob === 1,
        joinedDate: user.joined_date,
        lastLogin: user.last_login,
        mosqueId: user.mosque_id,
        mosqueName: user.mosque_name,
        memberId: user.memberId,
      };

      return res.json({
        success: true,
        message: "Login successful",
        token,
        user: userData,
      });
    }

    // If no OTP provided, send OTP to email
    console.log("📧 Sending OTP to email:", user.email);

    const otp = generateOtp();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // OTP valid for 10 minutes

    // Store OTP in database
    await pool.execute(
      "UPDATE users SET otp_code = ?, otp_expires = ?, otp_verified = FALSE WHERE id = ?",
      [otp, otpExpires, user.id]
    );

    // Send OTP email
    const emailResult = await sendOtpEmail(user.email, user.username, otp);

    if (!emailResult.success) {
      console.error("❌ Failed to send OTP email:", emailResult.error);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification code. Please try again.",
      });
    }

    console.log("✅ OTP sent to email for user:", username);

    const response = {
      success: true,
      message: "Verification code sent to your email. Please check your inbox.",
      requiresOtp: true,
      email: user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email for security
    };

    // In development/test mode, include the OTP for easy testing
    if (process.env.NODE_ENV === "development" || emailResult.testMode) {
      response.testOtp = otp;
      response.testMessage = `For testing: Your OTP is ${otp}`;
    }

    res.json(response);
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Resend OTP route
router.post("/resend-otp", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const [users] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    // Check if user has a pending OTP request (within last 2 minutes)
    if (user.otp_expires) {
      const timeSinceLastOtp =
        Date.now() - new Date(user.otp_expires).getTime() + 10 * 60 * 1000;
      if (timeSinceLastOtp < 2 * 60 * 1000) {
        // 2 minutes
        return res.status(429).json({
          success: false,
          message: "Please wait before requesting a new verification code.",
        });
      }
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10);

    // Update OTP in database
    await pool.execute(
      "UPDATE users SET otp_code = ?, otp_expires = ? WHERE id = ?",
      [otp, otpExpires, user.id]
    );

    // Send OTP email
    const emailResult = await sendOtpEmail(user.email, user.username, otp);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification code. Please try again.",
      });
    }

    const response = {
      success: true,
      message: "New verification code sent to your email.",
    };

    // In development/test mode, include the OTP
    if (process.env.NODE_ENV === "development" || emailResult.testMode) {
      response.testOtp = otp;
    }

    res.json(response);
  } catch (error) {
    console.error("❌ Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Register route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role = "Member" } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required",
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password, role, status, joined_date) VALUES (?, ?, ?, ?, ?, CURDATE())",
      [username, email, hashedPassword, role, "active"]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: result.insertId,
        username,
        email,
        role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Change password route
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { user } = req;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Get user's current password hash
    const [userRows] = await pool.execute(
      "SELECT password FROM users WHERE id = ?",
      [user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      userRows[0].password
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.execute(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedNewPassword, user.id]
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Forgot password route - ENHANCED to actually send Gmail
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    const [users] = await pool.execute(
      "SELECT id, username, email FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message:
          "If this email exists in our system, you will receive password reset instructions.",
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await pool.execute(
      "UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?",
      [resetToken, resetExpires, user.id]
    );

    // Create reset link
    const resetLink = `${
      process.env.FRONTEND_URL || "http://13.60.193.171:3000"
    }/reset-password?token=${resetToken}`;

    // Send reset email via Gmail
    console.log(`📧 Sending password reset email to: ${email}`);
    const emailResult = await sendPasswordResetEmail(
      email,
      user.username,
      resetLink
    );

    if (emailResult.success && emailResult.realEmail) {
      console.log("✅ Password reset email sent successfully via Gmail");
      res.json({
        success: true,
        message:
          "Password reset instructions have been sent to your email address.",
      });
    } else if (emailResult.fallbackMode) {
      console.log("⚠️  Gmail failed, but reset link generated");
      // In development, include the reset link for testing
      const response = {
        success: true,
        message:
          "If this email exists in our system, you will receive password reset instructions.",
      };

      // Include reset link in development mode for testing
      if (process.env.NODE_ENV === "development") {
        response.resetLink = resetLink;
        response.developmentMode = true;
      }

      res.json(response);
    } else {
      throw new Error("Failed to send reset email");
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing password reset request",
    });
  }
});

// Reset password route
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log(
      "🔄 Password reset attempt with token:",
      token?.substring(0, 10) + "..."
    );

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Find user with valid reset token
    const [users] = await pool.execute(
      "SELECT id, username, email FROM users WHERE reset_token = ? AND reset_expires > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const user = users[0];

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await pool.execute(
      "UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    console.log(`✅ Password reset successful for user: ${user.username}`);

    res.json({
      success: true,
      message:
        "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("❌ Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
