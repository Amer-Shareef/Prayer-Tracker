const { spawn } = require('child_process');

function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' : 
                process.platform === 'win32' ? 'start' : 'xdg-open';
  
  console.log(`🌍 Opening ${url} in your default browser...`);
  
  try {
    spawn(start, [url], { 
      stdio: 'ignore', 
      detached: true,
      shell: true 
    }).unref();
    
    console.log('✅ Browser opened successfully!');
  } catch (error) {
    console.log('❌ Could not open browser automatically');
    console.log(`   Please manually open: ${url}`);
  }
}

// Get URL from command line argument or use EC2 default
const url = process.argv[2] || 'http://13.60.193.171:3000';
openBrowser(url);
