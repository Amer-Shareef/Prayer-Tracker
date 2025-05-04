const { validationResult } = require("express-validator");
const User = require("../models/user");
const nodemailer = require("nodemailer");

/**
 * Handle user login
 */
const login = async (req, res) => {
  try {
    console.log("Login attempt:", req.body.username);

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    console.log(`Attempting login for user: ${username}`);

    // Find the user
    const user = await User.findByUsername(username);
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    console.log(
      `User found: ${user.username}, ID: ${user.id}, Role: ${user.role}`
    );
    console.log(
      `Stored password hash: ${user.password_hash.substring(0, 20)}...`
    );

    // Verify password
    console.log(`Verifying password for user: ${username}`);
    const isPasswordValid = await User.verifyPassword(
      password,
      user.password_hash
    );
    console.log(
      `Password verification result: ${isPasswordValid ? "Success" : "Failed"}`
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Set user session
    req.session.userId = user.id;
    console.log(`Session created for user ID: ${user.id}`);

    // Return user info (excluding sensitive data)
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Handle user logout
 */
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out successfully" });
  });
};

/**
 * Get current user information
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Handle forgot password request
 */
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username } = req.body;

    // Find the user
    const user = await User.findByUsername(username);
    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return res
        .status(200)
        .json({
          message:
            "If your account exists, password reset instructions will be sent to your email.",
        });
    }

    // Check if user is a Member (role check)
    if (user.role === "Member") {
      return res.status(403).json({
        message:
          "Please contact your mosque founder or admin to reset your password.",
      });
    }

    // Generate reset token
    const resetToken = await User.createPasswordResetToken(user.id);

    // For development, we'll just log the reset token
    // In production, you would send an email with the token
    console.log(`Password reset token for ${username}: ${resetToken}`);

    // Create reset URL (this would be sent in the email)
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/reset-password?token=${resetToken}`;

    // In a real application, send an email with the reset link
    // For this example, we'll just log it
    console.log(`Reset URL: ${resetUrl}`);

    // For now, simulate sending an email
    sendPasswordResetEmail(username, resetUrl).catch((err) =>
      console.error("Error sending email:", err)
    );

    return res.status(200).json({
      message:
        "If your account exists, password reset instructions will be sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Handle password reset
 */
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Verify the token
    const user = await User.verifyPasswordResetToken(token);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired password reset token" });
    }

    // Update the password
    await User.updatePassword(user.id, password);

    return res
      .status(200)
      .json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Send password reset email (placeholder function)
 * In a real application, configure a proper email service
 */
const sendPasswordResetEmail = async (username, resetUrl) => {
  try {
    // In a real application, you would configure a real SMTP service
    // This is just a placeholder for development
    console.log(`Sending password reset email to ${username}`);
    console.log(`Reset URL: ${resetUrl}`);

    // You would use nodemailer with a real SMTP service in production
    // For example:
    /*
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    await transporter.sendMail({
      from: '"Prayer Tracker" <noreply@prayertracker.com>',
      to: userEmail, // You would need to store emails in your user table
      subject: "Password Reset - Prayer Tracker",
      text: `You requested a password reset. Click the following link to reset your password: ${resetUrl}`,
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
    });
    */

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};
