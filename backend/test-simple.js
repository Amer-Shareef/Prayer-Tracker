const mysql = require('mysql2/promise');

async function simpleTest() {
  try {
    const connection = await mysql.createConnection({
      host: 'database-1.c74ma2eaeuks.eu-north-1.rds.amazonaws.com',
      user: 'admin',
      password: 'FaJR#ppD#t3U53r',
      database: 'db_fajr_app',
      port: 3306
    });

    console.log('✅ SUCCESS - Connected!');
    
    const [users] = await connection.execute('SELECT * FROM users');
    console.log('Users:', users);
    
    await connection.end();
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Trying without database...');
    
    try {
      const connection2 = await mysql.createConnection({
        host: 'database-1.c74ma2eaeuks.eu-north-1.rds.amazonaws.com',
        user: 'admin',
        password: 'FaJR#ppD#t3U53r',
        port: 3306
      });
      
      console.log('✅ Connected without database!');
      const [databases] = await connection2.execute('SHOW DATABASES');
      console.log('Databases:', databases);
      await connection2.end();
      
    } catch (error2) {
      console.log('❌ Still failed - RDS issue');
    }
  }
}

simpleTest();
