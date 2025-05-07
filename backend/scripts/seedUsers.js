// A script to seed test users with proper bcrypt hashed passwords
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function seedUsers() {
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log("Connected to MySQL database");

    // Generate password hash - we'll use the same password for all test users
    const password = "password123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Delete existing test users if they exist (for clean re-runs)
    await connection.execute("DELETE FROM users WHERE username IN (?, ?, ?)", [
      "testmember",
      "testfounder",
      "testadmin",
    ]);

    // Create test users with proper hashed passwords
    const users = [
      ["testmember", hashedPassword, "Member"],
      ["testfounder", hashedPassword, "Founder"],
      ["testadmin", hashedPassword, "SuperAdmin"],
    ];

    for (const [username, password, role] of users) {
      await connection.execute(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [username, password, role]
      );
      console.log(`Created ${role} user: ${username}`);
    }

    console.log("All test users created successfully!");
    console.log(`Password for all users: ${password}`);

    await connection.end();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding users:", error);
  }
}

seedUsers();
