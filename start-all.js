#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Try to load environment variables with error handling
try {
  require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('⚠️  dotenv module not found. Installing dependencies...');
    // Continue without dotenv for now, will install it
  } else {
    console.error('❌ Error loading environment variables:', error.message);
  }
}

// Environment-based configuration with fallbacks
const getAppConfig = () => {
  const isDev = process.argv.includes('--dev') || process.env.NODE_ENV !== 'production';
  const isProduction = process.env.NODE_ENV === 'production' && !process.argv.includes('--dev');

  return {
    isDev,
    isProduction,
    backend: {
      host: process.env.HOST || 'localhost',
      port: process.env.PORT || 5000,
      url: `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 5000}`,
      healthUrl: process.env.HEALTH_CHECK_URL || `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 5000}/api/health`
    },
    frontend: {
      host: process.env.FRONTEND_HOST || 'localhost', 
      port: process.env.FRONTEND_PORT || 3000,
      url: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
  };
};

const config = getAppConfig();

console.log('🚀 Starting Prayer Tracker Application');
console.log('=====================================');
console.log(`Arguments: ${process.argv.slice(2).join(' ')}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`Mode: ${config.isDev ? 'Development' : 'Production'}`);
console.log('');
console.log('📡 Configuration:');
console.log(`  Backend:  ${config.backend.url}`);
console.log(`  Frontend: ${config.frontend.url}`);
console.log(`  Health:   ${config.backend.healthUrl}`);
console.log('');

// Function to run command and return promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

// Enhanced dependency check
function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  // Check root dependencies
  const rootNodeModules = path.join(__dirname, 'node_modules');
  const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
  const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');
  
  const missingDeps = [];
  
  if (!fs.existsSync(rootNodeModules)) {
    missingDeps.push('root');
    console.log('⚠️  Root dependencies not found');
  }
  
  if (!fs.existsSync(backendNodeModules)) {
    missingDeps.push('backend');
    console.log('⚠️  Backend dependencies not found');
  }
  
  if (!fs.existsSync(frontendNodeModules)) {
    missingDeps.push('frontend');
    console.log('⚠️  Frontend dependencies not found');
  }
  
  if (missingDeps.length > 0) {
    console.log(`⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
    return false;
  }
  
  console.log('✅ Dependencies found');
  return true;
}

// Enhanced dependency installation
async function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  try {
    console.log('📦 Installing root dependencies (dotenv, concurrently, etc.)...');
    await runCommand('npm', ['install']);
    
    console.log('📦 Installing backend dependencies...');
    await runCommand('npm', ['install'], { cwd: path.join(__dirname, 'backend') });
    
    console.log('📦 Installing frontend dependencies...');
    await runCommand('npm', ['install'], { cwd: path.join(__dirname, 'frontend') });
    
    console.log('✅ All dependencies installed');
    
    // Now try to reload dotenv
    try {
      require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
      console.log('✅ Environment variables loaded');
    } catch (e) {
      console.log('⚠️  Could not load environment variables after installation');
    }
    
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    throw error;
  }
}

// Updated browser opening with environment URL
function openBrowser(url = config.frontend.url) {
  const start = process.platform === 'darwin' ? 'open' : 
                process.platform === 'win32' ? 'start' : 'xdg-open';
  
  try {
    spawn(start, [url], { stdio: 'ignore', detached: true, shell: true }).unref();
    console.log(`🌍 Opening ${url} in your default browser...`);
  } catch (error) {
    console.log(`❌ Could not open browser automatically. Please manually open: ${url}`);
  }
}

