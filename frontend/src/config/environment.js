// Simple environment configuration
export const ENV_CONFIG = {
  API_URL: process.env.REACT_APP_API_URL,
  HEALTH_CHECK_URL: process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api/health`
    : "http://localhost:5000/api/health",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING === "true",
};

export default ENV_CONFIG;
