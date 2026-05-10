import api from "./api";

export const authApi = {
  // 🆕 Register user
  register: async (data) => {
    const response = await api.post("/api/register/", data);

    // Store tokens with correct keys
    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
    }

    if (response.data.refresh) {
      localStorage.setItem("refresh_token", response.data.refresh);
    }

    return response.data;
  },

  // 🔐 Login user
  login: async (data) => {
    const response = await api.post("/api/login/", data);

    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);

    return response.data;
  },

  // 🚪 Logout
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  // 👤 Get current user
  getMe: () => api.get("/api/user/"),

  // 🔄 Refresh token
  refreshToken: async () => {
    const refresh = localStorage.getItem("refresh_token");

    const response = await api.post("/api/token/refresh/", {
      refresh,
    });

    localStorage.setItem("access_token", response.data.access);

    return response.data;
  },
};