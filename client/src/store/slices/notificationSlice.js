import { createSlice } from '@reduxjs/toolkit'

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
}

// Notification slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Add notification
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      }
      state.notifications.unshift(notification)
      state.unreadCount += 1
    },

    // Mark notification as read
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        notification.readAt = new Date().toISOString()
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },

    // Mark all notifications as read
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true
          notification.readAt = new Date().toISOString()
        }
      })
      state.unreadCount = 0
    },

    // Remove notification
    removeNotification: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },

    // Clear all notifications
    clearNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
    },

    // Set notifications (from API)
    setNotifications: (state, action) => {
      state.notifications = action.payload
      state.unreadCount = action.payload.filter(n => !n.read).length
    },

    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload
    },

    // Set error state
    setError: (state, action) => {
      state.error = action.payload
    },

    // Clear error
    clearError: (state) => {
      state.error = null
    },
  },
})

// Export actions
export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications,
  setNotifications,
  setLoading,
  setError,
  clearError,
} = notificationSlice.actions

// Export selectors
export const selectNotifications = (state) => state.notifications.notifications
export const selectUnreadCount = (state) => state.notifications.unreadCount
export const selectNotificationsLoading = (state) => state.notifications.loading
export const selectNotificationsError = (state) => state.notifications.error
export const selectUnreadNotifications = (state) => 
  state.notifications.notifications.filter(n => !n.read)

// Export reducer
export default notificationSlice.reducer 