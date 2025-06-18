const fs = require('fs').promises;
const path = require('path');

async function listBackups() {
  console.log('📁 Prayer Tracker Database Backups');
  console.log('==================================');
  
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    try {
      const files = await fs.readdir(backupDir);
      const backupFiles = files.filter(f => f.endsWith('.sql'));
      
      if (backupFiles.length === 0) {
        console.log('📂 No backup files found');
        console.log('');
        console.log('💡 Create your first backup with:');
        console.log('   npm run backup-db');
        return;
      }

      console.log(`📊 Found ${backupFiles.length} backup file(s):`);
      console.log('');

      // Sort by date (newest first)
      backupFiles.sort().reverse();

      for (const file of backupFiles) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        // Extract date from filename
        const dateMatch = file.match(/prayer_tracker_backup_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
        const dateStr = dateMatch ? dateMatch[1].replace(/_/g, ' ').replace(/-/g, ':') : 'Unknown';
        
        console.log(`📄 ${file}`);
        console.log(`   📅 Created: ${stats.mtime.toLocaleString()}`);
        console.log(`   📏 Size: ${fileSizeInMB} MB`);
        console.log(`   🔄 Restore: npm run restore-db ${file}`);
        console.log('');
      }

      console.log('💡 Commands:');
      console.log('   📦 Create backup: npm run backup-db');
      console.log('   🔄 Restore backup: npm run restore-db <filename>');
      console.log('   🗑️  Clean old backups: npm run clean-backups');

    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📂 Backups directory does not exist');
        console.log('');
        console.log('💡 Create your first backup with:');
        console.log('   npm run backup-db');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Error listing backups:', error.message);
  }
}

listBackups();
