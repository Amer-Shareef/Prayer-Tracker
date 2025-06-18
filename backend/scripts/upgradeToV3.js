require('dotenv').config();
const mysql = require('mysql2/promise');

async function upgradeToV3() {
  console.log('🔄 Upgrading Prayer Tracker database to v3...');
  console.log('Adding Daily Zikr and Quran tracking features');
  
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

    // Check if daily_activities table exists first
    const [tableExists] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'daily_activities'
    `, [process.env.DB_NAME]);

    if (tableExists[0].count > 0) {
      console.log('✅ daily_activities table already exists - skipping creation');
    } else {
      console.log('📋 Creating daily_activities table...');
      
      await connection.execute(`
        CREATE TABLE daily_activities (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          activity_date DATE NOT NULL,
          activity_type ENUM('zikr', 'quran') NOT NULL,
          count_value INT DEFAULT 0,
          minutes_value INT DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_date_type (user_id, activity_date, activity_type),
          INDEX idx_user_date (user_id, activity_date),
          INDEX idx_activity_type (activity_type),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Created daily_activities table');
    }

    // Check if sample data already exists
    const [dataExists] = await connection.execute(
      'SELECT COUNT(*) as count FROM daily_activities LIMIT 1'
    );

    if (dataExists[0].count > 0) {
      console.log('✅ Sample activity data already exists - skipping creation');
    } else {
      console.log('📝 Adding sample activity data...');
      
      const [users] = await connection.execute('SELECT id FROM users LIMIT 3');
      
      for (const user of users) {
        // Add activities for last 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          // Add Zikr activity
          await connection.execute(
            `INSERT IGNORE INTO daily_activities (user_id, activity_date, activity_type, count_value, notes)
             VALUES (?, ?, 'zikr', ?, ?)`,
            [user.id, dateStr, Math.floor(Math.random() * 100) + 33, 'Daily Dhikr count']
          );
          
          // Add Quran activity
          await connection.execute(
            `INSERT IGNORE INTO daily_activities (user_id, activity_date, activity_type, minutes_value, notes)
             VALUES (?, ?, 'quran', ?, ?)`,
            [user.id, dateStr, Math.floor(Math.random() * 60) + 15, 'Daily Quran recitation']
          );
        }
      }
      console.log('✅ Added sample activity data');
    }

    console.log('🎉 Database upgrade to v3 completed successfully!');
    console.log('');
    console.log('📊 Features Ready:');
    console.log('  ✅ Daily Zikr count tracking');
    console.log('  ✅ Daily Quran recitation minutes');
    console.log('  ✅ Enhanced dashboard with activities');
    console.log('  ✅ Activity statistics and trends');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Database upgrade failed:', error.message);
    process.exit(1);
  }
}

upgradeToV3();
