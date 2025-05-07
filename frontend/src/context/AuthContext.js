import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      setUser({ role });
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      setUser({ role: res.data.role });

      // Redirect based on role
      if (res.data.role === "Member") navigate("/member/dashboard");
      else if (res.data.role === "Founder") navigate("/founder/dashboard");
      else if (res.data.role === "SuperAdmin")
        navigate("/superadmin/dashboard");

      return { success: true };
    } catch (err) {
      return {
        success: false,
        message:
          err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
