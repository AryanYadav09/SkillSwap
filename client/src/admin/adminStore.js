import { configureStore } from "@reduxjs/toolkit";
import adminReducer from "../features/admin/adminSlice";

export const adminStore = configureStore({
  reducer: {
    admin: adminReducer,
  },
});
