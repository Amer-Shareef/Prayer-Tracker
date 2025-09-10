const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto"); // Add crypto for enhanced token generation
const { pool } = require("../config/database"); // Use same config
const { authenticateToken } = require("../middleware/auth"); // Add this import
const {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendOtpSms,
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
    const { username, password, phone, otpCode } = req.body;

    // Determine login method based on input
    const isMobileLogin = phone && !username && !password;
    const isDashboardLogin = username && password && !phone;

    if (!isMobileLogin && !isDashboardLogin) {
      return res.status(400).json({
        success: false,
        message:
          "Login requires either a phone number or username and password",
      });
    }

    let user;
    let loginIdentifier;

    if (isMobileLogin) {
      // Mobile login: find user by phone
      const [rows] = await pool.execute(
        `SELECT u.*, 
                a.area_name, a.address as area_address,
                CONCAT(UPPER(LEFT(COALESCE(a.area_name, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId
         FROM users u
         LEFT JOIN areas a ON u.area_id = a.area_id
         WHERE u.phone = ?`,
        [phone]
      );

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid phone number",
        });
      }

      user = rows[0];
      loginIdentifier = phone;
    } else {
      // Dashboard login: find user by username and verify password
      const [rows] = await pool.execute(
        `SELECT u.*, 
                a.area_name, a.address as area_address,
                CONCAT(UPPER(LEFT(COALESCE(a.area_name, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId
         FROM users u
         LEFT JOIN areas a ON u.area_id = a.area_id
         WHERE u.username = ?`,
        [username]
      );

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      user = rows[0];
      loginIdentifier = username;

      // Check if account is locked
      if (isAccountLocked(user)) {
        return res.status(423).json({
          success: false,
          message:
            "Account is temporarily locked due to multiple failed attempts. Please try again later.",
          accountLocked: true,
        });
      }

      // Verify password for dashboard login
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        const newAttempts = (user.login_attempts || 0) + 1;
        await pool.execute("UPDATE users SET login_attempts = ? WHERE id = ?", [
          newAttempts,
          user.id,
        ]);

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
          message: `Invalid credentials. ${
            5 - newAttempts
          } attempts remaining.`,
        });
      }
    }

    // OTP verification (common for both flows)
    if (otpCode) {
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

      await pool.execute(
        "UPDATE users SET otp_code = NULL, otp_expires = NULL, otp_verified = TRUE, login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = ?",
        [user.id]
      );

      // Issue access and refresh tokens
      const accessToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "90d" } // 15 minute access token
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "120d" } // 7 day refresh token
      );

      // Set refresh token as httpOnly cookie (backup)
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
        path: "/api/auth",
      });

      console.log("✅ Login successful with OTP for user:", loginIdentifier);
      console.log("🔑 Access token expires in: 15 minutes");
      console.log("🔄 Refresh token expires in: 7 days");

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
        areaId: user.area_id,
        areaName: user.area_name,
        mobility: user.mobility,
        onRent: user.living_on_rent === 1,
        zakathEligible: user.zakath_eligible === 1,
        differentlyAbled: user.differently_abled === 1,
        MuallafathilQuloob: user.muallafathil_quloob === 1,
        joinedDate: user.joined_date,
        lastLogin: user.last_login,
        memberId: user.memberId,
      };

      return res.json({
        success: true,
        message: "Login successful",
        token: accessToken,
        refreshToken: refreshToken,
        user: userData,
      });
    }

    // Send OTP
    const otp = generateOtp();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10);

    await pool.execute(
      "UPDATE users SET otp_code = ?, otp_expires = ?, otp_verified = FALSE WHERE id = ?",
      [otp, otpExpires, user.id]
    );

    let sendResult;
    let maskedContact;

    if (isMobileLogin) {
      // Send SMS OTP for mobile login
      sendResult = await sendOtpSms(user.phone, otp);
      maskedContact = user.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");
    } else {
      // Send email OTP for dashboard login
      sendResult = await sendOtpEmail(user.email, user.username, otp);
      maskedContact = user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    }

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification code. Please try again.",
      });
    }

    const response = {
      success: true,
      message: `Verification code sent to your ${
        isMobileLogin ? "phone" : "email"
      }. Please check your inbox.`,
      requiresOtp: true,
      contact: maskedContact,
      loginMethod: isMobileLogin ? "mobile" : "dashboard",
    };

    if (process.env.NODE_ENV === "development" || sendResult.testMode) {
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

// Refresh endpoint: issues new access token if refresh token is valid
router.post("/refresh", async (req, res) => {
  try {
    console.log("🔄 Refresh token endpoint called");
    console.log("📦 Full request body:", req.body);
    console.log("🍪 Cookies:", req.cookies);
    console.log("📋 Headers:", req.headers);

    // Try to get refresh token from multiple sources
    let refreshToken;

    // Check if req.body exists and has refreshToken
    if (req.body && req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
      console.log("✅ Found refresh token in request body");
    } else if (req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
      console.log("✅ Found refresh token in cookies");
    } else if (req.headers["x-refresh-token"]) {
      refreshToken = req.headers["x-refresh-token"];
      console.log("✅ Found refresh token in headers");
    }

    console.log("🔍 Looking for refresh token...");
    console.log(
      "📦 Request body has refreshToken:",
      !!(req.body && req.body.refreshToken)
    );
    console.log(
      "🍪 Cookies has refreshToken:",
      !!(req.cookies && req.cookies.refreshToken)
    );
    console.log(
      "📋 Headers has x-refresh-token:",
      !!req.headers["x-refresh-token"]
    );

    if (!refreshToken) {
      console.log("❌ No refresh token found in request");
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    console.log("✅ Refresh token found, verifying...");
    console.log("🔑 Token preview:", refreshToken.substring(0, 20) + "...");

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      console.log("✅ Refresh token is valid for user ID:", decoded.userId);
    } catch (err) {
      console.log("❌ Invalid refresh token:", err.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Verify user still exists and is active
    console.log("🔍 Verifying user exists and is active...");
    const [users] = await pool.execute(
      "SELECT id, username, email, role, status FROM users WHERE id = ? AND status = 'active'",
      [decoded.userId]
    );

    if (users.length === 0) {
      console.log("❌ User not found or inactive");
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    const user = users[0];
    console.log("✅ User verified:", user.username);

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "90d" } // 1 minute for testing, change to 15m for production
    );

    // Optionally generate new refresh token (rotate refresh tokens)
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "120d" } // 3 minutes for testing, change to 7d for production
    );

    // Update refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 120 * 24 * 60 * 60 * 1000, // 120 days
      path: "/api/auth",
    });

    console.log(
      "🔄 Access token refreshed successfully for user:",
      user.username
    );
    console.log("🔑 New access token expires in: 90 days");
    console.log("🔄 New refresh token expires in: 120 days");

    return res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("❌ Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during token refresh",
    });
  }
});

