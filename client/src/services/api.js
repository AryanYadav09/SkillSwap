import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let storeRef;

export function attachStore(store) {
  storeRef = store;
}

api.interceptors.request.use((config) => {
  const token = storeRef?.getState?.().auth.accessToken || localStorage.getItem("skillswap_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry || originalRequest?.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const response = await api.post("/auth/refresh");
      const accessToken = response.data?.data?.accessToken;

      if (accessToken) {
        localStorage.setItem("skillswap_token", accessToken);
        storeRef?.dispatch({ type: "auth/tokenReceived", payload: accessToken });
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }

      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("skillswap_token");
      storeRef?.dispatch({ type: "auth/sessionExpired" });
      return Promise.reject(refreshError);
    }
  },
);

export function unwrap(response) {
  return response.data?.data ?? response.data;
}

export function getErrorMessage(error) {
  const details = error.response?.data?.details;

  if (details && typeof details === "object") {
    const firstMessage = Object.values(details).flat().find(Boolean);
    if (firstMessage) {
      return firstMessage;
    }
  }

  return error.response?.data?.message || error.message || "Something went wrong";
}
