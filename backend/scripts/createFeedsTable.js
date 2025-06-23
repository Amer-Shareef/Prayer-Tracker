require("dotenv").config();
const mysql = require("mysql2/promise");

async function createFeedsTable() {
  console.log("🔧 Creating feeds table...");

  try {
    console.log("📄 Database connection config:");
    console.log(`  - DB_HOST: ${process.env.DB_HOST || "not set"}`);
    console.log(`  - DB_NAME: ${process.env.DB_NAME || "not set"}`);
    console.log(`  - DB_USER: ${process.env.DB_USER || "not set"}`);
    console.log(
      `  - DB_PASSWORD: ${"*".repeat(process.env.DB_PASSWORD?.length || 0)}`
    );

    // Create connection with direct configuration
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000,
    });

    console.log("✅ Database connection established");

    // Check if the table already exists
    const [tables] = await connection.execute(
      `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'feeds'
    `,
      [process.env.DB_NAME]
    );

    if (tables.length > 0) {
      console.log("⚠️ Feeds table already exists");
    } else {
      // Create the feeds table
      await connection.execute(`
        CREATE TABLE feeds (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          image_url VARCHAR(255) NULL,
          priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal',
          author_id INT NOT NULL,
          mosque_id INT NOT NULL,
          views INT DEFAULT 0,
          send_notification BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NULL,
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE,
          INDEX (mosque_id),
          INDEX (author_id),
          INDEX (priority),
          INDEX (is_active),
          INDEX (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      console.log("✅ Feeds table created successfully");
    }

    await connection.end();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error creating feeds table:", error.message);
    console.error("Detailed error:", error);
    process.exit(1);
  }
}

createFeedsTable();
