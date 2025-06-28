import api from "./api";

const meetingsService = {
  // Get members who require counselling (attendance < 70%)
  getMembersForCounselling: async () => {
    try {
      console.log("📤 Fetching members for counselling...");
      const response = await api.get("/members-for-counselling");
      console.log("📥 Members for counselling received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get members for counselling error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while fetching members for counselling",
        }
      );
    }
  },

  // Get all counselling sessions
  getCounsellingSessions: async (params = {}) => {
    try {
      console.log("📤 Fetching counselling sessions with params:", params);
      const response = await api.get("/counselling-sessions", { params });
      console.log("📥 Counselling sessions received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get counselling sessions error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while fetching counselling sessions",
        }
      );
    }
  },

  // Schedule a new counselling session
  scheduleCounsellingSession: async (sessionData) => {
    try {
      console.log("📤 Scheduling counselling session:", sessionData);
      const response = await api.post("/counselling-sessions", sessionData);
      console.log("📥 Counselling session scheduled:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Schedule counselling session error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while scheduling counselling session",
        }
      );
    }
  },

  // Update counselling session (complete, add notes, etc.)
  updateCounsellingSession: async (sessionId, updateData) => {
    try {
      console.log("📤 Updating counselling session:", sessionId, updateData);
      const response = await api.put(
        `/counselling-sessions/${sessionId}`,
        updateData
      );
      console.log("📥 Counselling session updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Update counselling session error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while updating counselling session",
        }
      );
    }
  },

  // Get counselling statistics
  getCounsellingStats: async () => {
    try {
      console.log("📤 Fetching counselling stats...");
      const response = await api.get("/counselling-stats");
      console.log("📥 Counselling stats received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get counselling stats error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while fetching counselling statistics",
        }
      );
    }
  },

  // Delete counselling session
  deleteCounsellingSession: async (sessionId) => {
    try {
      console.log("🗑️ Deleting counselling session:", sessionId);
      const response = await api.delete(`/counselling-sessions/${sessionId}`);
      console.log("✅ Counselling session deleted:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to delete counselling session:", error);
      throw error;
    }
  },

  // Alias for backward compatibility
  deleteMeeting: async (sessionId) => {
    return meetingsService.deleteCounsellingSession(sessionId);
  },
};

export default meetingsService;
