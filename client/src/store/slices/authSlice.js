import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/authAPI'

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout()
      return null
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed')
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user')
    }
  }
)

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await authAPI.updatePassword(passwordData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Password update failed')
    }
  }
)

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
  registerLoading: false,
  registerError: null,
}

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
      state.registerError = null
    },
    setToken: (state, action) => {
      state.token = action.payload
      state.isAuthenticated = !!action.payload
      if (action.payload) {
        localStorage.setItem('token', action.payload)
      } else {
        localStorage.removeItem('token')
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.registerLoading = true
        state.registerError = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.registerLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(register.rejected, (state, action) => {
        state.registerLoading = false
        state.registerError = action.payload
      })

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
      })

    // Update password
    builder
      .addCase(updatePassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

// Export actions
export const { clearError, setToken, updateUser } = authSlice.actions

// Export selectors
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error
export const selectRegisterLoading = (state) => state.auth.registerLoading
export const selectRegisterError = (state) => state.auth.registerError

// Export reducer
export default authSlice.reducer 