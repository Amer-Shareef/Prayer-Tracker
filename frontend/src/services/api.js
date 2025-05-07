import axios from "axios";

// Create axios instance with default config
const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
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

// Auth service
export const authService = {
  login: (username, password) =>
    api.post("/auth/login", { username, password }),
  register: (userData) => api.post("/auth/register", userData),
  verifyToken: () => api.get("/auth/verify"),
};

// User service
export const userService = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (userData) => api.put("/users/profile", userData),
};

// Prayer service
export const prayerService = {
  getPrayers: () => api.get("/prayers"),
  recordPrayer: (data) => api.post("/prayers", data),
};

// Mosque service
export const mosqueService = {
  getMosques: () => api.get("/mosques"),
  getMosqueById: (id) => api.get(`/mosques/${id}`),
  createMosque: (data) => api.post("/mosques", data),
};

export default api;
