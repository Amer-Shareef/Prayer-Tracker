const fs = require('fs').promises;
const path = require('path');

async function cleanBackups() {
  console.log('🗑️  Cleaning Old Database Backups');
  console.log('=================================');
  
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    const keepCount = parseInt(process.argv[2]) || 5; // Keep last 5 by default
    
    console.log(`📋 Keeping the ${keepCount} most recent backups`);
    
    const files = await fs.readdir(backupDir);
    const backupFiles = files
      .filter(f => f.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        stats: null
      }));
    
    if (backupFiles.length === 0) {
      console.log('📂 No backup files found to clean');
      return;
    }

    // Get file stats
    for (const backup of backupFiles) {
      backup.stats = await fs.stat(backup.path);
    }

    // Sort by modification time (newest first)
    backupFiles.sort((a, b) => b.stats.mtime - a.stats.mtime);

    console.log(`📊 Found ${backupFiles.length} backup file(s)`);

    if (backupFiles.length <= keepCount) {
      console.log(`✅ No cleanup needed (${backupFiles.length} ≤ ${keepCount})`);
      return;
    }

    const filesToDelete = backupFiles.slice(keepCount);
    console.log(`🗑️  Will delete ${filesToDelete.length} old backup(s):`);
    
    let totalSizeFreed = 0;

    for (const backup of filesToDelete) {
      const fileSizeInMB = (backup.stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   🗑️  ${backup.name} (${fileSizeInMB} MB)`);
      
      await fs.unlink(backup.path);
      totalSizeFreed += backup.stats.size;
    }

    const totalFreedMB = (totalSizeFreed / (1024 * 1024)).toFixed(2);

    console.log('');
    console.log('✅ Cleanup completed!');
    console.log(`📊 Deleted ${filesToDelete.length} file(s)`);
    console.log(`💾 Freed ${totalFreedMB} MB of disk space`);
    console.log(`📁 Kept ${keepCount} most recent backups`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

cleanBackups();
