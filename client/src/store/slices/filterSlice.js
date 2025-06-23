import { createSlice } from '@reduxjs/toolkit'

// Initial state
const initialState = {
  search: {
    clients: '',
    projects: '',
    tasks: '',
    estimates: '',
    invoices: '',
  },
  filters: {
    clients: {
      status: [],
      source: [],
      tags: [],
      dateRange: null,
    },
    projects: {
      status: [],
      stage: [],
      priority: [],
      assignee: [],
      dateRange: null,
    },
    tasks: {
      status: [],
      priority: [],
      assignee: [],
      project: [],
      dueDate: null,
    },
    estimates: {
      status: [],
      client: [],
      dateRange: null,
      amountRange: null,
    },
    invoices: {
      status: [],
      client: [],
      dateRange: null,
      amountRange: null,
    },
  },
  view: {
    clients: 'table', // 'table', 'grid', 'kanban'
    projects: 'table',
    tasks: 'kanban', // 'table', 'list', 'kanban'
    estimates: 'table',
    invoices: 'table',
  },
  columns: {
    clients: ['name', 'email', 'phone', 'status', 'source', 'createdAt'],
    projects: ['name', 'client', 'status', 'stage', 'budget', 'startDate'],
    tasks: ['title', 'project', 'assignee', 'status', 'priority', 'dueDate'],
    estimates: ['title', 'client', 'amount', 'status', 'createdAt'],
    invoices: ['number', 'client', 'amount', 'status', 'dueDate'],
  },
  sort: {
    clients: { field: 'createdAt', direction: 'desc' },
    projects: { field: 'updatedAt', direction: 'desc' },
    tasks: { field: 'dueDate', direction: 'asc' },
    estimates: { field: 'createdAt', direction: 'desc' },
    invoices: { field: 'createdAt', direction: 'desc' },
  },
  pagination: {
    clients: { page: 1, limit: 10, total: 0 },
    projects: { page: 1, limit: 10, total: 0 },
    tasks: { page: 1, limit: 10, total: 0 },
    estimates: { page: 1, limit: 10, total: 0 },
    invoices: { page: 1, limit: 10, total: 0 },
  },
  savedFilters: [],
  activeSavedFilter: null,
}

