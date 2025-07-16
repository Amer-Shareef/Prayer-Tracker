require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");

async function backupDatabase() {
  console.log("💾 Creating Prayer Tracker Database Backup");
  console.log("==========================================");

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

    // Create backups directory if it doesn't exist
    const backupDir = path.join(__dirname, "..", "backups");
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    // Generate backup filename with timestamp
    const timestamp =
      new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] +
      "_" +
      new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")[1]
        .split(".")[0];
    const backupFile = path.join(
      backupDir,
      `prayer_tracker_backup_${timestamp}.sql`
    );

    console.log(`📁 Backup file: ${backupFile}`);

    let sqlDump = "";

    // Add header
    sqlDump += `-- Prayer Tracker Database Backup\n`;
    sqlDump += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: ${process.env.DB_NAME}\n`;
    sqlDump += `-- Host: ${process.env.DB_HOST}\n\n`;
    sqlDump += `SET foreign_key_checks = 0;\n\n`;

    // Get all tables
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(`📋 Found ${tables.length} tables to backup`);

    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`📦 Backing up table: ${tableName}`);

      // Get table structure
      const [createTable] = await connection.execute(
        `SHOW CREATE TABLE ${tableName}`
      );
      sqlDump += `-- Table structure for ${tableName}\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlDump += `${createTable[0]["Create Table"]};\n\n`;

      // Get table data
      const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);

      if (rows.length > 0) {
        sqlDump += `-- Data for table ${tableName}\n`;
        sqlDump += `INSERT INTO \`${tableName}\` VALUES\n`;

        const values = rows.map((row) => {
          const escapedValues = Object.values(row).map((value) => {
            if (value === null) return "NULL";
            if (typeof value === "string") {
              return `'${value.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
            }
            if (value instanceof Date) {
              return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`;
            }
            return value;
          });
          return `(${escapedValues.join(", ")})`;
        });

        sqlDump += values.join(",\n") + ";\n\n";
        console.log(`   ✅ Backed up ${rows.length} records`);
      } else {
        console.log(`   ℹ️  Table ${tableName} is empty`);
      }
    }

    sqlDump += `SET foreign_key_checks = 1;\n`;

    // Write backup file
    await fs.writeFile(backupFile, sqlDump, "utf8");

    // Get file size
    const stats = await fs.stat(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log("");
    console.log("🎉 Database backup completed successfully!");
    console.log("");
    console.log("📊 Backup Summary:");
    console.log(`   📁 File: ${path.basename(backupFile)}`);
    console.log(`   📏 Size: ${fileSizeInMB} MB`);
    console.log(`   📋 Tables: ${tables.length}`);
    console.log(`   📅 Created: ${new Date().toLocaleString()}`);
    console.log("");
    console.log("💡 To restore this backup:");
    console.log(`   npm run restore-db ${path.basename(backupFile)}`);

    await connection.end();
  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    process.exit(1);
  }
}

backupDatabase();
