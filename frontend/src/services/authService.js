import api from "./api";

const authService = {
  // Login (works for both members, founders, and admins)
  login: async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      const { token, role } = response.data;

      // Store the token and user data in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      return { success: true, role };
    } catch (error) {
      throw (
        error.response?.data || { message: "An error occurred during login" }
      );
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  },

  // Get the current logged in user
  getCurrentUser: () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || !role) {
      return null;
    }

    return { role };
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem("token");
  },

  // Get the JWT token
  getToken: () => {
    return localStorage.getItem("token");
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
