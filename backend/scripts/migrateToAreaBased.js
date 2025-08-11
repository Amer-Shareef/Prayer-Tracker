const mysql = require("mysql2/promise");
require("dotenv").config();

async function migrateToAreaBased() {
  let connection;
  
  try {
    console.log("🔄 Starting migration from mosque-based to area-based system...");
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "3306"),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000
    });

    console.log("✅ Connected to database");

    // Step 1: Add area_id column to users table if it doesn't exist
    console.log("\n📋 Step 1: Adding area_id column to users table...");
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN area_id INT NULL,
        ADD INDEX idx_area_id (area_id),
        ADD FOREIGN KEY (area_id) REFERENCES areas(area_id) ON DELETE SET NULL
      `);
      console.log("✅ Added area_id column to users table");
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log("ℹ️  area_id column already exists");
      } else {
        throw error;
      }
    }

    // Step 2: Set existing mosque_id to null
    console.log("\n📋 Step 2: Setting existing mosque_id to null...");
    const [updateResult] = await connection.execute(`
      UPDATE users SET mosque_id = NULL WHERE mosque_id IS NOT NULL
    `);
    console.log(`✅ Updated ${updateResult.affectedRows} users (set mosque_id to null)`);

    // Step 3: Remove the text area field and replace with area_id relationship
    console.log("\n📋 Step 3: Checking current area field in users table...");
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'area'
    `, [process.env.DB_NAME]);
    
    if (columns.length > 0) {
      console.log("ℹ️  Found text 'area' column - this will remain for now until area_id is populated");
    }

    // Step 4: Update prayers table to use area_id instead of mosque_id
    console.log("\n📋 Step 4: Updating prayers table...");
    try {
      await connection.execute(`
        ALTER TABLE prayers 
        ADD COLUMN area_id INT NULL,
        ADD INDEX idx_prayers_area_id (area_id),
        ADD FOREIGN KEY (area_id) REFERENCES areas(area_id) ON DELETE SET NULL
      `);
      console.log("✅ Added area_id column to prayers table");
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log("ℹ️  area_id column already exists in prayers table");
      } else {
        throw error;
      }
    }

    // Set existing prayer mosque_id to null (since we can't map them without knowing the relationship)
    const [prayerUpdateResult] = await connection.execute(`
      UPDATE prayers SET mosque_id = NULL WHERE mosque_id IS NOT NULL
    `);
    console.log(`✅ Updated ${prayerUpdateResult.affectedRows} prayer records (set mosque_id to null)`);

    // Step 5: Check other tables that might have mosque_id
    console.log("\n📋 Step 5: Checking other tables for mosque_id references...");
    
    const tablesToCheck = [
      'feeds', 'meetings', 'counselling_sessions', 'wake_up_calls', 
      'pickup_requests', 'daily_activities'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const [tableColumns] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'mosque_id'
        `, [process.env.DB_NAME, tableName]);
        
        if (tableColumns.length > 0) {
          console.log(`📋 Found mosque_id in ${tableName} table`);
          
          // Add area_id column
          try {
            await connection.execute(`
              ALTER TABLE ${tableName} 
              ADD COLUMN area_id INT NULL,
              ADD INDEX idx_${tableName}_area_id (area_id),
              ADD FOREIGN KEY (area_id) REFERENCES areas(area_id) ON DELETE SET NULL
            `);
            console.log(`✅ Added area_id column to ${tableName} table`);
          } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
              console.log(`ℹ️  area_id column already exists in ${tableName} table`);
            } else {
              console.log(`⚠️  Could not add area_id to ${tableName}: ${error.message}`);
            }
          }

          // Set mosque_id to null
          const [result] = await connection.execute(`
            UPDATE ${tableName} SET mosque_id = NULL WHERE mosque_id IS NOT NULL
          `);
          console.log(`✅ Updated ${result.affectedRows} records in ${tableName} (set mosque_id to null)`);
        }
      } catch (error) {
        console.log(`ℹ️  Table ${tableName} might not exist: ${error.message}`);
      }
    }

    // Step 6: Show summary
    console.log("\n📊 Migration Summary:");
    console.log("===================");
    
    const [areaCount] = await connection.execute("SELECT COUNT(*) as count FROM areas");
    console.log(`📍 Total areas available: ${areaCount[0].count}`);
    
    const [userCount] = await connection.execute("SELECT COUNT(*) as count FROM users");
    console.log(`👥 Total users: ${userCount[0].count}`);
    
    const [usersWithArea] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE area_id IS NOT NULL");
    console.log(`✅ Users assigned to areas: ${usersWithArea[0].count}`);
    
    const [usersWithoutArea] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE area_id IS NULL");
    console.log(`⚠️  Users needing area assignment: ${usersWithoutArea[0].count}`);

    console.log("\n✅ Database migration completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("1. Update backend routes to use area_id instead of mosque_id");
    console.log("2. Update frontend to make area selection mandatory");
    console.log("3. Remove mosque-related code and files");
    console.log("4. Manually assign users to areas through the UI");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

if (require.main === module) {
  migrateToAreaBased()
    .then(() => {
      console.log("🎉 Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateToAreaBased };
