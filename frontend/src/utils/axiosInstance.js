import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://13.60.193.171:5000/api",
});

export default axiosInstance;
