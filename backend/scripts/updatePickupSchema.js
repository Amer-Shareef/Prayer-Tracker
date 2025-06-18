require('dotenv').config();
const mysql = require('mysql2/promise');

async function updatePickupSchema() {
  console.log('🔧 Updating Pickup Requests Schema for Fajr Only');
  console.log('===============================================');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000
    });

    console.log('✅ Connected to database');

    // 1. Update prayer_type column to only allow Fajr
    console.log('🔄 Updating prayer_type enum to only allow Fajr...');
    await connection.execute(`
      ALTER TABLE pickup_requests 
      MODIFY COLUMN prayer_type ENUM('Fajr') NOT NULL DEFAULT 'Fajr'
    `);
    console.log('✅ Prayer type restricted to Fajr only');

    // 2. Add driver assignment fields
    console.log('🔄 Adding driver assignment and approval fields...');
    
    // Check if columns exist before adding
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pickup_requests'
    `, [process.env.DB_NAME]);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (!existingColumns.includes('assigned_driver_name')) {
      await connection.execute(`
        ALTER TABLE pickup_requests 
        ADD COLUMN assigned_driver_name VARCHAR(100) DEFAULT NULL
      `);
      console.log('✅ Added assigned_driver_name column');
    }
    
    if (!existingColumns.includes('assigned_driver_phone')) {
      await connection.execute(`
        ALTER TABLE pickup_requests 
        ADD COLUMN assigned_driver_phone VARCHAR(20) DEFAULT NULL
      `);
      console.log('✅ Added assigned_driver_phone column');
    }

    // 3. Update existing non-Fajr requests to Fajr or remove them
    console.log('🔄 Updating existing non-Fajr requests...');
    const [nonFajrRequests] = await connection.execute(`
      SELECT id, prayer_type FROM pickup_requests WHERE prayer_type != 'Fajr'
    `);
    
    if (nonFajrRequests.length > 0) {
      console.log(`📋 Found ${nonFajrRequests.length} non-Fajr requests`);
      console.log('🗑️  Removing non-Fajr requests as system now only supports Fajr...');
      
      await connection.execute(`
        DELETE FROM pickup_requests WHERE prayer_type != 'Fajr'
      `);
      
      console.log(`✅ Removed ${nonFajrRequests.length} non-Fajr requests`);
    } else {
      console.log('✅ No non-Fajr requests found');
    }

    // 4. Remove notes column as per your requirement
    if (existingColumns.includes('notes')) {
      console.log('🗑️  Removing notes column...');
      await connection.execute(`
        ALTER TABLE pickup_requests DROP COLUMN notes
      `);
      console.log('✅ Notes column removed');
    }

    // 5. Show final table structure
    console.log('\n📋 Updated pickup_requests table structure:');
    const [finalStructure] = await connection.execute('DESCRIBE pickup_requests');
    finalStructure.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    // 6. Show remaining requests
    const [remainingRequests] = await connection.execute(`
      SELECT COUNT(*) as count FROM pickup_requests
    `);
    console.log(`\n📊 Remaining pickup requests: ${remainingRequests[0].count}`);

    await connection.end();
    console.log('\n🎉 Pickup requests schema update completed!');
    console.log('\n📋 Changes made:');
    console.log('  ✅ Restricted to Fajr prayer only');
    console.log('  ✅ Added driver assignment fields');
    console.log('  ✅ Removed non-Fajr requests');
    console.log('  ✅ Removed notes column');
    console.log('  ✅ Simplified for Fajr-only system');

  } catch (error) {
    console.error('❌ Schema update failed:', error.message);
    process.exit(1);
  }
}

updatePickupSchema();
