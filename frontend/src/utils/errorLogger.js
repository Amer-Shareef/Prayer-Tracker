// Error logging utility for Prayer Tracker

export const logError = (error, errorInfo = {}, context = 'Unknown') => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    errorInfo,
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Logged');
    console.error('Error:', error);
    console.log('Context:', context);
    console.log('Error Info:', errorInfo);
    console.log('Full Log:', errorLog);
    console.groupEnd();
  }

  return errorLog;
};

export const handleApiError = (error, context = 'API Call') => {
  const apiErrorInfo = {
    status: error.response?.status,
    statusText: error.response?.statusText,
    url: error.config?.url,
    method: error.config?.method,
    data: error.response?.data
  };

  return logError(error, apiErrorInfo, context);
};
