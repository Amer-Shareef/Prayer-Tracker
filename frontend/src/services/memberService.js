import { memberAPI, meetingsService } from "./api";

const memberService = {
  // Add a new member
  addMember: async (memberData) => {
    try {
      // Clean the data - remove confirmPassword before sending
      const { confirmPassword, ...dataToSend } = memberData;

      // Log the data being sent for debugging
      console.log("📤 Sending member data:", dataToSend);

      const response = await memberAPI.addMember(dataToSend);

      console.log("📥 Received response:", response);

      return response;
    } catch (error) {
      console.error("❌ Add member error:", error);

      // Extract meaningful error message
      if (error.response?.data?.message) {
        throw { message: error.response.data.message };
      } else if (error.response?.data) {
        throw error.response.data;
      } else {
        throw { message: "An error occurred while adding the member" };
      }
    }
  },

  // Get all members for a mosque
  getMembers: async () => {
    try {
      const response = await memberAPI.getMembers();
      return response;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "An error occurred while fetching members",
        }
      );
    }
  },

  // Delete a member
  deleteMember: async (id) => {
    try {
      const response = await memberAPI.deleteMember(id);
      return response;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "An error occurred while deleting the member",
        }
      );
    }
  },

  // Change member status
  changeStatus: async (id, status) => {
    try {
      const member = { status }; // Simplified - you may need to get full member data first
      const response = await memberAPI.updateMember(id, member);
      return response;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "An error occurred while changing member status",
        }
      );
    }
  },

  // Get members requiring counselling
  getMembersForCounselling: async () => {
    try {
      const response = await meetingsService.getMembersForCounselling();
      return response;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "An error occurred while fetching members for counselling",
        }
      );
    }
  },
};

export default memberService;