// Filter slice
const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // Search actions
    setSearch: (state, action) => {
      const { entity, value } = action.payload
      if (state.search.hasOwnProperty(entity)) {
        state.search[entity] = value
        // Reset pagination when search changes
        state.pagination[entity].page = 1
      }
    },
    clearSearch: (state, action) => {
      const { entity } = action.payload
      if (state.search.hasOwnProperty(entity)) {
        state.search[entity] = ''
        state.pagination[entity].page = 1
      }
    },
    clearAllSearch: (state) => {
      Object.keys(state.search).forEach(key => {
        state.search[key] = ''
        state.pagination[key].page = 1
      })
    },

    // Filter actions
    setFilter: (state, action) => {
      const { entity, filterKey, value } = action.payload
      if (state.filters.hasOwnProperty(entity) && state.filters[entity].hasOwnProperty(filterKey)) {
        state.filters[entity][filterKey] = value
        state.pagination[entity].page = 1
      }
    },
    addFilter: (state, action) => {
      const { entity, filterKey, value } = action.payload
      if (state.filters.hasOwnProperty(entity) && state.filters[entity].hasOwnProperty(filterKey)) {
        if (Array.isArray(state.filters[entity][filterKey])) {
          if (!state.filters[entity][filterKey].includes(value)) {
            state.filters[entity][filterKey].push(value)
          }
        } else {
          state.filters[entity][filterKey] = value
        }
        state.pagination[entity].page = 1
      }
    },
    removeFilter: (state, action) => {
      const { entity, filterKey, value } = action.payload
      if (state.filters.hasOwnProperty(entity) && state.filters[entity].hasOwnProperty(filterKey)) {
        if (Array.isArray(state.filters[entity][filterKey])) {
          state.filters[entity][filterKey] = state.filters[entity][filterKey].filter(v => v !== value)
        } else {
          state.filters[entity][filterKey] = null
        }
        state.pagination[entity].page = 1
      }
    },
    clearFilters: (state, action) => {
      const { entity } = action.payload
      if (state.filters.hasOwnProperty(entity)) {
        Object.keys(state.filters[entity]).forEach(key => {
          if (Array.isArray(state.filters[entity][key])) {
            state.filters[entity][key] = []
          } else {
            state.filters[entity][key] = null
          }
        })
        state.pagination[entity].page = 1
      }
    },
    clearAllFilters: (state) => {
      Object.keys(state.filters).forEach(entity => {
        Object.keys(state.filters[entity]).forEach(key => {
          if (Array.isArray(state.filters[entity][key])) {
            state.filters[entity][key] = []
          } else {
            state.filters[entity][key] = null
          }
        })
        state.pagination[entity].page = 1
      })
    },

    // View actions
    setView: (state, action) => {
      const { entity, view } = action.payload
      if (state.view.hasOwnProperty(entity)) {
        state.view[entity] = view
      }
    },

    // Column actions
    setColumns: (state, action) => {
      const { entity, columns } = action.payload
      if (state.columns.hasOwnProperty(entity)) {
        state.columns[entity] = columns
      }
    },
    toggleColumn: (state, action) => {
      const { entity, column } = action.payload
      if (state.columns.hasOwnProperty(entity)) {
        const index = state.columns[entity].indexOf(column)
        if (index > -1) {
          state.columns[entity].splice(index, 1)
        } else {
          state.columns[entity].push(column)
        }
      }
    },

    // Sort actions
    setSort: (state, action) => {
      const { entity, field, direction } = action.payload
      if (state.sort.hasOwnProperty(entity)) {
        state.sort[entity] = { field, direction }
      }
    },

    // Pagination actions
    setPagination: (state, action) => {
      const { entity, pagination } = action.payload
      if (state.pagination.hasOwnProperty(entity)) {
        state.pagination[entity] = { ...state.pagination[entity], ...pagination }
      }
    },
    setPage: (state, action) => {
      const { entity, page } = action.payload
      if (state.pagination.hasOwnProperty(entity)) {
        state.pagination[entity].page = page
      }
    },
    setLimit: (state, action) => {
      const { entity, limit } = action.payload
      if (state.pagination.hasOwnProperty(entity)) {
        state.pagination[entity].limit = limit
        state.pagination[entity].page = 1
      }
    },
    resetPagination: (state, action) => {
      const { entity } = action.payload
      if (state.pagination.hasOwnProperty(entity)) {
        state.pagination[entity] = { page: 1, limit: 10, total: 0 }
      }
    },

    // Saved filters actions
    saveFilter: (state, action) => {
      const { name, entity, filters, search, sort } = action.payload
      const savedFilter = {
        id: Date.now(),
        name,
        entity,
        filters: { ...filters },
        search: search || '',
        sort: { ...sort },
        createdAt: new Date().toISOString(),
      }
      state.savedFilters.push(savedFilter)
    },
    deleteSavedFilter: (state, action) => {
      state.savedFilters = state.savedFilters.filter(filter => filter.id !== action.payload)
      if (state.activeSavedFilter === action.payload) {
        state.activeSavedFilter = null
      }
    },
    applySavedFilter: (state, action) => {
      const filter = state.savedFilters.find(f => f.id === action.payload)
      if (filter) {
        state.filters[filter.entity] = { ...filter.filters }
        state.search[filter.entity] = filter.search
        state.sort[filter.entity] = { ...filter.sort }
        state.pagination[filter.entity].page = 1
        state.activeSavedFilter = filter.id
      }
    },
    clearActiveSavedFilter: (state) => {
      state.activeSavedFilter = null
    },

    // Reset all filters
    resetAllFilters: (state) => {
      return initialState
    },
  },
})

// Export actions
export const {
  setSearch,
  clearSearch,
  clearAllSearch,
  setFilter,
  addFilter,
  removeFilter,
  clearFilters,
  clearAllFilters,
  setView,
  setColumns,
  toggleColumn,
  setSort,
  setPagination,
  setPage,
  setLimit,
  resetPagination,
  saveFilter,
  deleteSavedFilter,
  applySavedFilter,
  clearActiveSavedFilter,
  resetAllFilters,
} = filterSlice.actions

// Export selectors
export const selectFilters = (state) => state.filters
export const selectSearch = (state) => state.filters.search
export const selectFiltersByEntity = (entity) => (state) => state.filters.filters[entity]
export const selectSearchByEntity = (entity) => (state) => state.filters.search[entity]
export const selectView = (state) => state.filters.view
export const selectColumns = (state) => state.filters.columns
export const selectSort = (state) => state.filters.sort
export const selectPagination = (state) => state.filters.pagination
export const selectSavedFilters = (state) => state.filters.savedFilters
export const selectActiveSavedFilter = (state) => state.filters.activeSavedFilter

// Helper selectors
export const selectEntityFilters = (entity) => (state) => ({
  search: state.filters.search[entity],
  filters: state.filters.filters[entity],
  view: state.filters.view[entity],
  columns: state.filters.columns[entity],
  sort: state.filters.sort[entity],
  pagination: state.filters.pagination[entity],
})

export const selectHasActiveFilters = (entity) => (state) => {
  const search = state.filters.search[entity]
  const filters = state.filters.filters[entity]
  
  if (search) return true
  
  return Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0
    return value !== null && value !== undefined
  })
}

// Export reducer
export default filterSlice.reducer 