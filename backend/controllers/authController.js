const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../config/db"); // Ensure this points to your MySQL connection

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists - mysql2 returns [rows, fields]
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    // If no user found or empty array
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the first user
    const user = rows[0];

    // Debug
    console.log("Found user:", {
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
