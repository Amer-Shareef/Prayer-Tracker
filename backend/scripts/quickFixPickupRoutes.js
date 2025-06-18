const fs = require('fs');
const path = require('path');

async function quickFixPickupRoutes() {
  console.log('🔧 Quick Fix for Pickup Routes LIMIT Parameter');
  console.log('===============================================');
  
  try {
    const routesFile = path.join(__dirname, '..', 'routes', 'pickupRoutes.js');
    
    // Read current file
    let content = fs.readFileSync(routesFile, 'utf8');
    
    // Check if fix is already applied
    if (content.includes('parseInt(limit, 10)')) {
      console.log('✅ Fix already applied to pickupRoutes.js');
      return;
    }
    
    console.log('🔄 Applying fix to pickupRoutes.js...');
    
    // Replace the problematic line
    const oldPattern = /const limitValue = parseInt\(limit\);/g;
    const newReplacement = 'const limitValue = parseInt(limit, 10);';
    
    if (content.match(oldPattern)) {
      content = content.replace(oldPattern, newReplacement);
      console.log('✅ Fixed parseInt usage');
    }
    
    // Also ensure we handle string conversion properly
    const limitPattern = /queryParams\.push\(parseInt\(limit\)\);/g;
    if (content.match(limitPattern)) {
      content = content.replace(limitPattern, 'queryParams.push(parseInt(limit, 10));');
      console.log('✅ Fixed limit parameter conversion');
    }
    
    // Write back the file
    fs.writeFileSync(routesFile, content, 'utf8');
    
    console.log('🎉 Quick fix applied successfully!');
    console.log('🔄 Please restart your server: npm start');

  } catch (error) {
    console.error('❌ Quick fix failed:', error.message);
  }
}

quickFixPickupRoutes();
