import api from "./api";

const weeklyMeetingsService = {
  // Create a new weekly meeting series
  createWeeklyMeeting: async (meetingData) => {
    console.log("Frontend: createWeeklyMeeting called with:", meetingData);
    try {
      const response = await api.post("/weekly-meetings", meetingData);
      console.log("Frontend: createWeeklyMeeting response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Frontend: Error creating weekly meeting:", error);
      throw error;
    }
  },

  // Get upcoming meetings for user's area (mobile app style)
  getUpcomingMeetings: async () => {
    try {
      const response = await api.get("/weekly-meetings/my-area/upcoming");
      return response.data;
    } catch (error) {
      console.error("Error getting upcoming meetings:", error);
      throw error;
    }
  },

  // Get detailed attendance report for a specific meeting
  getAttendanceReport: async (meetingId) => {
    try {
      const response = await api.get(
        `/weekly-meetings/${meetingId}/attendance-report`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting attendance report:", error);
      throw error;
    }
  },

  // Get simple area dashboard focused on attendance status
  getAreaDashboard: async (areaId) => {
    console.log("Frontend: getAreaDashboard called with areaId:", areaId);
    try {
      const response = await api.get(
        `/weekly-meetings/area/${areaId}/dashboard`
      );
      console.log("Frontend: getAreaDashboard response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Frontend: Error getting area dashboard:", error);
      throw error;
    }
  },

  // Update a meeting
  updateMeeting: async (meetingId, updateData) => {
    try {
      const response = await api.put(
        `/weekly-meetings/${meetingId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating meeting:", error);
      throw error;
    }
  },

  // Mark or update attendance for a meeting
  updateAttendance: async (meetingId, attendanceData) => {
    try {
      const response = await api.put(
        `/weekly-meetings/${meetingId}/attendance`,
        attendanceData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating attendance:", error);
      throw error;
    }
  },

  // Delete a meeting
  deleteMeeting: async (meetingId) => {
    try {
      const response = await api.delete(`/weekly-meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting meeting:", error);
      throw error;
    }
  },

  // Get all meeting series dashboard data for SuperAdmins
  getAllAreasDashboard: async () => {
    console.log("Frontend: getAllAreasDashboard called");
    try {
      const response = await api.get(`/weekly-meetings/dashboard`);
      console.log("Frontend: getAllAreasDashboard response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Frontend: Error getting all areas dashboard:", error);
      throw error;
    }
  },

  // Get recurring meetings for a specific parent meeting (past dates only)
  getRecurringMeetings: async (parentId) => {
    console.log(
      "Frontend: getRecurringMeetings called with parentId:",
      parentId
    );
    try {
      const response = await api.get(
        `/weekly-meetings/series/${parentId}/recurring`
      );
      console.log("Frontend: getRecurringMeetings response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Frontend: Error getting recurring meetings:", error);
      throw error;
    }
  },

  // Get detailed attendance details with committee member comparison (improved version)
  getAttendanceDetails: async (meetingId) => {
    console.log(
      "Frontend: getAttendanceDetails called with meetingId:",
      meetingId
    );
    try {
      const response = await api.get(
        `/weekly-meetings/${meetingId}/attendance`
      );
      console.log("Frontend: getAttendanceDetails response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Frontend: Error getting attendance details:", error);
      throw error;
    }
  },
};

export default weeklyMeetingsService;
