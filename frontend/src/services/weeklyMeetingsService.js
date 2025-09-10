import api from "./api";

const weeklyMeetingsService = {
  // Get all weekly meetings with attendance stats
  getWeeklyMeetings: async (params = {}) => {
    try {
      console.log("📤 Fetching weekly meetings with params:", params);
      const response = await api.get("/weekly-meetings", { params });
      console.log("📥 Weekly meetings received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get weekly meetings error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while fetching weekly meetings",
        }
      );
    }
  },

  // Get current week's meeting
  getCurrentWeekMeeting: async (params = {}) => {
    try {
      console.log("📤 Fetching current week meeting with params:", params);
      const response = await api.get("/weekly-meetings/current", { params });
      console.log("📥 Current week meeting received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get current week meeting error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while fetching current week meeting",
        }
      );
    }
  },

  // Create weekly meeting
  createWeeklyMeeting: async (meetingData) => {
    try {
      console.log("📤 Creating weekly meeting:", meetingData);
      const response = await api.post("/weekly-meetings", meetingData);
      console.log("📥 Weekly meeting created:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Create weekly meeting error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while creating weekly meeting",
        }
      );
    }
  },

  // Get meeting details with attendance
  getMeetingDetails: async (meetingId) => {
    try {
      console.log("📤 Fetching meeting details for ID:", meetingId);
      const response = await api.get(`/weekly-meetings/${meetingId}`);
      console.log("📥 Meeting details received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get meeting details error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while fetching meeting details",
        }
      );
    }
  },

  // Update meeting
  updateWeeklyMeeting: async (meetingId, updateData) => {
    try {
      console.log("📤 Updating weekly meeting:", meetingId, updateData);
      const response = await api.put(
        `/weekly-meetings/${meetingId}`,
        updateData
      );
      console.log("📥 Weekly meeting updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Update weekly meeting error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while updating weekly meeting",
        }
      );
    }
  },

  // Mark attendance (for committee members)
  markAttendance: async (meetingId, attendanceData) => {
    try {
      console.log(
        "📤 Marking attendance for meeting:",
        meetingId,
        attendanceData
      );
      const response = await api.put(
        `/weekly-meetings/${meetingId}/attendance`,
        attendanceData
      );
      console.log("📥 Attendance marked:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Mark attendance error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while marking attendance",
        }
      );
    }
  },

  // Delete weekly meeting
  deleteWeeklyMeeting: async (meetingId) => {
    try {
      console.log("🗑️ Deleting weekly meeting:", meetingId);
      const response = await api.delete(`/weekly-meetings/${meetingId}`);
      console.log("✅ Weekly meeting deleted:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to delete weekly meeting:", error);
      throw error;
    }
  },

  // Helper function to create meetings for future weeks
  createFutureWeekMeeting: async (weeksAhead = 1, baseData = {}) => {
    try {
      // Calculate future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + weeksAhead * 7);

      // Set to next Sunday (or keep if already Sunday)
      const dayOfWeek = futureDate.getDay();
      if (dayOfWeek !== 0) {
        // 0 = Sunday
        futureDate.setDate(futureDate.getDate() + (7 - dayOfWeek));
      }

      const meetingData = {
        meeting_date: futureDate.toISOString().split("T")[0],
        meeting_time: baseData.meeting_time || "10:00",
        location: baseData.location || "",
        agenda: baseData.agenda || "",
        area_id: baseData.area_id,
      };

      return await weeklyMeetingsService.createWeeklyMeeting(meetingData);
    } catch (error) {
      console.error("❌ Create future week meeting error:", error);
      throw error;
    }
  },

  // Create multiple meetings for next month
  createNextMonthMeetings: async (baseData = {}) => {
    try {
      const meetings = [];
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      // Find all Sundays in next month
      const sundays = [];
      const lastDayOfMonth = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth() + 1,
        0
      );

      for (
        let date = new Date(nextMonth);
        date <= lastDayOfMonth;
        date.setDate(date.getDate() + 1)
      ) {
        if (date.getDay() === 0) {
          // Sunday
          sundays.push(new Date(date));
        }
      }

      // Create meetings for all Sundays
      for (const sunday of sundays) {
        try {
          const meetingData = {
            meeting_date: sunday.toISOString().split("T")[0],
            meeting_time: baseData.meeting_time || "10:00",
            location: baseData.location || "",
            agenda: baseData.agenda || "",
            area_id: baseData.area_id,
          };

          const result = await weeklyMeetingsService.createWeeklyMeeting(
            meetingData
          );
          meetings.push(result);
        } catch (error) {
          console.error(
            `❌ Failed to create meeting for ${sunday.toDateString()}:`,
            error
          );
          // Continue with other meetings even if one fails
        }
      }

      return {
        success: true,
        data: meetings,
        message: `Created ${meetings.length} meetings for next month`,
      };
    } catch (error) {
      console.error("❌ Create next month meetings error:", error);
      throw error;
    }
  },
};

export default weeklyMeetingsService;
