import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectPath = user.role === "Member" ? "/member/dashboard" : 
                          user.role === "Founder" ? "/founder/dashboard" : 
                          user.role === "SuperAdmin" ? "/superadmin/dashboard" : 
                          "/login";
      navigate(redirectPath);
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 flex w-3/4 max-w-4xl">
        {/* Left Section */}
        <div className="w-1/2 pr-8">
          <h2 className="text-2xl font-bold mb-4">Prayer Tracker Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <i className="fas fa-user"></i>
                </span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <i className="fas fa-lock"></i>
                </span>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button 
              className={`w-full bg-green-500 text-white py-2 rounded-lg ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-600"
              }`}
              disabled={loading}
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-4 text-center">
            <a href="/forgot-password" className="text-green-500 hover:underline">
              Forgot Password?
            </a>
          </p>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Members: Please use the credentials provided.
          </p>
        </div>

        {/* Right Section */}
        <div className="w-1/2 bg-green-500 text-white flex flex-col items-center justify-center rounded-r-lg">
          <h2 className="text-3xl font-bold mb-4">Welcome</h2>
          <p>Login to the system and do your operations</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;