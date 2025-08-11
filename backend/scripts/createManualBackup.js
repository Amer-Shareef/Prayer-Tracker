const fs = require('fs');
const path = require('path');

// Create a timestamp for the backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFileName = `manual_backup_before_area_migration_${timestamp}.txt`;
const backupPath = path.join(__dirname, '..', 'backups', backupFileName);

// Create backup directory if it doesn't exist
const backupDir = path.dirname(backupPath);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Write backup info
const backupInfo = `
Manual Backup Created: ${new Date().toISOString()}
=================================================

This backup was created before migrating from mosque-based to area-based system.

Changes to be made:
1. Add area_id column to users table
2. Remove mosque_id references
3. Update prayers table to use area_id
4. Remove mosque-related functionality
5. Make area selection mandatory for members

Database State Before Migration:
- Areas table: Contains area data (preserved)
- Users table: Has mosque_id and area text field
- Mosques table: To be removed after migration
- Prayers table: Uses mosque_id (to be changed to area_id)

If rollback is needed, restore from the most recent SQL backup file in this directory.

Existing backups available:
- prayer_tracker_backup_2025-06-18_03-31-44-031Z.sql
- prayer_tracker_backup_2025-06-18_03-49-45-541Z.sql
`;

fs.writeFileSync(backupPath, backupInfo);
console.log('✅ Manual backup info created:', backupPath);
console.log('📋 Proceeding with migration...');
