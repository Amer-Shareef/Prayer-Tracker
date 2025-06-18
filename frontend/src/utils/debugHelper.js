import { ENV_CONFIG, getFullUrl } from '../config/environment';

// Debug helper for Prayer Tracker frontend

export const debugLog = (component, action, data = null) => {
  if (ENV_CONFIG.IS_DEVELOPMENT && ENV_CONFIG.ENABLE_LOGGING) {
    console.group(`🔍 [${component}] ${action}`);
    if (data) {
      console.log('Data:', data);
    }
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};

export const apiDebug = (endpoint, method, data = null, response = null) => {
  if (ENV_CONFIG.IS_DEVELOPMENT && ENV_CONFIG.ENABLE_LOGGING) {
    console.group(`🌐 API: ${method} ${getFullUrl(endpoint)}`);
    if (data) console.log('Request:', data);
    if (response) console.log('Response:', response);
    console.groupEnd();
  }
};

export const testConnection = async () => {
  try {
    const response = await fetch(ENV_CONFIG.HEALTH_CHECK_URL);
    const data = await response.json();
    console.log('✅ Backend Connection:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend Connection Failed:', error);
    return false;
  }
};

export const testAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.group('🔐 Auth Status');
  console.log('Token exists:', !!token);
  console.log('User data exists:', !!user);
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('User role:', userData.role);
      console.log('Username:', userData.username);
    } catch (e) {
      console.error('Invalid user data in localStorage');
    }
  }
  console.groupEnd();
  
  return { hasToken: !!token, hasUser: !!user };
};
