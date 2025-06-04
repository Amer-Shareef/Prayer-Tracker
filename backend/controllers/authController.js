const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db"); // Ensure this points to your MySQL connection

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", { username });

  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Check if user exists - mysql2 returns [rows, fields]
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    // If no user found or empty array
    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Get the first user
    const user = rows[0];

    console.log("Found user:", {
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.username === "admin" ? "Founder" : "Member",
        mosqueId: user.mosqueId,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1d" }
    );

    // Return user info and token
    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.username === "admin" ? "Founder" : "Member",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
