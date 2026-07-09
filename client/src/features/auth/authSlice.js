import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api, unwrap } from "../../services/api";
import { disconnectSocket } from "../../services/socket";

const initialState = {
  user: null,
  accessToken: localStorage.getItem("skillswap_token"),
  status: "idle",
  bootstrapped: false,
  error: null,
};

export const fetchCurrentUser = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/auth/me");
    return unwrap(response);
  } catch {
    try {
      const refresh = await api.post("/auth/refresh");
      return unwrap(refresh).user;
    } catch (refreshError) {
      return rejectWithValue(refreshError.response?.data?.message || "Session expired");
    }
  }
});

export const login = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/auth/login", payload);
    return unwrap(response);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Login failed");
  }
});

export const register = createAsyncThunk("auth/register", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/auth/register", payload);
    return unwrap(response);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Registration failed");
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await api.post("/auth/logout");
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    tokenReceived(state, action) {
      state.accessToken = action.payload;
    },
    sessionExpired(state) {
      state.user = null;
      state.accessToken = null;
      state.bootstrapped = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "succeeded";
        state.bootstrapped = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = "idle";
        state.bootstrapped = true;
        localStorage.removeItem("skillswap_token");
      })
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.status = "succeeded";
        state.bootstrapped = true;
        localStorage.setItem("skillswap_token", action.payload.accessToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.status = "succeeded";
        state.bootstrapped = true;
        localStorage.setItem("skillswap_token", action.payload.accessToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = "idle";
        state.bootstrapped = true;
        localStorage.removeItem("skillswap_token");
        disconnectSocket();
      });
  },
});

export const { tokenReceived, sessionExpired } = authSlice.actions;
export const selectAuth = (state) => state.auth;

export default authSlice.reducer;
