require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function restoreDatabase() {
  console.log('🔄 Restoring Prayer Tracker Database');
  console.log('====================================');
  
  try {
    // Get backup filename from command line arguments
    const backupFileName = process.argv[2];
    
    if (!backupFileName) {
      console.log('❌ Please specify a backup file to restore');
      console.log('Usage: npm run restore-db <backup-filename>');
      console.log('');
      
      // List available backups
      const backupDir = path.join(__dirname, '..', 'backups');
      try {
        const files = await fs.readdir(backupDir);
        const backupFiles = files.filter(f => f.endsWith('.sql'));
        
        if (backupFiles.length > 0) {
          console.log('📁 Available backup files:');
          backupFiles.forEach(file => {
            console.log(`   - ${file}`);
          });
        } else {
          console.log('📁 No backup files found in backups directory');
        }
      } catch (e) {
        console.log('📁 Backups directory not found');
      }
      
      process.exit(1);
    }

    const backupFile = path.join(__dirname, '..', 'backups', backupFileName);
    
    // Check if backup file exists
    try {
      await fs.access(backupFile);
    } catch (e) {
      console.log(`❌ Backup file not found: ${backupFile}`);
      process.exit(1);
    }

    // Read backup file
    console.log(`📁 Reading backup file: ${backupFileName}`);
    const sqlContent = await fs.readFile(backupFile, 'utf8');
    
    // Connect to database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000,
      multipleStatements: true // Allow multiple SQL statements
    });

    console.log('✅ Connected to database');

    // Warning message
    console.log('');
    console.log('⚠️  WARNING: This will completely replace your current database!');
    console.log('⚠️  All existing data will be lost!');
    console.log('');
    
    // In a real scenario, you might want to add confirmation
    // For automation, we'll proceed directly
    console.log('🔄 Proceeding with database restore...');

    // Execute the SQL dump
    console.log('📥 Executing SQL statements...');
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let executedStatements = 0;
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          executedStatements++;
          
          // Show progress every 10 statements
          if (executedStatements % 10 === 0) {
            console.log(`   ✅ Executed ${executedStatements}/${statements.length} statements`);
          }
        } catch (error) {
          console.log(`⚠️  Warning: Failed to execute statement: ${error.message}`);
          console.log(`   Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log(`✅ Executed ${executedStatements} SQL statements`);

    // Verify restoration
    console.log('🔍 Verifying restoration...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables after restoration`);

    // Show table record counts
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`   📊 ${tableName}: ${count[0].count} records`);
    }

    await connection.end();

    console.log('');
    console.log('🎉 Database restoration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Restart your application: npm start');
    console.log('   2. Test login with restored user accounts');
    console.log('   3. Verify your data is intact');

  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
    process.exit(1);
  }
}

restoreDatabase();
