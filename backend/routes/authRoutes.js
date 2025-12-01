const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto"); // Add crypto for enhanced token generation
const { pool } = require("../config/database"); // Use same config
const { authenticateToken, authorizeRole } = require("../middleware/auth"); // Add this import
const {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendOtpSms,
} = require("../services/emailService");

// Helper function to generate secure refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

// Helper function to hash refresh token for storage
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const router = express.Router();

// Generate 4-digit OTP
const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
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
                CASE WHEN u.area_id = 0 THEN u.custom_area_name ELSE a.area_name END as effective_area_name,
                CONCAT(UPPER(LEFT(CASE WHEN u.area_id = 0 THEN u.custom_area_name ELSE a.area_name END, 2)), LPAD(u.id, 4, '0')) as memberId
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
                CASE WHEN u.area_id = 0 THEN u.custom_area_name ELSE a.area_name END as effective_area_name,
                CONCAT(UPPER(LEFT(CASE WHEN u.area_id = 0 THEN u.custom_area_name ELSE a.area_name END, 2)), LPAD(u.id, 4, '0')) as memberId
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
    }

    // Check if account is deleted (immediately after user is found, BEFORE password check and OTP)
    if (user.status === "deleted") {
      return res.status(403).json({
        success: false,
        message:
          "This account has been deleted. Please contact support if you believe this is an error.",
        code: "ACCOUNT_DELETED",
      });
    }

    // Verify password for dashboard login (only if account is not deleted)
    if (isDashboardLogin) {
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
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

      // Generate secure refresh token and hash it for storage
      const refreshToken = generateRefreshToken();
      const hashedRefreshToken = hashToken(refreshToken);

      // Update user: clear OTP and store hashed refresh token
      await pool.execute(
        "UPDATE users SET otp_code = NULL, otp_expires = NULL, otp_verified = TRUE, last_login = CURRENT_TIMESTAMP, reset_token = ? WHERE id = ?",
        [hashedRefreshToken, user.id]
      );

      // Issue access token (JWT)
      const accessToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "90d" } // 15 minute access token
      );

      // Set refresh token as httpOnly cookie (backup)
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 90 * 24 * 60 * 60 * 1000, // 7 days
        path: "/api/auth",
      });

      console.log("✅ Login successful with OTP for user:", loginIdentifier);
      console.log("🔑 Access token expires in: 15 minutes");
      console.log("🔄 Refresh token stored in DB (hashed)");

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
        subAreasId: user.sub_areas_id,
        customAreaName: user.custom_area_name,
        areaName: user.effective_area_name,
        mobility: user.mobility,
        onRent: user.living_on_rent === 1,
        zakathEligible: user.zakath_eligible === 1,
        differentlyAbled: user.differently_abled === 1,
        MuallafathilQuloob: user.muallafathil_quloob === 1,
        placeOfBirth: user.place_of_birth,
        nicNo: user.nic_no,
        occupation: user.occupation,
        workplaceAddress: user.workplace_address,
        familyStatus: user.family_status,
        widowAssistance: user.widow_assistance === 1,
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

    // Try to get refresh token from multiple sources (priority: body > header > cookie)
    let refreshToken =
      req.body?.refreshToken ||
      req.headers["x-refresh-token"] ||
      req.cookies?.refreshToken;

    if (!refreshToken) {
      console.log("❌ No refresh token found in request");
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
        code: "NO_REFRESH_TOKEN",
      });
    }

    console.log("✅ Refresh token found, verifying against database...");

    // Hash the provided refresh token to compare with stored hash
    const hashedToken = hashToken(refreshToken);

    // Verify refresh token exists in database and user is valid
    const [users] = await pool.execute(
      "SELECT id, username, email, role, status, reset_token FROM users WHERE reset_token = ? AND status IN ('active', 'pending')",
      [hashedToken]
    );

    if (users.length === 0) {
      console.log("❌ Invalid refresh token or user not found");
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token. Please login again.",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    const user = users[0];
    console.log(
      "✅ User verified via refresh token:",
      user.username,
      "Status:",
      user.status
    );

    // Generate new access token (JWT - short lived)
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "120d" } // 15 minutes
    );

    // Generate new refresh token (rotate for security)
    const newRefreshToken = generateRefreshToken();
    const hashedNewRefreshToken = hashToken(newRefreshToken);

    // Update the hashed refresh token in database
    await pool.execute("UPDATE users SET reset_token = ? WHERE id = ?", [
      hashedNewRefreshToken,
      user.id,
    ]);

    // Update refresh token cookie (for web clients)
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/api/auth",
    });

    console.log("🔄 Tokens refreshed successfully for user:", user.username);

    return res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      message: "Token refreshed successfully",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("❌ Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during token refresh",
      code: "SERVER_ERROR",
    });
  }
});

