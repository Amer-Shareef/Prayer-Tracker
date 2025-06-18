const mysql = require('mysql2/promise');

async function fixAdminUser() {
  console.log('🔧 Fixing admin user issue...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'database-1.c74ma2eaeuks.eu-north-1.rds.amazonaws.com',
      user: 'admin',
      password: 'FaJR#ppD#t3U53r',
      database: 'db_fajr_app',
      port: 3306
    });

    console.log('✅ Connected to database');

    // Check current users
    console.log('\n📋 Current users in database:');
    const [users] = await connection.execute('SELECT id, username, role FROM users');
    console.table(users);

    // Check if testadmin exists
    const [adminUsers] = await connection.execute('SELECT * FROM users WHERE username = ?', ['testadmin']);
    
    if (adminUsers.length === 0) {
      console.log('\n❌ testadmin user does not exist! Creating...');
      
      // Create testadmin user
      await connection.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['testadmin', 'password123', 'Admin']
      );
      
      console.log('✅ testadmin user created successfully!');
    } else {
      console.log('\n✅ testadmin user exists');
      console.log('Current testadmin data:', adminUsers[0]);
      
      // Check if role is correct
      if (adminUsers[0].role !== 'Admin') {
        console.log(`🔧 Fixing role from '${adminUsers[0].role}' to 'Admin'`);
        
        await connection.execute(
          'UPDATE users SET role = ? WHERE username = ?',
          ['Admin', 'testadmin']
        );
        
        console.log('✅ Role updated successfully!');
      }
    }

    // Show final users table
    console.log('\n📋 Final users in database:');
    const [finalUsers] = await connection.execute('SELECT id, username, role FROM users');
    console.table(finalUsers);

    await connection.end();
    
    console.log('\n🎉 Admin user fix completed!');
    console.log('Now try logging in with: testadmin / password123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAdminUser();
