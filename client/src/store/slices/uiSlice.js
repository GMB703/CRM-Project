import { createSlice } from "@reduxjs/toolkit";

// Initial state
const initialState = {
  sidebarOpen: false,
  mobileSidebarOpen: false,
  theme: localStorage.getItem("theme") || "light",
  sidebarCollapsed: localStorage.getItem("sidebarCollapsed") === "true",
  notifications: [],
  modals: {
    createProject: false,
    createClient: false,
    createTask: false,
    createEstimate: false,
    createInvoice: false,
    confirmDelete: false,
    settings: false,
  },
  confirmDialog: {
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
    type: "danger", // 'danger', 'warning', 'info'
  },
  loading: {
    global: false,
    dashboard: false,
    clients: false,
    projects: false,
    tasks: false,
    estimates: false,
    invoices: false,
  },
  filters: {
    clients: {},
    projects: {},
    tasks: {},
    estimates: {},
    invoices: {},
  },
  sort: {
    clients: { field: "createdAt", direction: "desc" },
    projects: { field: "updatedAt", direction: "desc" },
    tasks: { field: "dueDate", direction: "asc" },
    estimates: { field: "createdAt", direction: "desc" },
    invoices: { field: "createdAt", direction: "desc" },
  },
  pagination: {
    clients: { page: 1, limit: 10, total: 0 },
    projects: { page: 1, limit: 10, total: 0 },
    tasks: { page: 1, limit: 10, total: 0 },
    estimates: { page: 1, limit: 10, total: 0 },
    invoices: { page: 1, limit: 10, total: 0 },
  },
};

// UI slice
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setMobileSidebarOpen: (state, action) => {
      state.mobileSidebarOpen = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem(
        "sidebarCollapsed",
        state.sidebarCollapsed.toString(),
      );
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem("sidebarCollapsed", action.payload.toString());
    },

    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", state.theme);
    },

    // Modal actions
    openModal: (state, action) => {
      const { modalName } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.modals, modalName)) {
        state.modals[modalName] = true;
      }
    },
    closeModal: (state, action) => {
      const { modalName } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.modals, modalName)) {
        state.modals[modalName] = false;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => {
        state.modals[key] = false;
      });
    },

    // Confirm dialog actions
    openConfirmDialog: (state, action) => {
      state.confirmDialog = {
        isOpen: true,
        ...action.payload,
      };
    },
    closeConfirmDialog: (state) => {
      state.confirmDialog = {
        ...state.confirmDialog,
        isOpen: false,
      };
    },

    // Loading actions
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.loading, key)) {
        state.loading[key] = value;
      }
    },

    // Filter actions
    setFilter: (state, action) => {
      const { entity, filters } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.filters, entity)) {
        state.filters[entity] = { ...state.filters[entity], ...filters };
      }
    },
    clearFilters: (state, action) => {
      const { entity } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.filters, entity)) {
        state.filters[entity] = {};
      }
    },
    clearAllFilters: (state) => {
      Object.keys(state.filters).forEach((key) => {
        state.filters[key] = {};
      });
    },

    // Sort actions
    setSort: (state, action) => {
      const { entity, field, direction } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.sort, entity)) {
        state.sort[entity] = { field, direction };
      }
    },

    // Pagination actions
    setPagination: (state, action) => {
      const { entity, pagination } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.pagination, entity)) {
        state.pagination[entity] = {
          ...state.pagination[entity],
          ...pagination,
        };
      }
    },
    resetPagination: (state, action) => {
      const { entity } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.pagination, entity)) {
        state.pagination[entity] = { page: 1, limit: 10, total: 0 };
      }
    },

    // Notification actions
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload,
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Reset UI state
    resetUI: (state) => {
      return {
        ...initialState,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      };
    },
  },
});

// Export actions
export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setTheme,
  toggleTheme,
  openModal,
  closeModal,
  closeAllModals,
  openConfirmDialog,
  closeConfirmDialog,
  setGlobalLoading,
  setLoading,
  setFilter,
  clearFilters,
  clearAllFilters,
  setSort,
  setPagination,
  resetPagination,
  addNotification,
  removeNotification,
  clearNotifications,
  resetUI,
} = uiSlice.actions;

// Export selectors
export const selectUI = (state) => state.ui;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectMobileSidebarOpen = (state) => state.ui.mobileSidebarOpen;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectTheme = (state) => state.ui.theme;
export const selectModals = (state) => state.ui.modals;
export const selectConfirmDialog = (state) => state.ui.confirmDialog;
export const selectLoading = (state) => state.ui.loading;
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectFilters = (state) => state.ui.filters;
export const selectSort = (state) => state.ui.sort;
export const selectPagination = (state) => state.ui.pagination;
export const selectNotifications = (state) => state.ui.notifications;

// Helper selectors
export const selectModalOpen = (modalName) => (state) =>
  state.ui.modals[modalName];
export const selectEntityLoading = (entity) => (state) =>
  state.ui.loading[entity];
export const selectEntityFilters = (entity) => (state) =>
  state.ui.filters[entity];
export const selectEntitySort = (entity) => (state) => state.ui.sort[entity];
export const selectEntityPagination = (entity) => (state) =>
  state.ui.pagination[entity];

// Export reducer
export { uiSlice };
