import api from "./api";

const authService = {
  // Login (works for both members, founders, and admins)
  login: async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      const { token, refreshToken, role, user } = response.data;

      // Store both tokens and user data in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("🔑 Login successful, tokens stored");
      console.log("🔄 Refresh token available for automatic renewal");

      return { success: true, role, user };
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw (
        error.response?.data || { message: "An error occurred during login" }
      );
    }
  },

  // Logout
  logout: () => {
    console.log("🚪 Logging out, clearing all tokens");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
  },

  // Get the current logged in user
  getCurrentUser: () => {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("user");

    if (!token || !role) {
      return null;
    }

    return { 
      role, 
      user: user ? JSON.parse(user) : null,
      hasRefreshToken: !!refreshToken
    };
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem("token");
  },

  // Get the JWT token
  getToken: () => {
    return localStorage.getItem("token");
  },

  // Get the refresh token
  getRefreshToken: () => {
    return localStorage.getItem("refreshToken");
  },

  // Check if token is valid (can be used for auto-logout)
  verifyToken: async () => {
    try {
      await api.get("/auth/verify");
      return true;
    } catch (error) {
      authService.logout();
      return false;
    }
  },
};

export default authService;
