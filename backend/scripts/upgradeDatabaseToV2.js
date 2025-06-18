require('dotenv').config();
const mysql = require('mysql2/promise');

async function upgradeDatabaseToV2() {
  console.log('🔄 Upgrading Prayer Tracker database to v2...');
  
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

    // Check if prayer_times table exists
    const [tables] = await connection.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = 'prayer_times'",
      [process.env.DB_NAME]
    );

    if (tables.length === 0) {
      console.log('📅 Creating prayer_times table...');
      
      await connection.execute(`
        CREATE TABLE prayer_times (
          id INT AUTO_INCREMENT PRIMARY KEY,
          mosque_id INT NOT NULL,
          prayer_date DATE NOT NULL,
          fajr_time TIME,
          dhuhr_time TIME,
          asr_time TIME,
          maghrib_time TIME,
          isha_time TIME,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_mosque_date (mosque_id, prayer_date),
          INDEX idx_mosque_date (mosque_id, prayer_date),
          FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE
        )
      `);
      
      console.log('✅ prayer_times table created');

      // Insert default prayer times for existing mosques
      const [mosques] = await connection.execute('SELECT id FROM mosques');
      
      if (mosques.length > 0) {
        console.log('📅 Adding default prayer times for existing mosques...');
        
        for (const mosque of mosques) {
          // Add prayer times for today and next 7 days
          for (let i = 0; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            await connection.execute(
              `INSERT IGNORE INTO prayer_times (mosque_id, prayer_date, fajr_time, dhuhr_time, asr_time, maghrib_time, isha_time)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [mosque.id, dateStr, '05:30:00', '12:30:00', '15:45:00', '18:20:00', '19:45:00']
            );
          }
        }
        
        console.log(`✅ Added prayer times for ${mosques.length} mosque(s)`);
      }
    } else {
      console.log('✅ prayer_times table already exists');
    }

    console.log('🎉 Database upgrade to v2 completed successfully!');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Database upgrade failed:', error.message);
    process.exit(1);
  }
}

upgradeDatabaseToV2();
