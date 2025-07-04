import axios from "axios";
import { ENV_CONFIG, getFullUrl } from "../config/environment";

// Use environment-based configuration instead of hardcoded URL
const API_URL = ENV_CONFIG.API_URL;

console.log("🌐 API Base URL:", API_URL); // Debug log

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ENHANCED response interceptor with automatic retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log error for debugging
    console.error("API Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Handle database connection errors with automatic retry
    const isRetryableError =
      error.response?.status === 503 ||
      error.response?.data?.error === "DATABASE_CONNECTION_FAILED" ||
      error.response?.data?.error === "CONNECTION_LOST" ||
      error.response?.data?.error === "CONNECTION_TIMEOUT" ||
      error.response?.data?.isRetryable === true ||
      error.code === "ECONNABORTED" || // Timeout
      error.code === "NETWORK_ERROR";

    if (isRetryableError && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= 3) {
        // Max 3 retries
        const delay = Math.min(
          1000 * Math.pow(2, originalRequest._retryCount - 1),
          5000
        ); // Exponential backoff, max 5 seconds

        console.warn(
          `🔄 Retrying request in ${delay}ms (attempt ${originalRequest._retryCount}/3)...`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));

        try {
          return await api(originalRequest);
        } catch (retryError) {
          console.error(
            `❌ Retry ${originalRequest._retryCount} failed:`,
            retryError.message
          );

          if (originalRequest._retryCount === 3) {
            // Final retry failed
            const finalError = new Error(
              "Unable to connect to server after multiple attempts. Please check your connection and try again."
            );
            finalError.response = {
              data: {
                success: false,
                message:
                  "Connection failed after multiple retries. Please refresh the page.",
                isRetryable: true,
                retryCount: originalRequest._retryCount,
              },
            };
            return Promise.reject(finalError);
          }

          // Continue to next retry
          return Promise.reject(retryError);
        }
      }
    }

    // Return a more structured error for non-retryable errors
    if (error.response?.data) {
      return Promise.reject(error);
    } else {
      // Network or other errors
      const networkError = new Error(
        "Unable to connect to server. Please check your internet connection."
      );
      networkError.response = {
        data: {
          success: false,
          message:
            "Network connection issue. Please check your internet connection and try again.",
          isRetryable: true,
        },
      };
      return Promise.reject(networkError);
    }
  }
);

