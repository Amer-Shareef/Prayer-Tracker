import api from "./api";

const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      console.log("📤 Fetching user profile...");
      const response = await api.get("/users/profile");
      console.log("📥 Profile received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get profile error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while fetching profile",
        }
      );
    }
  },

  // Update user profile with comprehensive data
  updateProfile: async (profileData) => {
    try {
      console.log("📤 Updating user profile:", profileData);
      const response = await api.put("/users/profile", profileData);
      console.log("📥 Profile update response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Update profile error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while updating profile",
        }
      );
    }
  },
};

export default userService;
