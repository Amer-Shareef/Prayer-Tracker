import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const memberService = {
  // Add a new member
  addMember: async (memberData) => {
    try {
      console.log("Sending member data to API:", memberData);

      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_BASE_URL}/members`, memberData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Add member error:", error);
      throw error.response?.data || {
        message: "An error occurred while adding the member",
      };
    }
  },

  // Get all members
  getMembers: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/members`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Get members error:", error);
      throw error.response?.data || {
        message: "An error occurred while fetching members",
      };
    }
  },

  // Delete a member
  deleteMember: async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${API_BASE_URL}/members/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || {
        message: "An error occurred while deleting the member",
      };
    }
  },

  // Change member status
  changeStatus: async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API_BASE_URL}/members/${id}/status`,
        { status },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw error.response?.data || {
        message: "An error occurred while changing member status",
      };
    }
  },
};

export default memberService;
