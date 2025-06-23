import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    otpCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [testOtp, setTestOtp] = useState(''); // For development testing

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return;
    }

    if (showOtpInput && (!formData.otpCode || formData.otpCode.length !== 4)) {
      setError('Please enter the 4-digit OTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData.username, formData.password, formData.otpCode);
      
      if (response.data.success) {
        if (response.data.requiresOtp) {
          // Show OTP input form
          setShowOtpInput(true);
          setMaskedEmail(response.data.email);
          setError('');
          
          // In development, show the test OTP
          if (response.data.testOtp) {
            setTestOtp(response.data.testOtp);
            console.log('🧪 Test OTP:', response.data.testOtp);
          }
        } else {
          // Complete login with comprehensive user data
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          login(response.data.user, response.data.token);
          
          // Log the full user data received (except sensitive info)
          console.log('✅ Login successful, user data received:', {
            ...response.data.user,
            // Don't log sensitive information
            password: undefined
          });
          
          // Redirect based on role
          const { role } = response.data.user;
          if (role === 'Member') {
            navigate('/member/dashboard');
          } else if (role === 'Founder') {
            navigate('/founder/dashboard');
          } else if (role === 'SuperAdmin') {
            navigate('/superadmin/dashboard');
          } else {
            navigate('/member/dashboard');
          }
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (err.response?.status === 423) {
        setError(err.response.data.message || 'Account is temporarily locked');
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      const response = await authService.resendOtp(formData.username);
      
      if (response.data.success) {
        // In development, show the test OTP
        if (response.data.testOtp) {
          setTestOtp(response.data.testOtp);
          console.log('🧪 New Test OTP:', response.data.testOtp);
        }
        
        // Start cooldown
        setResendCooldown(60);
        const cooldownInterval = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.data.message || 'Failed to resend verification code');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err.response?.data?.message || 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  const resetForm = () => {
    setShowOtpInput(false);
    setMaskedEmail('');
    setTestOtp('');
    setFormData({
      username: '',
      password: '',
      otpCode: ''
    });
    setError('');
  };

  const autoFillTestOtp = () => {
    if (testOtp) {
      setFormData(prev => ({ ...prev, otpCode: testOtp }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {showOtpInput ? 'Email Verification' : 'Prayer Tracker Login'}
            </h2>
            <p className="text-gray-600 mt-2">
              {showOtpInput 
                ? `Enter the verification code sent to ${maskedEmail}`
                : 'Sign in to track your prayers'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!showOtpInput ? (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your password"
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  maxLength="4"
                  pattern="[0-9]{4}"
                  required
                  value={formData.otpCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl font-mono tracking-widest"
                  placeholder="0000"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the 4-digit code sent to your email</p>
                
                {testOtp && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded">
                    <p className="text-sm text-yellow-700 font-medium">🧪 Development Mode:</p>
                    <p className="text-sm text-yellow-600">Test OTP: <strong>{testOtp}</strong></p>
                    <button
                      type="button"
                      onClick={autoFillTestOtp}
                      className="mt-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                    >
                      Auto-fill OTP
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {showOtpInput ? 'Verifying...' : 'Sending Code...'}
                  </div>
                ) : (
                  showOtpInput ? 'VERIFY CODE' : 'SEND VERIFICATION CODE'
                )}
              </button>
            </div>

            {showOtpInput && (
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading || resendCooldown > 0}
                  className={`flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md ${
                    resendLoading || resendCooldown > 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {resendLoading ? 'Sending...' : 
                   resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Login
                </button>
              </div>
            )}

            {!showOtpInput && (
              <>
                <div className="text-center">
                  <Link
                    to="/forgot-password"
                    className="text-green-600 hover:text-green-500 text-sm font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="text-center">
                  <p className="text-gray-600 text-sm">
                    A verification code will be sent to your email
                  </p>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Welcome Panel */}
        <div className="bg-green-600 p-8 rounded-lg text-white flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-4">
            {showOtpInput ? 'Check Your Email' : 'Secure Login'}
          </h1>
          <p className="text-lg mb-6">
            {showOtpInput 
              ? 'We\'ve sent a verification code to your email for enhanced security'
              : 'Enhanced security with email verification'
            }
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email verification for security
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Account protection against unauthorized access
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 0 012 2v10m-6 0a2 2 0 002 2h2a2 0 002-2m0 0V5a2 2 0 012-2h2a2 0 012 2v14a2 2 0 01-2 2h-2a2 0 01-2-2z" />
              </svg>
              Track your prayers securely
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;