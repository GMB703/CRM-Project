import axios from 'axios'
import { store } from '../store'
import { logout } from '../store/slices/authSlice'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error

    // Handle authentication errors
    if (response?.status === 401) {
      localStorage.removeItem('token')
      store.dispatch(logout())
      toast.error('Session expired. Please login again.')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Handle server errors
    if (response?.status >= 500) {
      toast.error('Server error. Please try again later.')
      return Promise.reject(error)
    }

    // Handle validation errors
    if (response?.status === 422) {
      const errors = response.data.errors
      if (errors && Array.isArray(errors)) {
        errors.forEach(error => {
          toast.error(error.message || 'Validation error')
        })
      } else {
        toast.error(response.data.message || 'Validation error')
      }
      return Promise.reject(error)
    }

    // Handle other errors
    if (response?.data?.message) {
      toast.error(response.data.message)
    } else {
      toast.error('An error occurred. Please try again.')
    }

    return Promise.reject(error)
  }
)

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    updatePassword: '/auth/updatepassword',
    forgotPassword: '/auth/forgotpassword',
    resetPassword: (token) => `/auth/resetpassword/${token}`,
  },

  // Users
  users: {
    list: '/users',
    create: '/users',
    get: (id) => `/users/${id}`,
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`,
    profile: '/users/profile',
  },

  // Clients
  clients: {
    list: '/clients',
    create: '/clients',
    get: (id) => `/clients/${id}`,
    update: (id) => `/clients/${id}`,
    delete: (id) => `/clients/${id}`,
    import: '/clients/import',
    export: '/clients/export',
  },

  // Projects
  projects: {
    list: '/projects',
    create: '/projects',
    get: (id) => `/projects/${id}`,
    update: (id) => `/projects/${id}`,
    delete: (id) => `/projects/${id}`,
    duplicate: (id) => `/projects/${id}/duplicate`,
    archive: (id) => `/projects/${id}/archive`,
    restore: (id) => `/projects/${id}/restore`,
  },

  // Tasks
  tasks: {
    list: '/tasks',
    create: '/tasks',
    get: (id) => `/tasks/${id}`,
    update: (id) => `/tasks/${id}`,
    delete: (id) => `/tasks/${id}`,
    complete: (id) => `/tasks/${id}/complete`,
    assign: (id) => `/tasks/${id}/assign`,
    checklist: (id) => `/tasks/${id}/checklist`,
    timeLog: (id) => `/tasks/${id}/timelog`,
  },

  // Estimates
  estimates: {
    list: '/estimates',
    create: '/estimates',
    get: (id) => `/estimates/${id}`,
    update: (id) => `/estimates/${id}`,
    delete: (id) => `/estimates/${id}`,
    send: (id) => `/estimates/${id}/send`,
    accept: (id) => `/estimates/${id}/accept`,
    reject: (id) => `/estimates/${id}/reject`,
    duplicate: (id) => `/estimates/${id}/duplicate`,
    lineItems: (id) => `/estimates/${id}/line-items`,
  },

  // Invoices
  invoices: {
    list: '/invoices',
    create: '/invoices',
    get: (id) => `/invoices/${id}`,
    update: (id) => `/invoices/${id}`,
    delete: (id) => `/invoices/${id}`,
    send: (id) => `/invoices/${id}/send`,
    markPaid: (id) => `/invoices/${id}/mark-paid`,
    duplicate: (id) => `/invoices/${id}/duplicate`,
    payments: (id) => `/invoices/${id}/payments`,
  },

  // Documents
  documents: {
    list: '/documents',
    upload: '/documents/upload',
    get: (id) => `/documents/${id}`,
    delete: (id) => `/documents/${id}`,
    download: (id) => `/documents/${id}/download`,
  },

  // Communications
  communications: {
    list: '/communications',
    create: '/communications',
    get: (id) => `/communications/${id}`,
    update: (id) => `/communications/${id}`,
    delete: (id) => `/communications/${id}`,
    send: (id) => `/communications/${id}/send`,
  },

  // Dashboard
  dashboard: {
    overview: '/dashboard/overview',
    pipeline: '/dashboard/pipeline',
    revenue: '/dashboard/revenue',
    tasks: '/dashboard/tasks',
    notifications: '/dashboard/notifications',
  },

  // Reports
  reports: {
    clients: '/reports/clients',
    projects: '/reports/projects',
    revenue: '/reports/revenue',
    tasks: '/reports/tasks',
    export: '/reports/export',
  },

  // Settings
  settings: {
    get: '/settings',
    update: '/settings',
    company: '/settings/company',
    users: '/settings/users',
    roles: '/settings/roles',
    integrations: '/settings/integrations',
  },
}

// Generic API methods
export const apiService = {
  // GET request
  get: async (url, config = {}) => {
    const response = await api.get(url, config)
    return response.data
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    const response = await api.post(url, data, config)
    return response.data
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    const response = await api.put(url, data, config)
    return response.data
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    const response = await api.patch(url, data, config)
    return response.data
  },

  // DELETE request
  delete: async (url, config = {}) => {
    const response = await api.delete(url, config)
    return response.data
  },

  // File upload
  upload: async (url, formData, config = {}) => {
    const response = await api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    })
    return response.data
  },

  // File download
  download: async (url, filename, config = {}) => {
    const response = await api.get(url, {
      ...config,
      responseType: 'blob',
    })
    
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    return response.data
  },
}

// Export the api instance for direct use if needed
export default api 