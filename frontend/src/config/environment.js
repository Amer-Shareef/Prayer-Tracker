// Centralized environment configuration

export const ENV_CONFIG = {
  // API Configuration - Updated for EC2
  API_URL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || "http://localhost:5000",
  HEALTH_CHECK_URL:
    process.env.REACT_APP_HEALTH_CHECK_URL ||
    "http://localhost:5000/api/health",

  // Frontend Configuration - Updated for EC2
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000",
  HOST: process.env.REACT_APP_HOST || "localhost",
  PORT: process.env.REACT_APP_PORT || 3000,

  // Environment
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",

  // Debugging
  ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING !== "false",

  // Allowed hosts - Updated for EC2
  ALLOWED_HOSTS: process.env.REACT_APP_ALLOWED_HOSTS?.split(",") || [
    "localhost",
    "localhost",
    "127.0.0.1",
  ],
};

// Validation function
export const validateEnvironment = () => {
  const required = ["API_URL", "BACKEND_URL"];
  const missing = required.filter((key) => !ENV_CONFIG[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:", missing);
    return false;
  }

  if (ENV_CONFIG.IS_DEVELOPMENT) {
    console.log("🔧 Environment Configuration:", ENV_CONFIG);
  }

  return true;
};

// URL helpers
export const getFullUrl = (path = "") => {
  return `${ENV_CONFIG.API_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const getFrontendUrl = (path = "") => {
  return `${ENV_CONFIG.FRONTEND_URL}${
    path.startsWith("/") ? path : `/${path}`
  }`;
};

// Initialize and validate on import
validateEnvironment();

export default ENV_CONFIG;
