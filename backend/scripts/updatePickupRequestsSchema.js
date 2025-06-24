require("dotenv").config();
const mysql = require("mysql2/promise");

async function updatePickupRequestsSchema() {
  console.log("🔧 Updating Pickup Requests Schema for Mobile-First Workflow");
  console.log("============================================================");

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

    // 1. Check if pickup_requests table exists
    const [tableExists] = await connection.execute(
      `
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'pickup_requests'
    `,
      [process.env.DB_NAME]
    );

    if (tableExists[0].count === 0) {
      console.log("📋 Creating pickup_requests table from scratch...");

      await connection.execute(`
        CREATE TABLE pickup_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          mosque_id INT NOT NULL,
          prayer_type ENUM('Fajr') NOT NULL DEFAULT 'Fajr',
          pickup_location TEXT NOT NULL,
          contact_number VARCHAR(20) NULL,
          special_instructions TEXT NULL,
          
          -- New fields for days and prayers arrays
          days JSON NULL COMMENT 'Array of selected days: [monday, tuesday, etc]',
          prayers JSON NULL COMMENT 'Array of selected prayers: [fajr, dhuhr, etc]',
          
          status ENUM('pending', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected') DEFAULT 'pending',
          
          -- Assignment fields
          assigned_driver_name VARCHAR(100) NULL,
          assigned_driver_phone VARCHAR(20) NULL,
          assigned_driver_id INT NULL,
          
          -- Approval workflow
          approved_by INT NULL,
          approved_at TIMESTAMP NULL,
          rejected_reason TEXT NULL,
          
          -- Mobile app fields
          device_info JSON NULL,
          app_version VARCHAR(20) NULL,
          location_coordinates JSON NULL,
          
          -- Timestamps
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          scheduled_pickup_time TIME NULL,
          actual_pickup_time TIMESTAMP NULL,
          
          -- Indexes for performance
          INDEX idx_user_id (user_id),
          INDEX idx_mosque_id (mosque_id),
          INDEX idx_status (status),
          INDEX idx_assigned_driver_id (assigned_driver_id),
          INDEX idx_created_at (created_at),
          
          -- Foreign key constraints
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_driver_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      console.log("✅ Created pickup_requests table successfully");
    } else {
      console.log("📋 Updating existing pickup_requests table...");

      // Get current columns
      const [columns] = await connection.execute(
        `
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pickup_requests'
      `,
        [process.env.DB_NAME]
      );

      const existingColumns = columns.map((col) => col.COLUMN_NAME);
      console.log("📋 Existing columns:", existingColumns);

      // Add new columns if they don't exist
      const newColumns = [
        {
          name: "contact_number",
          definition: 'VARCHAR(20) NULL COMMENT "Contact phone number"',
        },
        {
          name: "special_instructions",
          definition:
            'TEXT NULL COMMENT "Special pickup instructions from user"',
        },
        {
          name: "days",
          definition:
            'JSON NULL COMMENT "Array of selected days: [monday, tuesday, etc]"',
        },
        {
          name: "prayers",
          definition:
            'JSON NULL COMMENT "Array of selected prayers: [fajr, dhuhr, etc]"',
        },
        {
          name: "device_info",
          definition: 'JSON NULL COMMENT "Mobile device information"',
        },
        {
          name: "app_version",
          definition: 'VARCHAR(20) NULL COMMENT "Mobile app version"',
        },
        {
          name: "location_coordinates",
          definition: 'JSON NULL COMMENT "GPS coordinates for pickup location"',
        },
        {
          name: "scheduled_pickup_time",
          definition: 'TIME NULL COMMENT "Scheduled time for pickup"',
        },
        {
          name: "actual_pickup_time",
          definition: 'TIMESTAMP NULL COMMENT "Actual pickup completion time"',
        },
        {
          name: "rejected_reason",
          definition: 'TEXT NULL COMMENT "Reason for rejection"',
        },
      ];

      for (const column of newColumns) {
        if (!existingColumns.includes(column.name)) {
          await connection.execute(`
            ALTER TABLE pickup_requests 
            ADD COLUMN ${column.name} ${column.definition}
          `);
          console.log(`✅ Added column: ${column.name}`);
        }
      }

      // Update status enum to include more statuses
      console.log("🔄 Updating status enum...");
      try {
        await connection.execute(`
          ALTER TABLE pickup_requests 
          MODIFY COLUMN status ENUM('pending', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected') DEFAULT 'pending'
        `);
        console.log("✅ Updated status enum");
      } catch (error) {
        if (!error.message.includes("already exists")) {
          console.log("⚠️  Status enum update skipped:", error.message);
        }
      }
    }

    // 2. Create pickup_request_history table for tracking changes
    console.log("📋 Creating pickup_request_history table...");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pickup_request_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pickup_request_id INT NOT NULL,
        changed_by INT NOT NULL,
        change_type ENUM('created', 'status_changed', 'assigned', 'updated', 'cancelled') NOT NULL,
        old_value JSON NULL,
        new_value JSON NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_pickup_request_id (pickup_request_id),
        INDEX idx_changed_by (changed_by),
        INDEX idx_change_type (change_type),
        INDEX idx_created_at (created_at),
        
        FOREIGN KEY (pickup_request_id) REFERENCES pickup_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    console.log("✅ Created pickup_request_history table");

    // 3. Create sample data for testing
    console.log("📋 Creating sample pickup request...");

    // Check if we have test users
    const [testUsers] = await connection.execute(`
      SELECT id, username, mosque_id FROM users 
      WHERE username IN ('abdullah', 'testmember') AND mosque_id IS NOT NULL
      ORDER BY id ASC LIMIT 2
    `);

    if (testUsers.length > 0) {
      const testUser = testUsers[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // Check if sample request already exists
      const [existingRequest] = await connection.execute(
        `
        SELECT id FROM pickup_requests 
        WHERE user_id = ? AND request_date = ? AND pickup_location LIKE '%Sample%'
      `,
        [testUser.id, tomorrowStr]
      );

      if (existingRequest.length === 0) {
        await connection.execute(
          `
          INSERT INTO pickup_requests 
          (user_id, mosque_id, prayer_type, pickup_location, special_instructions, 
           contact_number, days, prayers, device_info, app_version, location_coordinates, status)
          VALUES (?, ?, 'Fajr', ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `,
          [
            testUser.id,
            testUser.mosque_id,
            "123 Main St, City - Sample Location",
            "Ring doorbell twice",
            "+1234567890",
            JSON.stringify(["monday", "tuesday", "wednesday"]),
            JSON.stringify(["fajr"]),
            JSON.stringify({
              platform: "Android",
              model: "Samsung Galaxy",
              os_version: "13.0",
            }),
            "1.0.0",
            JSON.stringify({
              latitude: 6.9271,
              longitude: 79.8612,
              accuracy: 10,
            }),
          ]
        );

        console.log(
          `✅ Created sample pickup request for user: ${testUser.username}`
        );
      }
    }

    // 4. Show final table structure
    console.log("\n📋 Final pickup_requests table structure:");
    const [finalStructure] = await connection.execute(
      "DESCRIBE pickup_requests"
    );
    finalStructure.forEach((col) => {
      console.log(
        `   ${col.Field}: ${col.Type} ${
          col.Null === "YES" ? "(nullable)" : "(not null)"
        } ${col.Key ? `[${col.Key}]` : ""}`
      );
    });

    // 5. Show statistics
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests
      FROM pickup_requests
    `);

    console.log("\n📊 Pickup Requests Statistics:");
    console.log(`   Total Requests: ${stats[0].total_requests}`);
    console.log(`   Pending: ${stats[0].pending_requests}`);
    console.log(`   Approved: ${stats[0].approved_requests}`);
    console.log(`   Completed: ${stats[0].completed_requests}`);

    await connection.end();
    console.log("\n🎉 Pickup requests schema update completed successfully!");

    console.log("\n📋 Schema Features:");
    console.log("  ✅ Mobile-first design with device info tracking");
    console.log("  ✅ Enhanced location details with GPS coordinates");
    console.log("  ✅ Comprehensive status workflow");
    console.log("  ✅ Driver assignment system");
    console.log("  ✅ History tracking for all changes");
    console.log("  ✅ Optimized indexes for performance");
    console.log("  ✅ Fajr prayer focused (expandable)");
  } catch (error) {
    console.error("❌ Schema update failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

updatePickupRequestsSchema();
