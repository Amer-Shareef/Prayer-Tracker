const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Error log file path
const errorLogPath = path.join(logsDir, 'error.log');

// Log error to file
const logError = (message, error) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}: ${error.stack || error.message || error}\n`;
  
  fs.appendFile(errorLogPath, logEntry, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
  
  console.error(message, error);
};

module.exports = {
  logError
};
