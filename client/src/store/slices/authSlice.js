import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  login,
  logout as logoutAPI,
  getCurrentUser as getCurrentUserAPI,
} from "../../services/authAPI";

// Async thunks
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await login(credentials); // response = { success, data }
      // Debug log: login response
      console.log("[Login Thunk] Login response:", response);
      return response.data; // Return only the data object
    } catch (error) {
      return rejectWithValue(error.message || "Login failed");
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutAPI();
      return null;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Only proceed if we have a token
      const token = getState().auth.token || localStorage.getItem("token");
      if (!token) {
        throw new Error("No token available");
      }
      const response = await getCurrentUserAPI();
      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }
      return rejectWithValue(error);
    }
  },
);

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
  isSuperAdmin: false, // Add super admin flag
};

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: !!localStorage.getItem("token"),
    loading: false,
    error: null,
    isSuperAdmin: false, // Add super admin flag
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem("token", action.payload);
      } else {
        localStorage.removeItem("token");
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        state.isSuperAdmin = action.payload.user.role === "SUPER_ADMIN";

        // Store token and user in localStorage
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));

        // Debug log: token and user after login
        console.log(
          "[Login Reducer] Token set in localStorage:",
          localStorage.getItem("token"),
        );
        console.log(
          "[Login Reducer] User set in localStorage:",
          localStorage.getItem("user"),
        );

        // Store organization ID if available and not super admin
        if (
          action.payload.user.role !== "SUPER_ADMIN" &&
          action.payload.organization
        ) {
          localStorage.setItem(
            "organizationId",
            action.payload.organization.id,
          );
        } else {
          // Remove organization ID for super admin
          localStorage.removeItem("organizationId");
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.isSuperAdmin = false;
        // Clear all auth data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("organizationId");
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.isSuperAdmin = false;
        // Clear all auth data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("organizationId");
      })
      .addCase(logout.rejected, (state) => {
        // Even if server logout fails, clear local state
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.isSuperAdmin = false;
        // Clear all auth data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("organizationId");
      });

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data; // <-- unwrap .data
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      });
  },
});

// Export actions
export const { clearError, setToken, updateUser } = authSlice.actions;

// Export selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsSuperAdmin = (state) => state.auth.isSuperAdmin; // Add super admin selector

// Export reducer
export { authSlice };
