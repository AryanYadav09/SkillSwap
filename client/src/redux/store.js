import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
import { attachStore } from "../services/api";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

attachStore(store);
