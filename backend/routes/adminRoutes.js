const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get database information (SuperAdmin only)
router.get('/database-info', authenticateToken, authorizeRole(['SuperAdmin']), async (req, res) => {
  try {
    const dbInfo = {};

    // Get all tables
    const [tables] = await pool.execute('SHOW TABLES');
    dbInfo.tables = [];

    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      
      // Get table structure
      const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
      
      // Get record count
      const [count] = await pool.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
      
      dbInfo.tables.push({
        name: tableName,
        columns: columns,
        recordCount: count[0].total
      });
    }

    // Get foreign key relationships
    const [foreignKeys] = await pool.execute(`
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

    dbInfo.foreignKeys = foreignKeys;

    res.json({
      success: true,
      data: dbInfo
    });

  } catch (error) {
    console.error('Error fetching database info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database information',
      error: error.message
    });
  }
});

// Get table data with pagination
router.get('/table/:tableName', authenticateToken, authorizeRole(['SuperAdmin']), async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Validate table name to prevent SQL injection
    const [tables] = await pool.execute('SHOW TABLES');
    const validTables = tables.map(t => Object.values(t)[0]);
    
    if (!validTables.includes(tableName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table name'
      });
    }

    // Get total count
    const [countResult] = await pool.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
    const total = countResult[0].total;

    // Get paginated data
    const [data] = await pool.execute(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`, [
      parseInt(limit),
      parseInt(offset)
    ]);

    res.json({
      success: true,
      data: {
        tableName,
        records: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table data',
      error: error.message
    });
  }
});

module.exports = router;
