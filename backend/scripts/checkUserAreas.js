const { pool } = require('../config/database');

async function checkUserAreas() {
  try {
    const [users] = await pool.execute('SELECT id, username, role, area_id FROM users WHERE role IN ("Founder", "Member")');
    console.log('📋 Current users and their area assignments:');
    users.forEach(u => console.log(`  - ${u.username} (${u.role}): area_id = ${u.area_id}`));
    
    const [areas] = await pool.execute('SELECT area_id, area_name FROM areas');
    console.log('\n📍 Available areas:');
    areas.forEach(a => console.log(`  - Area ${a.area_id}: ${a.area_name}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUserAreas();
