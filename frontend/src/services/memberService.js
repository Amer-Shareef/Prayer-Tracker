import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://13.60.193.171:5000/api";

const memberService = {
  // Add a new member
  addMember: async (memberData) => {
    try {
      // Add default password for new members
      const dataToSend = {
        ...memberData,
        password: "password123", // Default password for new members
        role: "member", // Default role
      };

      // Log the data being sent for debugging
      console.log("Sending member data:", dataToSend);

      const response = await axios.post(`${API_BASE_URL}/members`, dataToSend, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Add member error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while adding the member",
        }
      );
    }
  },

  // Get all members for a mosque
  getMembers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/members`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      return response.data;
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
      const response = await axios.delete(`${API_BASE_URL}/members/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      return response.data;
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
      const response = await axios.patch(
        `${API_BASE_URL}/members/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "An error occurred while changing member status",
        }
      );
    }
  },
};

export default memberService;