// Auth service - ENHANCED with OTP
export const authService = {
  login: (username, password, otpCode = null) => {
    console.log("🔐 Attempting login for:", username, { hasOtp: !!otpCode });
    console.log("🌐 Login URL:", `${API_URL}/login`);

    const requestData = { username, password };
    if (otpCode) {
      requestData.otpCode = otpCode;
    }

    return api
      .post("/login", requestData)
      .then((response) => {
        console.log("✅ Login response received:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("❌ Login failed:", error);
        throw error;
      });
  },

  // NEW: Resend OTP
  resendOtp: async (username) => {
    console.log("📧 Resending OTP for:", username);

    try {
      const response = await api.post("/resend-otp", { username });
      console.log("✅ Resend OTP response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Resend OTP failed:", error);
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    console.log("🔐 Attempting password change...");
    console.log("🌐 Change password URL:", `${API_URL}/change-password`);

    try {
      const response = await api.post("/change-password", {
        currentPassword,
        newPassword,
      });

      console.log("✅ Password change response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Password change failed:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }
  },

  forgotPassword: async (email) => {
    console.log("📧 Attempting forgot password for:", email);

    try {
      const response = await api.post("/forgot-password", { email });
      console.log("✅ Forgot password response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Forgot password failed:", error);
      throw error;
    }
  },

  resetPassword: async (token, newPassword) => {
    console.log("🔄 Attempting password reset...");

    try {
      const response = await api.post("/reset-password", {
        token,
        newPassword,
      });
      console.log("✅ Password reset response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Password reset failed:", error);
      throw error;
    }
  },

  logout: () => {
    return Promise.resolve();
  },
};

// User service
export const userService = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (userData) => api.put("/users/profile", userData),
};

// Enhanced prayer service with connection monitoring
export const prayerService = {
  getPrayers: (params = {}) => {
    console.log("🌐 API: Getting prayers with params:", params);

    if (params.date) {
      console.log("🗓️ Requesting prayers for specific date:", params.date);
    }

    const request = api.get("/prayers", { params });

    console.log(
      "📡 Request URL:",
      `${API_URL}/prayers${params.date ? `?date=${params.date}` : ""}`
    );

    return request
      .then((response) => {
        console.log("📥 API Response received:", {
          success: response.data.success,
          dataCount: response.data.data?.length || 0,
          sampleData: response.data.data?.[0] || null,
        });
        return response;
      })
      .catch((error) => {
        console.error("❌ Prayer API Error:", error.message);
        throw error;
      });
  },

  recordPrayer: (data) => {
    console.log("🌐 API: Recording prayer:", data);

    // Enhanced validation
    if (!data.prayer_type || !data.prayer_date || !data.status) {
      console.error("❌ API: Missing required fields:", {
        prayer_type: !!data.prayer_type,
        prayer_date: !!data.prayer_date,
        status: !!data.status,
      });

      return Promise.reject({
        response: {
          data: {
            success: false,
            message: "Prayer type, date, and status are required",
          },
        },
      });
    }

    console.log("✅ API: Prayer data validation passed");
    return api
      .post("/prayers", data)
      .then((response) => {
        console.log("📥 Record Prayer Response:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("❌ Record Prayer Error:", error.message);
        throw error;
      });
  },

  getStats: (period = 30) => {
    console.log("🌐 API: Getting stats for period:", period);
    return api.get("/prayers/stats", { params: { period } }).catch((error) => {
      console.error("❌ Stats API Error:", error.message);
      throw error;
    });
  },
};

// Mosque service
export const mosqueService = {
  getMosques: () => api.get("/mosques"),
  getMosqueById: (id) => api.get(`/mosques/${id}`),
  createMosque: (data) => api.post("/mosques", data),
  updateMosque: (id, data) => api.put(`/mosques/${id}`, data),
};

// Member Management APIs
export const memberAPI = {
  getMembers: async () => {
    const response = await api.get("/members");
    return response.data;
  },
  addMember: async (memberData) => {
    const response = await api.post("/members", memberData);
    return response.data;
  },
  updateMember: async (id, memberData) => {
    const response = await api.put(`/members/${id}`, memberData);
    return response.data;
  },
  deleteMember: async (id) => {
    const response = await api.delete(`/members/${id}`);
    return response.data;
  },
};

// Announcement service
export const announcementService = {
  getAnnouncements: () => api.get("/announcements"),
  createAnnouncement: (data) => api.post("/announcements", data),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
};

// Enhanced pickup service for mobile-first workflow
export const pickupService = {
  // Get pickup requests (for both members and founders)
  getPickupRequests: async (params = {}) => {
    try {
      console.log("🔄 Getting pickup requests with params:", params);
      const queryParams = new URLSearchParams(params).toString();
      const url = `/pickup-requests${queryParams ? `?${queryParams}` : ""}`;
      console.log("📡 API URL:", url);

      const response = await api.get(url);
      console.log("📥 Pickup requests response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch pickup requests:", error);
      throw error;
    }
  },

  // Get ALL pickup requests (for founders/admin - not just user's own) - MISSING METHOD ADDED
  getAllPickupRequests: async (params = {}) => {
    try {
      console.log("🔄 Getting ALL pickup requests (admin/founder view)");
      const queryParams = new URLSearchParams({
        all: "true", // Flag to get all requests, not just user's own
        ...params,
      }).toString();
      const url = `/pickup-requests?${queryParams}`;
      console.log("📡 Admin API URL:", url);

      const response = await api.get(url);
      console.log("📥 All pickup requests response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch all pickup requests:", error);
      throw error;
    }
  },

  // Create pickup request
  createPickupRequest: async (requestData) => {
    try {
      console.log("📤 Creating pickup request:", requestData);
      const response = await api.post("/pickup-requests", requestData);
      console.log("✅ Pickup request created:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to create pickup request:", error);
      throw error;
    }
  },

  // Update pickup request
  updatePickupRequest: async (id, requestData) => {
    try {
      console.log(`📤 Updating pickup request ${id}:`, requestData);
      const response = await api.put(`/pickup-requests/${id}`, requestData);
      console.log("✅ Pickup request updated:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to update pickup request:", error);
      throw error;
    }
  },

  // Delete pickup request
  deletePickupRequest: async (id) => {
    try {
      console.log(`🗑️ Deleting pickup request ${id}`);
      const response = await api.delete(`/pickup-requests/${id}`);
      console.log("✅ Pickup request deleted:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to delete pickup request:", error);
      throw error;
    }
  },

  // Approve pickup request with driver assignment
  approvePickupRequest: async (
    requestId,
    assignedDriverId,
    assignedDriverName
  ) => {
    try {
      console.log(
        "🟢 Approving pickup request:",
        requestId,
        "with driver:",
        assignedDriverName
      );
      const response = await api.put(`/pickup-requests/${requestId}/approve`, {
        assignedDriverId,
        assignedDriverName,
      });
      console.log("✅ Pickup request approved:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to approve pickup request:", error);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },

  // Reject pickup request
  rejectPickupRequest: async (requestId, rejectionReason) => {
    try {
      console.log(
        "🔴 Rejecting pickup request:",
        requestId,
        "reason:",
        rejectionReason
      );
      const response = await api.put(`/pickup-requests/${requestId}/reject`, {
        rejectionReason,
      });
      console.log("✅ Pickup request rejected:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to reject pickup request:", error);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },
};

// Daily Activities service - UPDATED
export const dailyActivitiesService = {
  // Get activities for a specific date or date range
  getActivities: (params = {}) => {
    console.log("📊 Getting daily activities:", params);
    return api
      .get("/daily-activities", { params })
      .then((response) => {
        console.log("✅ Daily activities response:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("❌ Daily activities failed:", error);
        throw error;
      });
  },

  // Record activity for any date - UPDATED (removed notes parameter)
  recordActivity: async (
    activityDate,
    activityType,
    value,
    isMinutes = false
  ) => {
    console.log("📝 Recording activity:", {
      activityDate,
      activityType,
      value,
      isMinutes,
    });

    const requestData = {
      activity_date: activityDate,
      activity_type: activityType,
      [isMinutes ? "minutes_value" : "count_value"]: value,
    };

    try {
      const response = await api.post("/daily-activities", requestData);
      console.log("✅ Activity recorded:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Activity recording failed:", error);
      throw error;
    }
  },

  // Record activity for today - UPDATED (removed notes parameter)
  recordToday: async (activityType, value, isMinutes = false) => {
    const today = new Date().toISOString().split("T")[0];
    return dailyActivitiesService.recordActivity(
      today,
      activityType,
      value,
      isMinutes
    );
  },

  // Get activity statistics
  getStats: (days = 7) => {
    console.log("📈 Getting activity stats for", days, "days");
    return api
      .get(`/daily-activities/stats?days=${days}`)
      .then((response) => {
        console.log("✅ Activity stats response:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("❌ Activity stats failed:", error);
        throw error;
      });
  },

  // Update existing activity
  updateActivity: (activityId, updateData) => {
    console.log("🔄 Updating activity:", activityId, updateData);
    return api
      .put(`/daily-activities/${activityId}`, updateData)
      .then((response) => {
        console.log("✅ Activity updated:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("❌ Activity update failed:", error);
        throw error;
      });
  },

  // Delete activity
  deleteActivity: (activityId) => {
    console.log("🗑️ Deleting activity:", activityId);
    return api
      .delete(`/daily-activities/${activityId}`)
      .then((response) => {
        console.log("✅ Activity deleted:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("❌ Activity deletion failed:", error);
        throw error;
      });
  },
};

// Wake Up Call service - NEW
export const wakeUpCallService = {
  // Get wake-up call records with optional filters
  getWakeUpCalls: async (params = {}) => {
    try {
      console.log("📞 Fetching wake-up calls with params:", params);

      const response = await api.get("/wake-up-calls", { params });
      console.log("✅ Wake-up calls response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch wake-up calls:", error);
      throw error;
    }
  },

  // Get wake-up call statistics
  getWakeUpCallStats: async (params = {}) => {
    try {
      console.log("📊 Fetching wake-up call stats with params:", params);

      const response = await api.get("/wake-up-calls/stats", { params });
      console.log("✅ Wake-up call stats response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch wake-up call stats:", error);
      throw error;
    }
  },

  // Record wake-up call response (for mobile app integration)
  recordWakeUpCall: async (callData) => {
    try {
      console.log("📞 Recording wake-up call response:", callData);

      const response = await api.post("/wake-up-calls", callData);
      console.log("✅ Wake-up call recorded:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to record wake-up call:", error);
      throw error;
    }
  },
};

// Meetings service - ENHANCED for counselling functionality
export const meetingsService = {
  // Get members requiring counselling (attendance < 70%)
  getMembersForCounselling: async (params = {}) => {
    try {
      console.log("📅 Fetching members for counselling with params:", params);

      const response = await api.get("/members-for-counselling", { params });
      console.log("✅ Members for counselling response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch members for counselling:", error);
      throw error;
    }
  },

  // Get counselling sessions
  getCounsellingSessions: async (params = {}) => {
    try {
      console.log("📅 Fetching counselling sessions with params:", params);

      const response = await api.get("/counselling-sessions", { params });
      console.log("✅ Counselling sessions response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch counselling sessions:", error);
      throw error;
    }
  },

  // Schedule counselling session
  scheduleCounsellingSession: async (sessionData) => {
    try {
      console.log("📅 Scheduling counselling session:", sessionData);
      const response = await api.post("/counselling-sessions", sessionData);
      console.log("✅ Counselling session scheduled:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to schedule counselling session:", error);
      throw error;
    }
  },

  // Update counselling session
  updateCounsellingSession: async (sessionId, updateData) => {
    try {
      console.log("🔄 Updating counselling session:", sessionId, updateData);
      const response = await api.put(
        `/counselling-sessions/${sessionId}`,
        updateData
      );
      console.log("✅ Counselling session updated:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to update counselling session:", error);
      throw error;
    }
  },

  // Delete counselling session
  deleteCounsellingSession: async (sessionId) => {
    try {
      console.log("🗑️ Deleting counselling session:", sessionId);
      const response = await api.delete(`/counselling-sessions/${sessionId}`);
      console.log("✅ Counselling session deleted:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to delete counselling session:", error);
      throw error;
    }
  },

  // Alias for backward compatibility
  deleteMeeting: async (sessionId) => {
    return meetingsService.deleteCounsellingSession(sessionId);
  },

  // Get counselling statistics
  getCounsellingStats: async (params = {}) => {
    try {
      console.log("📊 Fetching counselling stats with params:", params);

      const response = await api.get("/counselling-sessions/stats", { params });
      console.log("✅ Counselling stats response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch counselling stats:", error);
      throw error;
    }
  },

  // Get meetings with optional filters
  getMeetings: async (params = {}) => {
    try {
      console.log("📅 Fetching meetings with params:", params);

      const response = await api.get("/meetings", { params });
      console.log("✅ Meetings response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch meetings:", error);
      throw error;
    }
  },

  // Create or update a meeting
  upsertMeeting: async (meetingData) => {
    try {
      console.log("📅 Saving meeting data:", meetingData);

      const response = await api.post("/meetings", meetingData);
      console.log("✅ Meeting saved:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to save meeting:", error);
      throw error;
    }
  },

  // Delete a meeting
  deleteMeeting: async (meetingId) => {
    try {
      console.log("🗑️ Deleting meeting ID:", meetingId);

      const response = await api.delete(`/meetings/${meetingId}`);
      console.log("✅ Meeting deleted:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to delete meeting:", error);
      throw error;
    }
  },

  // Get all members (for meetings page)
  getAllMembers: async () => {
    try {
      console.log("🌐 API Call: Getting all members from /all-members");
      const response = await api.get("/all-members");
      console.log("📥 All members API response:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch all members:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
};

// Feeds service - ADD this service that's missing
export const feedsService = {
  getFeeds: async (params = {}) => {
    try {
      console.log("📰 Fetching feeds with params:", params);
      const response = await api.get("/feeds", { params });
      console.log("✅ Feeds response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch feeds:", error);
      throw error;
    }
  },

  createFeed: async (feedData) => {
    try {
      console.log("📰 Creating feed:", feedData);
      const response = await api.post("/feeds", feedData);
      console.log("✅ Feed created:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to create feed:", error);
      throw error;
    }
  },

  updateFeed: async (feedId, feedData) => {
    try {
      console.log("📰 Updating feed:", feedId, feedData);
      const response = await api.put(`/feeds/${feedId}`, feedData);
      console.log("✅ Feed updated:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to update feed:", error);
      throw error;
    }
  },

  deleteFeed: async (feedId) => {
    try {
      console.log("🗑️ Deleting feed:", feedId);
      const response = await api.delete(`/feeds/${feedId}`);
      console.log("✅ Feed deleted:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to delete feed:", error);
      throw error;
    }
  },
};

export default api;