// Logout endpoint: clears refresh token from DB and cookie
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const { user } = req;

    // Clear refresh token from database (invalidate server-side)
    if (user?.userId) {
      await pool.execute("UPDATE users SET reset_token = NULL WHERE id = ?", [
        user.userId,
      ]);
      console.log("✅ Refresh token cleared from DB for user:", user.userId);
    }

    // Clear cookie
    res.clearCookie("refreshToken", { path: "/api/auth" });

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ Logout error:", error);
    // Still clear cookie even if DB update fails
    res.clearCookie("refreshToken", { path: "/api/auth" });
    res.json({ success: true, message: "Logged out" });
  }
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
    // Handle both dashboard and mobile app request formats
    const {
      // Dashboard format
      full_name,
      phone,
      username,
      role = "Member",
      area_id,
      sub_areas_id,
      custom_area_name,
      date_of_birth,
      mobility,
      address,
      email,
      password,
      // Mobile app format
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      customMahallah,
    } = req.body;

    // Map mobile app fields to internal format
    const processedFullName =
      full_name || (firstName && lastName ? `${firstName} ${lastName}` : null);
    const processedPhone = phone || phoneNumber;
    const processedDateOfBirth = date_of_birth || dateOfBirth;
    const processedCustomAreaName = custom_area_name || customMahallah;

    // Require full_name, phone, and username
    if (!processedFullName || !processedPhone || !username) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone number, and username are required",
      });
    }

    // Use default email and password if not provided
    const finalEmail = email || "thalibaan25@gmail.com";
    const finalPassword = password || "123pass";

    // For Founders, area_id is mandatory
    if (role === "Founder" && !area_id) {
      return res.status(400).json({
        success: false,
        message: "Area selection is required for Founders",
      });
    }

    // Handle custom areas: if area_id is 0, custom_area_name is required
    let processedAreaId = area_id;
    let processedSubAreasId = sub_areas_id;
    if (area_id === 0) {
      if (!processedCustomAreaName || processedCustomAreaName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Custom area name is required when selecting custom area",
        });
      }
      // For custom areas, set area_id to 0 and sub_areas_id to null
      processedAreaId = 0;
      processedSubAreasId = null;
    } else if (area_id) {
      // Verify area exists if area_id is provided and not 0
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
      processedAreaId = area_id;
    }

    // Verify sub-area exists if sub_areas_id is provided (only for official areas)
    if (processedSubAreasId && processedAreaId !== 0) {
      const [subAreaExists] = await pool.execute(
        "SELECT id FROM sub_areas WHERE id = ? AND area_id = ?",
        [processedSubAreasId, processedAreaId]
      );

      if (subAreaExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid sub-area selected for this area",
        });
      }
    }

    // Check if user already exists by phone
    const [existingUsers] = await pool.execute(
      "SELECT * FROM users WHERE phone = ?",
      [processedPhone]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A user with this phone number already exists",
      });
    }

    // Check if username already exists
    const [existingUsername] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username already exists. Please provide a unique username.",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(finalPassword, saltRounds);

    console.log("📝 Registration Debug:");
    console.log("  - Username:", username);
    console.log("  - Email:", finalEmail);
    console.log(
      "  - Password received:",
      password ? "YES" : "NO (using default)"
    );
    console.log("  - Final password:", finalPassword);
    console.log("  - Hashed password:", hashedPassword ? "Generated" : "NULL");

    // Insert new user with status set to 'pending'
    const [result] = await pool.execute(
      `INSERT INTO users (
        username, full_name, email, password, role, area_id, sub_areas_id, custom_area_name,
        date_of_birth, mobility, phone, address, 
        status, joined_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [
        username,
        processedFullName,
        finalEmail,
        hashedPassword,
        role,
        processedAreaId,
        processedSubAreasId,
        processedCustomAreaName || null,
        processedDateOfBirth || null,
        mobility || null,
        processedPhone || null,
        address || null,
        "pending",
      ]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully with pending status",
      user: {
        id: result.insertId,
        username: username,
        full_name: processedFullName,
        email: finalEmail,
        phone: processedPhone,
        role,
        status: "pending",
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

// Convert custom area to official area (Super Admin only)
router.post(
  "/convert-custom-area",
  authenticateToken,
  authorizeRole("SuperAdmin"),
  async (req, res) => {
    try {
      const { custom_area_name, official_area_id } = req.body;

      if (!custom_area_name || !official_area_id) {
        return res.status(400).json({
          success: false,
          message: "Custom area name and official area ID are required",
        });
      }

      // Verify the official area exists
      const [areaExists] = await pool.execute(
        "SELECT area_id, area_name FROM areas WHERE area_id = ?",
        [official_area_id]
      );

      if (areaExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid official area selected",
        });
      }

      // Update all users with this custom area name to use the official area
      const [updateResult] = await pool.execute(
        "UPDATE users SET area_id = ?, custom_area_name = NULL WHERE custom_area_name = ? AND area_id IS NULL",
        [official_area_id, custom_area_name]
      );

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "No users found with this custom area name",
        });
      }

      res.json({
        success: true,
        message: `Successfully converted ${updateResult.affectedRows} users from custom area "${custom_area_name}" to official area "${areaExists[0].area_name}"`,
        convertedUsers: updateResult.affectedRows,
        officialArea: {
          id: official_area_id,
          name: areaExists[0].area_name,
        },
      });
    } catch (error) {
      console.error("Convert custom area error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

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

// Admin change password route (no current password required)
router.post(
  "/admin/change-password/:userId",
  authenticateToken,
  authorizeRole(["SuperAdmin", "Founder"]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: "New password is required",
        });
      }

      // Check if target user exists and is not deleted
      const [userRows] = await pool.execute(
        "SELECT id, username, status FROM users WHERE id = ?",
        [userId]
      );

      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (userRows[0].status === "deleted") {
        return res.status(400).json({
          success: false,
          message: "Cannot change password for deleted user",
        });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await pool.execute(
        "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [hashedNewPassword, userId]
      );

      res.json({
        success: true,
        message: `Password changed successfully for user ${userRows[0].username}`,
      });
    } catch (error) {
      console.error("Admin change password error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Admin change password by username route (no current password required)
router.post(
  "/admin/change-password-by-username",
  authenticateToken,
  authorizeRole(["SuperAdmin", "Founder"]),
  async (req, res) => {
    try {
      const { username, newPassword } = req.body;

      if (!username || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Username and new password are required",
        });
      }

      // Check if target user exists and is not deleted
      const [userRows] = await pool.execute(
        "SELECT id, username, status FROM users WHERE username = ?",
        [username]
      );

      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (userRows[0].status === "deleted") {
        return res.status(400).json({
          success: false,
          message: "Cannot change password for deleted user",
        });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await pool.execute(
        "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?",
        [hashedNewPassword, username]
      );

      res.json({
        success: true,
        message: `Password changed successfully for user ${username}`,
      });
    } catch (error) {
      console.error("Admin change password by username error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Forgot password route - MOBILE FRIENDLY (sends OTP to phone)
router.post("/forgot-password", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Check if user exists by phone
    const [users] = await pool.execute(
      "SELECT id, username, phone FROM users WHERE phone = ?",
      [phone]
    );

    if (users.length === 0) {
      // Don't reveal if phone exists for security - always return success
      return res.json({
        success: true,
        message:
          "If this phone number exists in our system, you will receive a verification code.",
        requiresOtp: true,
      });
    }

    const user = users[0];

    // Generate OTP
    const otp = generateOtp();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10);

    // Save OTP to database (reuse login OTP fields)
    await pool.execute(
      "UPDATE users SET otp_code = ?, otp_expires = ?, otp_verified = FALSE WHERE id = ?",
      [otp, otpExpires, user.id]
    );

    // Send SMS OTP
    console.log(`📱 Sending password reset OTP to: ${phone}`);
    const sendResult = await sendOtpSms(phone, otp);

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification code. Please try again.",
      });
    }

    const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");

    const response = {
      success: true,
      message: "Verification code sent to your phone.",
      requiresOtp: true,
      contact: maskedPhone,
      resetMode: true,
    };

    if (process.env.NODE_ENV === "development" || sendResult.testMode) {
      response.testOtp = otp;
      response.testMessage = `For testing: Your OTP is ${otp}`;
    }

    res.json(response);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing password reset request",
    });
  }
});

// Reset password route - MOBILE FRIENDLY (uses OTP)
router.post("/reset-password", async (req, res) => {
  try {
    const { phone, otpCode, newPassword } = req.body;

    console.log(
      "🔄 Password reset attempt for phone:",
      phone?.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")
    );

    if (!phone || !otpCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Phone number, OTP code, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Find user with valid OTP
    const [users] = await pool.execute(
      "SELECT id, username, phone FROM users WHERE phone = ? AND otp_code = ? AND otp_expires > NOW()",
      [phone, otpCode]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP code",
      });
    }

    const user = users[0];

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear OTP
    await pool.execute(
      "UPDATE users SET password = ?, otp_code = NULL, otp_expires = NULL, otp_verified = FALSE WHERE id = ?",
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

// Get user status by user ID
router.get("/user-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get user status from database
    const [users] = await pool.execute(
      "SELECT id, username, status FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("❌ Get user status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
