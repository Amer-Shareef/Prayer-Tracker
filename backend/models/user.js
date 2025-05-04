const { pool } = require("../db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

class User {
  /**
   * Find a user by username
   * @param {string} username - The username to search for
   * @returns {Promise<Object|null>} The user object if found, null otherwise
   */
  static async findByUsername(username) {
    try {
      const [rows] = await pool.execute(
        `SELECT u.id, u.username, u.password_hash, r.name as role, u.mosque_id 
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.username = ?`,
        [username]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Error finding user by username:", error);
      throw error;
    }
  }

  /**
   * Find a user by ID
   * @param {number} id - The user ID to search for
   * @returns {Promise<Object|null>} The user object if found, null otherwise
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT u.id, u.username, r.name as role, u.mosque_id
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [id]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data including username, password, role_id, mosque_id
   * @returns {Promise<Object>} The created user object
   */
  static async create({ username, password, roleId, mosqueId }) {
    try {
      // Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert the user
      const [result] = await pool.execute(
        `INSERT INTO users (username, password_hash, role_id, mosque_id)
         VALUES (?, ?, ?, ?)`,
        [username, passwordHash, roleId, mosqueId]
      );

      return { id: result.insertId, username, roleId, mosqueId };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Verify a user's password
   * @param {string} plainPassword - The plain text password
   * @param {string} hashedPassword - The hashed password from the database
   * @returns {Promise<boolean>} True if password matches, false otherwise
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error("Error verifying password:", error);
      throw error;
    }
  }

  /**
   * Generate a password reset token for a user
   * @param {number} userId - The user ID
   * @returns {Promise<string>} The reset token
   */
  static async createPasswordResetToken(userId) {
    try {
      // Generate a random token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store the token hash in the database
      const tokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Check if reset_token_hash column exists, if not create it
      await pool.execute(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_token_expiry DATETIME
      `);

      // Update the user with the reset token
      await pool.execute(
        `UPDATE users 
         SET reset_token_hash = ?, reset_token_expiry = ?
         WHERE id = ?`,
        [tokenHash, resetTokenExpiry, userId]
      );

      return resetToken;
    } catch (error) {
      console.error("Error creating password reset token:", error);
      throw error;
    }
  }

  /**
   * Verify a password reset token
   * @param {string} resetToken - The token to verify
   * @returns {Promise<Object|null>} The user object if token is valid, null otherwise
   */
  static async verifyPasswordResetToken(resetToken) {
    try {
      // Hash the token for db comparison
      const tokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Find the user with this token that hasn't expired
      const [rows] = await pool.execute(
        `SELECT u.id, u.username, r.name as role
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.reset_token_hash = ? AND u.reset_token_expiry > NOW()`,
        [tokenHash]
      );

      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Error verifying reset token:", error);
      throw error;
    }
  }

  /**
   * Update user's password
   * @param {number} userId - The user ID
   * @param {string} newPassword - The new password
   * @returns {Promise<boolean>} True if password was updated
   */
  static async updatePassword(userId, newPassword) {
    try {
      // Hash the new password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update the user's password and clear the reset token
      await pool.execute(
        `UPDATE users 
         SET password_hash = ?, reset_token_hash = NULL, reset_token_expiry = NULL
         WHERE id = ?`,
        [passwordHash, userId]
      );

      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  }
}

module.exports = User;