// Logout endpoint: clears refresh token cookie
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ success: true, message: "Logged out" });
});

// Resend OTP route
router.post("/resend-otp", async (req, res) => {
  try {
    const { username, phone } = req.body;

    // Determine resend method based on input
    const isMobileResend = phone && !username;
    const isDashboardResend = username && !phone;

    if (!isMobileResend && !isDashboardResend) {
      return res.status(400).json({
        success: false,
        message: "Resend requires either a phone number or username",
      });
    }

    let user;
    if (isMobileResend) {
      const [users] = await pool.execute(
        "SELECT * FROM users WHERE phone = ?",
        [phone]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      user = users[0];
    } else {
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
      user = users[0];
    }

    if (user.otp_expires) {
      const timeSinceLastOtp =
        Date.now() - new Date(user.otp_expires).getTime() + 10 * 60 * 1000;
      if (timeSinceLastOtp < 2 * 60 * 1000) {
        return res.status(429).json({
          success: false,
          message: "Please wait before requesting a new verification code.",
        });
      }
    }

    const otp = generateOtp();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10);

    await pool.execute(
      "UPDATE users SET otp_code = ?, otp_expires = ? WHERE id = ?",
      [otp, otpExpires, user.id]
    );

    let sendResult;
    let maskedContact;

    if (isMobileResend) {
      // Send SMS OTP
      sendResult = await sendOtpSms(user.phone, otp);
      maskedContact = user.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");
    } else {
      // Send email OTP
      sendResult = await sendOtpEmail(user.email, user.username, otp);
      maskedContact = user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    }

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification code. Please try again.",
      });
    }

    const response = {
      success: true,
      message: `New verification code sent to your ${
        isMobileResend ? "phone" : "email"
      }.`,
      contact: maskedContact,
    };

    if (process.env.NODE_ENV === "development" || sendResult.testMode) {
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
    const {
      email,
      password,
      role = "Member",
      area_id,
      sub_areas_id,
      date_of_birth,
      mobility,
      full_name,
      phone,
      address,
    } = req.body;

    // Require full_name and contact phone; email and password are optional
    if (!full_name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Full name and contact phone number are required",
      });
    }

    // For Founders, area_id is mandatory
    if (role === "Founder" && !area_id) {
      return res.status(400).json({
        success: false,
        message: "Area selection is required for Founders",
      });
    }

    // Verify area exists if area_id is provided
    if (area_id) {
      const [areaExists] = await pool.execute(
        "SELECT area_id FROM areas WHERE area_id = ?",
        [area_id]
      );

      if (areaExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid area selected",
        });
      }
    }

    // Verify sub-area exists if sub_areas_id is provided
    if (sub_areas_id) {
      const [subAreaExists] = await pool.execute(
        "SELECT id FROM sub_areas WHERE id = ? AND area_id = ?",
        [sub_areas_id, area_id]
      );

      if (subAreaExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid sub-area selected for this area",
        });
      }
    }

    // Check if user already exists (by phone only, since email is shared dummy address)
    const [existingUsers] = await pool.execute(
      "SELECT * FROM users WHERE phone = ?",
      [phone]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A user with this phone number already exists",
      });
    }

    // Use default email and password if not provided
    const defaultEmail = email || "thalibaan25@gmail.com";
    const defaultPassword = password || "123pass";

    // Hash password (either provided or default)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    // Insert new user with username set to full_name to avoid missing-username issues
    const [result] = await pool.execute(
      `INSERT INTO users (
        username, full_name, email, password, role, area_id, sub_areas_id, 
        date_of_birth, mobility, phone, address, 
        status, joined_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [
        full_name || null,
        full_name || null,
        defaultEmail,
        hashedPassword,
        role,
        area_id || null,
        sub_areas_id || null,
        date_of_birth || null,
        mobility || null,
        phone || null,
        address || null,
        "active",
      ]
    );
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: result.insertId,
        full_name,
        email: defaultEmail,
        phone,
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
      process.env.FRONTEND_URL || "http://localhost:3000"
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