// Updated server wait function with environment URLs
async function waitForServer(url = config.backend.healthUrl, maxAttempts = 30) {
  console.log(`🔄 Waiting for server at: ${url}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const http = require('http');
      const urlObj = new URL(url);
      
      await new Promise((resolve, reject) => {
        const req = http.get({
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname,
          timeout: 2000
        }, (res) => {
          resolve(res);
        });
        
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('timeout')));
      });
      
      console.log(`✅ Server is ready at ${url}`);
      return true;
    } catch (error) {
      if (attempt === maxAttempts) {
        console.log(`⚠️  Server check timeout after ${maxAttempts} attempts`);
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// Test database connection
async function testDatabase() {
  console.log('🗄️  Testing database connection...');
  try {
    await runCommand('npm', ['run', 'test-db'], { cwd: path.join(__dirname, 'backend') });
    console.log('✅ Database connection successful');
    
    // Add a small delay to ensure clean process exit
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    console.log('❌ Database connection failed');
    console.log('⚠️  Attempting to setup database...');
    
    try {
      await runCommand('npm', ['run', 'setup-db'], { cwd: path.join(__dirname, 'backend') });
      await runCommand('npm', ['run', 'seed-users'], { cwd: path.join(__dirname, 'backend') });
      console.log('✅ Database setup completed');
      return true;
    } catch (setupError) {
      console.log('❌ Database setup failed');
      return false;
    }
  }
}

// Build frontend for production
async function buildFrontend() {
  if (!config.isProduction && !process.argv.includes('--build')) {
    return;
  }
  
  console.log('🏗️  Building frontend for production...');
  await runCommand('npm', ['run', 'build'], { cwd: path.join(__dirname, 'frontend') });
  console.log('✅ Frontend build completed');
}

// Updated service start with environment configuration
async function startServices() {
  if (config.isDev) {
    console.log('🔧 Starting in DEVELOPMENT mode...');
    console.log(`🌐 Frontend: ${config.frontend.url}`);
    console.log(`🖥️  Backend:  ${config.backend.url}`);
    console.log('');
    
    // Install concurrently if not exists
    try {
      require('concurrently');
    } catch (e) {
      console.log('📦 Installing concurrently...');
      await runCommand('npm', ['install', 'concurrently', '--save-dev']);
    }
    
    console.log('🚀 Starting both frontend and backend...');
    
    // Import concurrently after potential installation
    const concurrently = require('concurrently');
    
    // Start both backend and frontend with environment variables
    const { result } = concurrently([
      {
        command: 'npm start',
        cwd: path.join(__dirname, 'backend'),
        name: 'backend',
        prefixColor: 'blue',
        env: { 
          ...process.env,
          HOST: config.backend.host,
          PORT: config.backend.port
        }
      },
      {
        command: process.platform === 'win32' ? 'set BROWSER=none && npm start' : 'BROWSER=none npm start',
        cwd: path.join(__dirname, 'frontend'),
        name: 'frontend', 
        prefixColor: 'green',
        env: { 
          ...process.env,
          BROWSER: 'none',
          PORT: config.frontend.port,
          HOST: config.frontend.host
        }
      }
    ], {
      prefix: 'name',
      killOthers: ['failure', 'success'],
      restartTries: 3
    });

    // Wait for servers and open browser
    setTimeout(async () => {
      console.log('\n🌐 Waiting for servers to start...');
      
      const backendReady = await waitForServer(config.backend.healthUrl);
      
      if (backendReady) {
        setTimeout(() => {
          console.log('🌍 Opening browser...');
          openBrowser(config.frontend.url);
        }, 3000);
      }
    }, 5000);

    try {
      await result;
      console.log('✅ All services started successfully');
    } catch (error) {
      console.error('❌ Error starting services:', error);
      process.exit(1);
    }
  } else {
    console.log('🚀 Starting in PRODUCTION mode...');
    console.log(`🌍 Application: ${config.backend.url}`);
    console.log('');
    
    // Start only backend (frontend is served by backend in production)
    const backendProcess = spawn('npm', ['start'], { 
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit',
      shell: true,
      env: { 
        ...process.env,
        HOST: config.backend.host,
        PORT: config.backend.port
      }
    });

    // Wait for backend and open browser
    setTimeout(async () => {
      console.log('\n🌐 Waiting for server to start...');
      const serverReady = await waitForServer(config.backend.healthUrl);
      
      if (serverReady) {
        setTimeout(() => {
          console.log('🌍 Opening browser...');
          openBrowser(config.backend.url);
        }, 2000);
      }
    }, 3000);

    backendProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Backend process exited with code ${code}`);
        process.exit(code);
      }
    });
  }
}

// Main startup function
async function startApplication() {
  try {
    // Check and install dependencies if needed
    if (!checkDependencies()) {
      await installDependencies();
    }
    
    // Test database connection
    const dbReady = await testDatabase();
    if (!dbReady) {
      console.error('❌ Cannot start application without database connection');
      console.error('Please check your .env file and database configuration');
      process.exit(1);
    }
    
    // Build frontend if in production
    await buildFrontend();
    
    // Start services
    await startServices();
    
  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Prayer Tracker...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Prayer Tracker...');
  process.exit(0);
});

// Start the application
startApplication();
