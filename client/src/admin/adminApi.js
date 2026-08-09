/**
 * adminApi — a thin wrapper around the main `api` instance that automatically
 * attaches the admin-specific access token from localStorage instead of the
 * regular user token. Used by all admin page components.
 */
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const adminApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("skillswap_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function unwrap(response) {
  return response.data?.data ?? response.data;
}

export function getErrorMessage(error) {
  const details = error.response?.data?.details;
  if (details && typeof details === "object") {
    const firstMessage = Object.values(details).flat().find(Boolean);
    if (firstMessage) return firstMessage;
  }
  return error.response?.data?.message || error.message || "Something went wrong";
}
