import api from "./api";

export const kycApi = {
  // 📤 Submit KYC
  submitKYC: (formData) => {
    return api.post("kyc/", formData, {
      headers: {
        "Content-Type": "multipart/form-data", // important if uploading files
      },
    });
  },

  // 👤 Get logged-in user's KYC
  getMyKYC: () => {
    return api.get("/api/kyc/");
  },

  // 🔍 Get KYC by ID (admin use)
  getKYCById: (id) => {
    return api.get(`/api/kyc/${id}/`);
  },

  // ✅ Review KYC (admin)
  reviewKYC: (id, data) => {
    return api.patch(`/api/kyc/${id}/review/`, data);
  },
};  