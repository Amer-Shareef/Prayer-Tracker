import api from "./api";

const feedsService = {
  // Get all feeds
  getAllFeeds: async (params = {}) => {
    try {
      console.log("📤 Fetching feeds with params:", params);
      const response = await api.get("/feeds", { params });
      console.log("📥 Feeds received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get feeds error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while fetching feeds",
        }
      );
    }
  },

  // Get feed by ID
  getFeedById: async (id) => {
    try {
      console.log(`📤 Fetching feed with ID: ${id}`);
      const response = await api.get(`/feeds/${id}`);
      console.log("📥 Feed received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get feed error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while fetching the feed",
        }
      );
    }
  },

  // Create new feed
  createFeed: async (feedData) => {
    try {
      console.log("📤 Creating new feed:", feedData);
      const response = await api.post("/feeds", feedData);
      console.log("📥 Feed created:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Create feed error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while creating feed",
        }
      );
    }
  },

  // Update feed
  updateFeed: async (id, feedData) => {
    try {
      console.log(`📤 Updating feed ${id}:`, feedData);
      const response = await api.put(`/feeds/${id}`, feedData);
      console.log("📥 Feed updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Update feed error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while updating feed",
        }
      );
    }
  },

  // Delete feed
  deleteFeed: async (id) => {
    try {
      console.log(`📤 Deleting feed with ID: ${id}`);
      const response = await api.delete(`/feeds/${id}`);
      console.log("📥 Feed deleted:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Delete feed error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while deleting feed",
        }
      );
    }
  },

  // Upload image to S3
  uploadImage: async (formData) => {
    try {
      console.log("📤 Uploading image to S3");
      const response = await api.post("/feeds/upload-image", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("📥 Image uploaded:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Upload image error:", error);
      throw (
        error.response?.data || {
          message: "An error occurred while uploading image",
        }
      );
    }
  },
};

export default feedsService;
