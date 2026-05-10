import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

const API = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // for Django session auth
});

// Add JWT token to request headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const loginUser = (data) => API.post("/api//login/", data);
export const getTrips = () => API.get("/api/trips/trips/");
export default API;