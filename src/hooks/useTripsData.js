import { useQuery } from "@tanstack/react-query";
import api from "../API/api";

/**
 * Fetch user profile (user's UserProfile ID and KYC status)
 */
export const useUserProfile = (enabled = true) => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const backendUrl =
        process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
      const meRes = await fetch(`${backendUrl}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!meRes.ok) {
        const error = await meRes.json();
        throw new Error(error?.detail || `Failed to fetch user profile`);
      }

      return await meRes.json();
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Fetch all trips
 */
export const useAllTrips = (enabled = true) => {
  return useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
    const backendUrl =
        process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
      const res = await api.get(`${backendUrl}/api/trips/`);
      return res.data || [];
    },
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute (reduced for faster updates)
  });
};

/**
 * Fetch recommended trips
 */
export const useRecommendedTrips = (enabled = true) => {
  return useQuery({
    queryKey: ["recommendedTrips"],
    queryFn: async () => {
      try {
        const backendUrl =
        process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
        const res = await api.get(`${backendUrl}/api/trips/recommended/?limit=9999`);
        return res.data?.results || res.data || [];
      } catch (err) {
        console.error("Failed to fetch recommended trips:", err);
        return [];
      }
    },
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute (reduced for faster updates)
  });
};

/**
 * Fetch trip history
 */
export const useTripHistory = (enabled = true) => {
  return useQuery({
    queryKey: ["tripHistory"],
    queryFn: async () => {
      try {
        const backendUrl =
        process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
        const res = await api.get(`${backendUrl}/api/trips/history/`);
        return res.data || [];
      } catch (err) {
        console.error("Failed to fetch trip history:", err);
        return [];
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch trip invitations
 */
export const useInvitations = (enabled = true) => {
  return useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const backendUrl =
        process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
      const res = await api.get(`${backendUrl}/api/trips/invitations/my/`);
      return res.data || [];
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for invitations)
  });
};

/**
 * Fetch cities for autocomplete
 */
export const useCities = (enabled = true) => {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const backendUrl =
        process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
      const res = await api.get(`${backendUrl}/api/trips/cities/`);
      return res.data || [];
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour (cities rarely change)
  });
};

/**
 * Fetch destination recommendations
 */
export const useDestinationRecommendations = (destination, enabled = true) => {
  return useQuery({
    queryKey: ["destinationRecommendations", destination],
    queryFn: async () => {
      const backendUrl =
        process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
      const res = await api.get(
        `${backendUrl}/api/trips/recommended/?destination=${encodeURIComponent(destination)}&limit=20`
      );
      return res.data?.results || res.data || [];
    },
    enabled: enabled && !!destination,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
