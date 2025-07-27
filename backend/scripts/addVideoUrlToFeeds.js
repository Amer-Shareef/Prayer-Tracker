require("dotenv").config();
const mysql = require("mysql2/promise");

async function addVideoUrlToFeeds() {
  console.log("🔧 Adding video_url column to feeds table...");

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

    // Check if the video_url column already exists
    const [columns] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'feeds' AND COLUMN_NAME = 'video_url'
    `,
      [process.env.DB_NAME]
    );

    if (columns.length > 0) {
      console.log("⚠️ video_url column already exists in feeds table");
    } else {
      // Add the video_url column
      await connection.execute(`
        ALTER TABLE feeds 
        ADD COLUMN video_url VARCHAR(512) NULL AFTER image_url
      `);

      console.log("✅ video_url column added successfully to feeds table");

      // Add index for better performance if needed
      await connection.execute(`
        ALTER TABLE feeds 
        ADD INDEX idx_video_url (video_url)
      `);

      console.log("✅ Index added for video_url column");
    }

    await connection.end();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error adding video_url column:", error.message);
    console.error("Detailed error:", error);
    process.exit(1);
  }
}

addVideoUrlToFeeds();
