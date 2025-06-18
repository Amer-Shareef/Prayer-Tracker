const bcrypt = require("bcrypt");
require("dotenv").config();
const mysql = require('mysql2/promise');

async function seedUsers() {
  try {
    console.log('🌱 Seeding test users to AWS RDS...');
    
    // Connect directly to the target database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000
    });

    console.log("✅ Connected to AWS RDS database");

    // Generate password hash
    const password = "password123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if mosque already exists, if not create it
    console.log('🕌 Checking for existing mosque...');
    const [existingMosques] = await connection.execute(
      'SELECT id FROM mosques WHERE name = ?',
      ['Al-Noor Mosque']
    );

    let mosqueId;
    if (existingMosques.length > 0) {
      mosqueId = existingMosques[0].id;
      console.log(`   ✅ Found existing mosque: Al-Noor Mosque (ID: ${mosqueId})`);
    } else {
      const [mosqueResult] = await connection.execute(
        `INSERT INTO mosques (name, address, phone, email, prayer_times) VALUES (?, ?, ?, ?, ?)`,
        [
          'Al-Noor Mosque',
          '123 Main Street, Colombo, Sri Lanka',
          '+94-11-234-5678',
          'info@alnoor-mosque.lk',
          JSON.stringify({
            'Fajr': '05:30',
            'Dhuhr': '12:30',
            'Asr': '15:45',
            'Maghrib': '18:20',
            'Isha': '19:45'
          })
        ]
      );
      mosqueId = mosqueResult.insertId;
      console.log(`   ✅ Created mosque: Al-Noor Mosque (ID: ${mosqueId})`);
    }

    // Check if test users already exist and delete them for fresh seeding
    console.log('👥 Checking for existing test users...');
    const testUsernames = ['testmember', 'testfounder', 'testadmin'];
    
    for (const username of testUsernames) {
      const [existingUser] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      
      if (existingUser.length > 0) {
        await connection.execute('DELETE FROM users WHERE username = ?', [username]);
        console.log(`   🗑️  Removed existing user: ${username}`);
      }
    }

    // Create test users
    console.log('👥 Creating test users...');
    const users = [
      {
        username: "testmember",
        email: "member@prayertracker.com",
        phone: "+94-77-123-4567",
        role: "Member",
        mosque_id: mosqueId
      },
      {
        username: "testfounder",
        email: "founder@prayertracker.com", 
        phone: "+94-77-234-5678",
        role: "Founder",
        mosque_id: mosqueId
      },
      {
        username: "testadmin",
        email: "admin@prayertracker.com",
        phone: "+94-77-345-6789", 
        role: "SuperAdmin",
        mosque_id: null // SuperAdmin doesn't belong to specific mosque
      }
    ];

    let founderId = null;

    for (const user of users) {
      // Check if email already exists (from other users)
      const [existingEmail] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [user.email]
      );
      
      if (existingEmail.length > 0) {
        await connection.execute('DELETE FROM users WHERE email = ?', [user.email]);
        console.log(`   🗑️  Removed user with email: ${user.email}`);
      }

      const [result] = await connection.execute(
        `INSERT INTO users (username, email, phone, password, role, mosque_id, status, joined_date) 
         VALUES (?, ?, ?, ?, ?, ?, 'active', CURDATE())`,
        [user.username, user.email, user.phone, hashedPassword, user.role, user.mosque_id]
      );
      
      if (user.role === 'Founder') {
        founderId = result.insertId;
      }
      
      console.log(`   ✅ Created ${user.role}: ${user.username} (${user.email})`);
    }

    // Update mosque with founder
    if (founderId) {
      await connection.execute(
        'UPDATE mosques SET founder_id = ? WHERE id = ?',
        [founderId, mosqueId]
      );
      console.log(`   ✅ Assigned founder to mosque`);
    }

    // Clean existing prayer data for testmember and create fresh data
    console.log('🕌 Setting up sample prayer data...');
    const [memberResult] = await connection.execute(
      'SELECT id FROM users WHERE username = "testmember"'
    );
    
    if (memberResult.length > 0) {
      const memberId = memberResult[0].id;
      
      // Remove existing prayer data for this user
      await connection.execute(
        'DELETE FROM prayers WHERE user_id = ?',
        [memberId]
      );
      console.log(`   🗑️  Cleaned existing prayer data for testmember`);

      // Add prayer times for today and next 7 days
      console.log('🕌 Setting up prayer times...');
      await connection.execute('DELETE FROM prayer_times WHERE mosque_id = ?', [mosqueId]);
      
      for (let i = 0; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        await connection.execute(
          `INSERT INTO prayer_times (mosque_id, prayer_date, fajr_time, dhuhr_time, asr_time, maghrib_time, isha_time)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [mosqueId, dateStr, '05:30:00', '12:30:00', '15:45:00', '18:20:00', '19:45:00']
        );
      }
      console.log(`   ✅ Created prayer times for next 8 days`);

      const prayerTypes = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        for (const prayerType of prayerTypes) {
          // Random prayer status (80% prayed, 15% missed, 5% upcoming)
          const rand = Math.random();
          let status, location;
          
          if (rand < 0.8) {
            status = 'prayed';
            location = Math.random() < 0.7 ? 'mosque' : 'home';
          } else if (rand < 0.95) {
            status = 'missed';
            location = 'mosque';
          } else {
            status = 'upcoming';
            location = 'mosque';
          }
          
          await connection.execute(
            `INSERT INTO prayers (user_id, mosque_id, prayer_type, prayer_date, status, location)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [memberId, mosqueId, prayerType, dateStr, status, location]
          );
        }
      }
      console.log(`   ✅ Created sample prayer data for last 7 days`);
    }

    // Clean existing announcements and create fresh welcome announcement
    console.log('📢 Setting up sample announcement...');
    if (founderId) {
      // Remove existing announcements for this mosque
      await connection.execute(
        'DELETE FROM announcements WHERE mosque_id = ?',
        [mosqueId]
      );
      console.log(`   🗑️  Cleaned existing announcements`);

      await connection.execute(
        `INSERT INTO announcements (mosque_id, title, content, author_id, priority)
         VALUES (?, ?, ?, ?, ?)`,
        [
          mosqueId,
          'Welcome to Prayer Tracker',
          'Assalamu Alaikum! Welcome to our mosque prayer tracking system. Please make sure to mark your daily prayers to help us better serve our community.',
          founderId,
          'high'
        ]
      );
      console.log(`   ✅ Created welcome announcement`);
    }

    console.log('');
    console.log('🎉 Database seeded successfully!');
    console.log('');
    console.log('📋 Test Accounts Created:');
    console.log('┌─────────────┬─────────────────────────────┬─────────────┐');
    console.log('│ Username    │ Email                       │ Role        │');
    console.log('├─────────────┼─────────────────────────────┼─────────────┤');
    console.log('│ testmember  │ member@prayertracker.com    │ Member      │');
    console.log('│ testfounder │ founder@prayertracker.com   │ Founder     │');
    console.log('│ testadmin   │ admin@prayertracker.com     │ SuperAdmin  │');
    console.log('└─────────────┴─────────────────────────────┴─────────────┘');
    console.log('');
    console.log('🔑 Password for all accounts: password123');
    console.log('');
    console.log('🕌 Sample mosque: Al-Noor Mosque');
    console.log('📊 Sample data: 7 days of prayer records for testmember');
    console.log('📢 Sample announcement created');
    console.log('');
    console.log('✨ Ready to start the application!');
    console.log('   Run: npm start');

    await connection.end();
    console.log("📊 Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding users:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    process.exit(1);
  }
}

seedUsers();
