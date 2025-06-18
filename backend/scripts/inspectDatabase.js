require('dotenv').config();
const mysql = require('mysql2/promise');

async function inspectDatabase() {
  console.log('🔍 Inspecting Prayer Tracker Database');
  console.log('=====================================');
  
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

    console.log('✅ Connected to database:', process.env.DB_NAME);
    console.log('');

    // 1. Show all tables
    console.log('📋 TABLES IN DATABASE:');
    console.log('----------------------');
    const [tables] = await connection.execute('SHOW TABLES');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${Object.values(table)[0]}`);
    });
    console.log('');

    // 2. Show table structures
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`🗂️  TABLE: ${tableName.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      // Show columns
      const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
      console.log('Columns:');
      columns.forEach(col => {
        const nullable = col.Null === 'YES' ? '(nullable)' : '(required)';
        const key = col.Key ? `[${col.Key}]` : '';
        const defaultVal = col.Default !== null ? `default: ${col.Default}` : '';
        console.log(`  • ${col.Field}: ${col.Type} ${nullable} ${key} ${defaultVal}`);
      });

      // Show record count
      const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
      console.log(`Records: ${count[0].total}`);
      
      // Show sample data (first 3 records)
      if (count[0].total > 0) {
        const [sampleData] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
        console.log('Sample data:');
        sampleData.forEach((row, index) => {
          console.log(`  Row ${index + 1}:`, JSON.stringify(row, null, 2));
        });
      }
      console.log('');
    }

    // 3. Show foreign key relationships
    console.log('🔗 FOREIGN KEY RELATIONSHIPS:');
    console.log('-----------------------------');
    const [foreignKeys] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE 
        REFERENCED_TABLE_SCHEMA = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME]);

    if (foreignKeys.length > 0) {
      foreignKeys.forEach(fk => {
        console.log(`  ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('  No foreign key relationships found');
    }
    console.log('');

    // 4. Show indexes
    console.log('📇 INDEXES:');
    console.log('----------');
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      const [indexes] = await connection.execute(`SHOW INDEXES FROM ${tableName}`);
      
      if (indexes.length > 0) {
        console.log(`${tableName}:`);
        const indexGroups = {};
        indexes.forEach(idx => {
          if (!indexGroups[idx.Key_name]) {
            indexGroups[idx.Key_name] = [];
          }
          indexGroups[idx.Key_name].push(idx.Column_name);
        });
        
        Object.entries(indexGroups).forEach(([indexName, columns]) => {
          const unique = indexes.find(i => i.Key_name === indexName)?.Non_unique === 0 ? '[UNIQUE]' : '';
          console.log(`  • ${indexName}: ${columns.join(', ')} ${unique}`);
        });
      }
    }

    await connection.end();
    console.log('');
    console.log('🎉 Database inspection completed!');

  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
    process.exit(1);
  }
}

inspectDatabase();
