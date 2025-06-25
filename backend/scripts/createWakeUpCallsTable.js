require("dotenv").config();
const mysql = require("mysql2/promise");

async function createWakeUpCallsTable() {
  console.log("🔧 Creating Wake Up Calls Table");
  console.log("================================");

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "3306"),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000,
    });

    console.log("✅ Connected to database");

    // Create wake_up_calls table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wake_up_calls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        username VARCHAR(50) NOT NULL,
        call_response ENUM('accepted', 'declined', 'no_answer') NOT NULL,
        response_time TIMESTAMP NOT NULL,
        call_date DATE NOT NULL,
        call_time TIME NOT NULL,
        prayer_type ENUM('Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha') DEFAULT 'Fajr',
        member_id VARCHAR(20) NULL,
        phone VARCHAR(20) NULL,
        mosque_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Indexes for performance
        INDEX idx_user_id (user_id),
        INDEX idx_username (username),
        INDEX idx_call_response (call_response),
        INDEX idx_call_date (call_date),
        INDEX idx_prayer_type (prayer_type),
        INDEX idx_mosque_id (mosque_id),
        INDEX idx_response_time (response_time),
        
        -- Foreign key constraints
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    console.log("✅ Created wake_up_calls table successfully");

    // Show table structure
    console.log("\n📋 Wake Up Calls table structure:");
    const [structure] = await connection.execute("DESCRIBE wake_up_calls");
    structure.forEach((col) => {
      console.log(
        `   ${col.Field}: ${col.Type} ${
          col.Null === "YES" ? "(nullable)" : "(not null)"
        } ${col.Key ? `[${col.Key}]` : ""}`
      );
    });

    // Create some sample data
    console.log("\n📋 Creating sample wake-up call data...");

    // Get test users
    const [users] = await connection.execute(`
      SELECT u.id, u.username, u.phone, u.mosque_id,
             CONCAT(UPPER(LEFT(COALESCE(u.area, 'GEN'), 2)), LPAD(u.id, 4, '0')) as member_id
      FROM users u 
      WHERE u.mosque_id IS NOT NULL 
      LIMIT 3
    `);

    if (users.length > 0) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const responses = ["accepted", "declined", "no_answer"];
        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];

        const callTime = "04:30:00";
        const responseTime = new Date();
        responseTime.setHours(4, 30 + i, 0, 0);

        await connection.execute(
          `
          INSERT INTO wake_up_calls 
          (user_id, username, call_response, response_time, call_date, call_time, prayer_type, member_id, phone, mosque_id)
          VALUES (?, ?, ?, ?, ?, ?, 'Fajr', ?, ?, ?)
        `,
          [
            user.id,
            user.username,
            randomResponse,
            responseTime.toISOString().slice(0, 19).replace("T", " "),
            today.toISOString().split("T")[0],
            callTime,
            user.member_id,
            user.phone,
            user.mosque_id,
          ]
        );

        console.log(
          `   ✅ Created sample call for ${user.username}: ${randomResponse}`
        );
      }
    }

    // Show statistics
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN call_response = 'accepted' THEN 1 END) as accepted_calls,
        COUNT(CASE WHEN call_response = 'declined' THEN 1 END) as declined_calls,
        COUNT(CASE WHEN call_response = 'no_answer' THEN 1 END) as no_answer_calls
      FROM wake_up_calls
    `);

    console.log("\n📊 Wake Up Calls Statistics:");
    console.log(`   Total Calls: ${stats[0].total_calls}`);
    console.log(`   Accepted: ${stats[0].accepted_calls}`);
    console.log(`   Declined: ${stats[0].declined_calls}`);
    console.log(`   No Answer: ${stats[0].no_answer_calls}`);

    await connection.end();
    console.log("\n🎉 Wake up calls table creation completed successfully!");
  } catch (error) {
    console.error("❌ Table creation failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

createWakeUpCallsTable();
