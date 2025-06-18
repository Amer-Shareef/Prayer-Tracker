require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

async function autoBackup() {
  console.log('🤖 Prayer Tracker Auto-Backup System');
  console.log('====================================');
  
  const scheduleType = process.argv[2] || 'daily'; // daily, weekly, monthly
  
  console.log(`📅 Schedule: ${scheduleType} backup`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  
  try {
    // Run backup
    console.log('🔄 Creating database backup...');
    
    const backupScript = path.join(__dirname, 'backupDatabase.js');
    
    await new Promise((resolve, reject) => {
      const backup = spawn('node', [backupScript], {
        stdio: 'inherit',
        shell: true
      });
      
      backup.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Backup failed with code ${code}`));
        }
      });
      
      backup.on('error', reject);
    });
    
    console.log('✅ Backup completed successfully');
    
    // Clean old backups based on schedule
    let keepCount;
    switch (scheduleType) {
      case 'daily': keepCount = 7; break;   // Keep 7 daily backups
      case 'weekly': keepCount = 4; break;  // Keep 4 weekly backups  
      case 'monthly': keepCount = 12; break; // Keep 12 monthly backups
      default: keepCount = 5; break;
    }
    
    console.log(`🗑️  Cleaning old backups (keeping ${keepCount})...`);
    
    const cleanScript = path.join(__dirname, 'cleanBackups.js');
    
    await new Promise((resolve, reject) => {
      const clean = spawn('node', [cleanScript, keepCount.toString()], {
        stdio: 'inherit',
        shell: true
      });
      
      clean.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Cleanup failed with code ${code}`));
        }
      });
      
      clean.on('error', reject);
    });
    
    console.log('');
    console.log('🎉 Auto-backup completed successfully!');
    console.log(`📅 Next ${scheduleType} backup: ${getNextBackupTime(scheduleType)}`);
    
  } catch (error) {
    console.error('❌ Auto-backup failed:', error.message);
    process.exit(1);
  }
}

function getNextBackupTime(scheduleType) {
  const now = new Date();
  const next = new Date(now);
  
  switch (scheduleType) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  
  return next.toLocaleString();
}

autoBackup();
