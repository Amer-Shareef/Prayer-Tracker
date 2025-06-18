require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up Prayer Tracker database...');
  
  try {
    // Step 1: Connect WITHOUT database to check if it exists
    console.log('🔄 Step 1: Connecting to MySQL server...');
    const serverConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000
    });

    console.log('✅ Connected to MySQL server!');

    // Step 2: Check if database exists
    console.log('🔄 Step 2: Checking if database exists...');
    const [databases] = await serverConnection.execute('SHOW DATABASES');
    console.log('📊 Available databases:', databases.map(db => db.Database));

    const dbExists = databases.some(db => db.Database === process.env.DB_NAME);
    
    if (!dbExists) {
      console.log(`🔄 Step 3: Creating database ${process.env.DB_NAME}...`);
      await serverConnection.execute(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`✅ Database ${process.env.DB_NAME} created successfully!`);
    } else {
      console.log(`✅ Database ${process.env.DB_NAME} already exists`);
    }

    await serverConnection.end();

    // Step 3: Connect WITH database for table operations
    console.log('🔄 Step 4: Connecting to target database...');
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,  // Connect directly to target database
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000
    });

    console.log(`✅ Connected to database: ${process.env.DB_NAME}`);

    // Step 4: Read and execute createTables.sql
    console.log('🔄 Step 5: Creating tables...');
    const sqlFilePath = path.join(__dirname, 'createTables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL statements and execute one by one
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length > 0) {
        try {
          await dbConnection.execute(statement);
          console.log(`   ✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`   ⚠️  Statement ${i + 1}: Already exists (skipped)`);
          } else {
            console.log(`   ⚠️  Statement ${i + 1} warning: ${error.message}`);
          }
        }
      }
    }

    // Step 5: Verify tables were created
    console.log('🔄 Step 6: Verifying tables...');
    const [tables] = await dbConnection.execute("SHOW TABLES");
    console.log('✅ Tables in database:');
    tables.forEach(table => {
      console.log(`   📋 ${Object.values(table)[0]}`);
    });

    await dbConnection.end();
    console.log('');
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run seed-users');
    console.log('2. Run: npm start');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('');
      console.log('🔧 Check credentials in AWS RDS Console');
    } else if (error.code === 'ER_UNSUPPORTED_PS') {
      console.log('');
      console.log('🔧 Prepared statement issue - trying alternative approach...');
    }
    
    process.exit(1);
  }
}

setupDatabase();
