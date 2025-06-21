import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://13.60.193.171:5000/api",
});

export default axiosInstance;
