require("dotenv").config();
const { pool } = require("../config/database");

async function addPickupApprovalColumns() {
  console.log("🔧 Adding Pickup Request Approval Columns");
  console.log("==========================================");

  try {
    const connection = await pool.getConnection();

    // Check existing columns
    const [columns] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pickup_requests'
    `,
      [process.env.DB_NAME]
    );

    const existingColumns = columns.map((col) => col.COLUMN_NAME);
    console.log("📋 Existing columns:", existingColumns);

    // Add missing columns
    const columnsToAdd = [
      {
        name: "assigned_driver_id",
        definition: "INT NULL",
        description: "ID of the assigned driver/member",
      },
      {
        name: "assigned_driver_name",
        definition: "VARCHAR(255) NULL",
        description: 'Display name of assigned driver (e.g., "Danish (Car)")',
      },
      {
        name: "approved_at",
        definition: "TIMESTAMP NULL",
        description: "When the request was approved",
      },
      {
        name: "approved_by",
        definition: "INT NULL",
        description: "ID of the user who approved the request",
      },
      {
        name: "rejected_at",
        definition: "TIMESTAMP NULL",
        description: "When the request was rejected",
      },
      {
        name: "rejected_by",
        definition: "INT NULL",
        description: "ID of the user who rejected the request",
      },
      {
        name: "rejection_reason",
        definition: "TEXT NULL",
        description: "Reason for rejection",
      },
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding column: ${column.name}`);
        await connection.execute(`
          ALTER TABLE pickup_requests 
          ADD COLUMN ${column.name} ${column.definition}
        `);
        console.log(`✅ Added: ${column.name} - ${column.description}`);
      } else {
        console.log(`✅ Column already exists: ${column.name}`);
      }
    }

    // Add foreign key constraints if they don't exist
    try {
      await connection.execute(`
        ALTER TABLE pickup_requests 
        ADD CONSTRAINT fk_pickup_assigned_driver 
        FOREIGN KEY (assigned_driver_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log("✅ Added foreign key constraint for assigned_driver_id");
    } catch (error) {
      if (error.message.includes("Duplicate key name")) {
        console.log("✅ Foreign key constraint already exists");
      } else {
        console.log("⚠️  Could not add foreign key constraint:", error.message);
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE pickup_requests 
        ADD CONSTRAINT fk_pickup_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log("✅ Added foreign key constraint for approved_by");
    } catch (error) {
      if (error.message.includes("Duplicate key name")) {
        console.log("✅ Foreign key constraint already exists");
      } else {
        console.log("⚠️  Could not add foreign key constraint:", error.message);
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE pickup_requests 
        ADD CONSTRAINT fk_pickup_rejected_by 
        FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log("✅ Added foreign key constraint for rejected_by");
    } catch (error) {
      if (error.message.includes("Duplicate key name")) {
        console.log("✅ Foreign key constraint already exists");
      } else {
        console.log("⚠️  Could not add foreign key constraint:", error.message);
      }
    }

    connection.release();
    console.log("\n🎉 Pickup approval columns setup completed!");
    console.log("\n📋 Now you can:");
    console.log("  1. Restart your backend server");
    console.log("  2. Try the approval process again");
    console.log("  3. Check that assigned drivers are stored in the database");
  } catch (error) {
    console.error("❌ Failed to add columns:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addPickupApprovalColumns();
