const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "../.env" });

async function testUserAuth() {
  try {
    // Create a connection to the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    console.log("Connected to database successfully");

    // Get all users
    const [users] = await connection.execute(
      `SELECT u.id, u.username, u.password_hash, r.name as role 
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id`
    );

    console.log(`Found ${users.length} users in the database\n`);

    // Test each user's password
    const testPassword = "password123";

    for (const user of users) {
      console.log(`Testing user: ${user.username} (${user.role})`);
      console.log(`Password hash: ${user.password_hash.substring(0, 20)}...`);

      // Test password verification using bcrypt
      const isValid = await bcrypt.compare(testPassword, user.password_hash);

      console.log(
        `Password verification for "${testPassword}": ${
          isValid ? "SUCCESS" : "FAILED"
        }`
      );
      console.log("-".repeat(50));
    }

    await connection.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

testUserAuth();
