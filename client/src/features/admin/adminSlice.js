import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api, unwrap } from "../../services/api";
import { disconnectSocket } from "../../services/socket";

const initialState = {
  admin: null,
  accessToken: localStorage.getItem("skillswap_admin_token"),
  status: "idle",
  bootstrapped: false,
  error: null,
};

export const fetchCurrentAdmin = createAsyncThunk(
  "admin/me",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("skillswap_admin_token")}`,
        },
      });
      const user = unwrap(response);
      if (user?.role !== "ADMIN") {
        return rejectWithValue("Not an admin account");
      }
      return user;
    } catch {
      return rejectWithValue("Session expired");
    }
  }
);

export const adminLogin = createAsyncThunk(
  "admin/login",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", payload);
      const data = unwrap(response);
      if (data?.user?.role !== "ADMIN") {
        // Immediately log out this non-admin session from main token
        return rejectWithValue(
          "Access denied. This portal is restricted to administrators only."
        );
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const adminLogout = createAsyncThunk("admin/logout", async () => {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignore
  }
});

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    adminSessionExpired(state) {
      state.admin = null;
      state.accessToken = null;
      state.bootstrapped = true;
      localStorage.removeItem("skillswap_admin_token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentAdmin.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCurrentAdmin.fulfilled, (state, action) => {
        state.admin = action.payload;
        state.status = "succeeded";
        state.bootstrapped = true;
        state.error = null;
      })
      .addCase(fetchCurrentAdmin.rejected, (state) => {
        state.admin = null;
        state.accessToken = null;
        state.status = "idle";
        state.bootstrapped = true;
        localStorage.removeItem("skillswap_admin_token");
      })
      .addCase(adminLogin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.admin = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.status = "succeeded";
        state.bootstrapped = true;
        localStorage.setItem("skillswap_admin_token", action.payload.accessToken);
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(adminLogout.fulfilled, (state) => {
        state.admin = null;
        state.accessToken = null;
        state.status = "idle";
        state.bootstrapped = true;
        localStorage.removeItem("skillswap_admin_token");
        disconnectSocket();
      });
  },
});

export const { adminSessionExpired } = adminSlice.actions;
export const selectAdmin = (state) => state.admin;

export default adminSlice.reducer;
