import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on app start
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedRefreshToken = localStorage.getItem("refreshToken");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));
          console.log("🔑 Auth initialized with stored tokens");
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData, userToken, userRefreshToken) => {
    console.log("🔑 Login successful, storing tokens");
    setUser(userData);
    setToken(userToken);
    setRefreshToken(userRefreshToken);
    localStorage.setItem("token", userToken);
    localStorage.setItem("refreshToken", userRefreshToken);

    // Store the complete user data
    localStorage.setItem("user", JSON.stringify(userData));

    // For backward compatibility, also store role separately
    localStorage.setItem("role", userData.role);
  };

  const updateToken = (newToken) => {
    console.log("🔄 Updating access token after refresh");
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const logout = () => {
    console.log("🚪 Logging out, clearing all tokens");
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  };

  const value = {
    user,
    token,
    refreshToken,
    login,
    logout,
    updateToken,
    isAuthenticated: !!user && !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
